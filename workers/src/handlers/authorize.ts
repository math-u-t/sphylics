/**
 * Authorization Endpoint Handler
 * GET /oauth/authorize
 */

import { Env, SessionData, OAuthError } from '../types';
import { generateRandomToken } from '../crypto';

export async function handleAuthorize(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const params = url.searchParams;

  // Extract parameters
  const clientId = params.get('client_id');
  const redirectUri = params.get('redirect_uri');
  const responseType = params.get('response_type');
  const scope = params.get('scope');
  const state = params.get('state');
  const codeChallenge = params.get('code_challenge');
  const codeChallengeMethod = params.get('code_challenge_method');
  const nonce = params.get('nonce');
  const providerId = params.get('provider_id');

  // Validate required parameters
  if (!clientId || !redirectUri || !responseType || !scope || !codeChallenge || !codeChallengeMethod) {
    return redirectError(redirectUri || 'about:blank', 'invalid_request', 'Missing required parameters', state);
  }

  // Validate response_type
  if (responseType !== 'code') {
    return redirectError(redirectUri, 'unsupported_response_type', 'Only "code" response type is supported', state);
  }

  // Validate code_challenge_method
  if (codeChallengeMethod !== 'S256') {
    return redirectError(redirectUri, 'invalid_request', 'Only S256 code challenge method is supported', state);
  }

  // Load client
  const clientData = await env.KV.get(`client:${clientId}`, 'json');
  if (!clientData) {
    return redirectError(redirectUri, 'unauthorized_client', 'Invalid client_id', state);
  }

  const client = clientData as any;

  // Validate redirect_uri
  if (!client.redirectUris.includes(redirectUri)) {
    return redirectError(redirectUri, 'invalid_request', 'Invalid redirect_uri', state);
  }

  // Validate scopes
  const requestedScopes = scope.split(' ');
  const invalidScopes = requestedScopes.filter(
    (s: string) => !client.allowedScopes.includes(s)
  );
  if (invalidScopes.length > 0) {
    return redirectError(redirectUri, 'invalid_scope', `Invalid scopes: ${invalidScopes.join(', ')}`, state);
  }

  // Generate session
  const sessionId = generateRandomToken();
  const now = Date.now();
  const session: SessionData = {
    sessionId,
    clientId,
    redirectUri,
    scope,
    state: state || '',
    codeChallenge,
    codeChallengeMethod: 'S256',
    nonce: nonce || undefined,
    providerId: providerId || undefined,
    createdAt: now,
    expiresAt: now + 600000, // 10 minutes
  };

  // Store session in KV
  await env.KV.put(`session:${sessionId}`, JSON.stringify(session), {
    expirationTtl: 600, // 10 minutes
  });

  // Determine Apps Script URL
  let appsScriptUrl = env.APPS_SCRIPT_URL;
  if (providerId) {
    const providerData = await env.KV.get(`provider:${providerId}`, 'json');
    if (providerData) {
      const provider = providerData as any;
      appsScriptUrl = provider.appsScriptUrl;
    }
  }

  // Redirect to Apps Script
  const appsScriptRedirect = `${appsScriptUrl}?session_id=${sessionId}`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: appsScriptRedirect,
    },
  });
}

function redirectError(
  redirectUri: string,
  error: string,
  description: string,
  state?: string | null
): Response {
  const url = new URL(redirectUri);
  url.searchParams.set('error', error);
  url.searchParams.set('error_description', description);
  if (state) {
    url.searchParams.set('state', state);
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
    },
  });
}
