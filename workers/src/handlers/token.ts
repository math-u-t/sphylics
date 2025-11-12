/**
 * Token Endpoint Handler
 * POST /oauth/token
 */

import { Env, AuthorizationCodeData, RefreshTokenData, TokenResponse, JWTPayload } from '../types';
import { verifyPKCE, generateRandomToken, signJWT } from '../crypto';

export async function handleToken(
  request: Request,
  env: Env
): Promise<Response> {
  // Parse form data
  const formData = await request.formData();
  const grantType = formData.get('grant_type') as string;

  if (grantType === 'authorization_code') {
    return handleAuthorizationCodeGrant(formData, env);
  } else if (grantType === 'refresh_token') {
    return handleRefreshTokenGrant(formData, env);
  } else {
    return jsonError('unsupported_grant_type', 'Grant type not supported');
  }
}

async function handleAuthorizationCodeGrant(
  formData: FormData,
  env: Env
): Promise<Response> {
  const code = formData.get('code') as string;
  const redirectUri = formData.get('redirect_uri') as string;
  const clientId = formData.get('client_id') as string;
  const codeVerifier = formData.get('code_verifier') as string;
  const clientSecret = formData.get('client_secret') as string | null;

  // Validate required parameters
  if (!code || !redirectUri || !clientId || !codeVerifier) {
    return jsonError('invalid_request', 'Missing required parameters');
  }

  // Load authorization code
  const authCodeData = await env.KV.get(`authcode:${code}`, 'json');
  if (!authCodeData) {
    return jsonError('invalid_grant', 'Invalid or expired authorization code');
  }

  const authCode = authCodeData as AuthorizationCodeData;

  // Verify expiration
  if (authCode.expiresAt < Date.now()) {
    await env.KV.delete(`authcode:${code}`);
    return jsonError('invalid_grant', 'Authorization code expired');
  }

  // Verify client_id
  if (authCode.clientId !== clientId) {
    return jsonError('invalid_grant', 'Client ID mismatch');
  }

  // Verify redirect_uri
  if (authCode.redirectUri !== redirectUri) {
    return jsonError('invalid_grant', 'Redirect URI mismatch');
  }

  // Verify PKCE
  const pkceValid = await verifyPKCE(
    codeVerifier,
    authCode.codeChallenge,
    authCode.codeChallengeMethod
  );
  if (!pkceValid) {
    return jsonError('invalid_grant', 'PKCE verification failed');
  }

  // Load client
  const clientData = await env.KV.get(`client:${clientId}`, 'json');
  if (!clientData) {
    return jsonError('invalid_client', 'Invalid client');
  }

  const client = clientData as any;

  // Verify client_secret for confidential clients
  if (client.clientType === 'confidential' && client.clientSecret !== clientSecret) {
    return jsonError('invalid_client', 'Invalid client secret');
  }

  // Delete authorization code (one-time use)
  await env.KV.delete(`authcode:${code}`);

  // Generate tokens
  const now = Math.floor(Date.now() / 1000);
  const accessTokenExpiry = now + 3600; // 1 hour
  const refreshTokenExpiry = Date.now() + 2592000000; // 30 days

  const accessTokenPayload: JWTPayload = {
    iss: env.ISSUER_URL,
    sub: authCode.email,
    aud: clientId,
    iat: now,
    exp: accessTokenExpiry,
    scope: authCode.scope,
  };

  const accessToken = await signJWT(accessTokenPayload, env.JWT_PRIVATE_KEY);

  // Generate ID Token (if openid scope)
  let idToken: string | undefined;
  if (authCode.scope.includes('email')) {
    const idTokenPayload: JWTPayload = {
      iss: env.ISSUER_URL,
      sub: authCode.email,
      aud: clientId,
      iat: now,
      exp: accessTokenExpiry,
      email: authCode.email,
      email_verified: true,
      nonce: authCode.nonce,
    };
    idToken = await signJWT(idTokenPayload, env.JWT_PRIVATE_KEY);
  }

  // Generate refresh token
  const refreshToken = generateRandomToken();
  const refreshTokenData: RefreshTokenData = {
    token: refreshToken,
    clientId,
    email: authCode.email,
    scope: authCode.scope,
    createdAt: Date.now(),
    expiresAt: refreshTokenExpiry,
  };

  await env.KV.put(`refresh:${refreshToken}`, JSON.stringify(refreshTokenData), {
    expirationTtl: 2592000, // 30 days
  });

  // Return token response
  const response: TokenResponse = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
    id_token: idToken,
    scope: authCode.scope,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
  });
}

async function handleRefreshTokenGrant(
  formData: FormData,
  env: Env
): Promise<Response> {
  const refreshToken = formData.get('refresh_token') as string;
  const clientId = formData.get('client_id') as string;
  const scope = formData.get('scope') as string | null;

  // Validate required parameters
  if (!refreshToken || !clientId) {
    return jsonError('invalid_request', 'Missing required parameters');
  }

  // Load refresh token
  const refreshTokenData = await env.KV.get(`refresh:${refreshToken}`, 'json');
  if (!refreshTokenData) {
    return jsonError('invalid_grant', 'Invalid or expired refresh token');
  }

  const refreshData = refreshTokenData as RefreshTokenData;

  // Verify expiration
  if (refreshData.expiresAt < Date.now()) {
    await env.KV.delete(`refresh:${refreshToken}`);
    return jsonError('invalid_grant', 'Refresh token expired');
  }

  // Verify client_id
  if (refreshData.clientId !== clientId) {
    return jsonError('invalid_grant', 'Client ID mismatch');
  }

  // Determine scope (use original or subset)
  const finalScope = scope || refreshData.scope;
  const originalScopes = refreshData.scope.split(' ');
  const requestedScopes = finalScope.split(' ');
  const invalidScopes = requestedScopes.filter(s => !originalScopes.includes(s));
  if (invalidScopes.length > 0) {
    return jsonError('invalid_scope', 'Requested scope exceeds original scope');
  }

  // Generate new access token
  const now = Math.floor(Date.now() / 1000);
  const accessTokenExpiry = now + 3600; // 1 hour

  const accessTokenPayload: JWTPayload = {
    iss: env.ISSUER_URL,
    sub: refreshData.email,
    aud: clientId,
    iat: now,
    exp: accessTokenExpiry,
    scope: finalScope,
  };

  const accessToken = await signJWT(accessTokenPayload, env.JWT_PRIVATE_KEY);

  // Return token response
  const response: TokenResponse = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: finalScope,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
  });
}

function jsonError(error: string, description: string): Response {
  return new Response(
    JSON.stringify({
      error,
      error_description: description,
    }),
    {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
