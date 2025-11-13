/**
 * UserInfo Endpoint Handler
 * GET /oauth/userinfo
 */

import { Env, UserInfoResponse } from '../types';
import { verifyJWT } from '../crypto';

export async function handleUserInfo(
  request: Request,
  env: Env
): Promise<Response> {
  // Extract Bearer token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonError('invalid_token', 'Missing or invalid Authorization header', 401);
  }

  const token = authHeader.substring(7);

  // Verify JWT
  const payload = await verifyJWT(token, env.JWT_PUBLIC_KEY);
  if (!payload) {
    return jsonError('invalid_token', 'Invalid or expired access token', 401);
  }

  // Check scope
  if (!payload.scope || !payload.scope.includes('email')) {
    return jsonError('insufficient_scope', 'Token does not have email scope', 403);
  }

  // Return user info
  const userInfo: UserInfoResponse = {
    sub: payload.sub,
    email: payload.sub,
    email_verified: true,
  };

  return new Response(JSON.stringify(userInfo), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function jsonError(error: string, description: string, status: number): Response {
  const wwwAuthenticate = `Bearer error="${error}", error_description="${description}"`;
  return new Response(
    JSON.stringify({
      error,
      error_description: description,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': wwwAuthenticate,
      },
    }
  );
}
