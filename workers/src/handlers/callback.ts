/**
 * Callback Handler (Apps Script → Workers)
 * GET /oauth/callback
 */

import { Env, SessionData, AuthorizationCodeData } from '../types';
import { generateRandomToken } from '../crypto';

export async function handleCallback(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const params = url.searchParams;

  const sessionId = params.get('session_id');
  const email = params.get('email');
  const error = params.get('error');

  // Handle error from Apps Script
  if (error) {
    const errorDescription = params.get('error_description') || 'Unknown error';
    return new Response(
      JSON.stringify({
        error,
        error_description: errorDescription,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Validate parameters
  if (!sessionId || !email) {
    return new Response(
      JSON.stringify({
        error: 'invalid_request',
        error_description: 'Missing session_id or email',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Load session
  const sessionData = await env.KV.get(`session:${sessionId}`, 'json');
  if (!sessionData) {
    return new Response(
      JSON.stringify({
        error: 'invalid_request',
        error_description: 'Invalid or expired session',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const session = sessionData as SessionData;

  // Check expiration
  if (session.expiresAt < Date.now()) {
    return new Response(
      JSON.stringify({
        error: 'invalid_request',
        error_description: 'Session expired',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Generate authorization code
  const code = generateRandomToken();
  const now = Date.now();
  const authCode: AuthorizationCodeData = {
    code,
    clientId: session.clientId,
    redirectUri: session.redirectUri,
    scope: session.scope,
    email,
    codeChallenge: session.codeChallenge,
    codeChallengeMethod: session.codeChallengeMethod,
    nonce: session.nonce,
    createdAt: now,
    expiresAt: now + 600000, // 10 minutes
  };

  // Store authorization code in KV
  await env.KV.put(`authcode:${code}`, JSON.stringify(authCode), {
    expirationTtl: 600, // 10 minutes
  });

  // Delete session (one-time use)
  await env.KV.delete(`session:${sessionId}`);

  // Redirect to client with authorization code
  const redirectUrl = new URL(session.redirectUri);
  redirectUrl.searchParams.set('code', code);
  if (session.state) {
    redirectUrl.searchParams.set('state', session.state);
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl.toString(),
    },
  });
}
