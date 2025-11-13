/**
 * OpenID Connect Discovery & JWKS Handlers
 */

import { Env, OIDCDiscoveryDocument, JWKS } from '../types';
import { publicKeyToJWK } from '../crypto';

export async function handleDiscovery(
  request: Request,
  env: Env
): Promise<Response> {
  const discoveryDoc: OIDCDiscoveryDocument = {
    issuer: env.ISSUER_URL,
    authorization_endpoint: `${env.ISSUER_URL}/oauth/authorize`,
    token_endpoint: `${env.ISSUER_URL}/oauth/token`,
    userinfo_endpoint: `${env.ISSUER_URL}/oauth/userinfo`,
    jwks_uri: `${env.ISSUER_URL}/.well-known/jwks.json`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['ES256'],
    scopes_supported: ['email', 'drive.readonly', 'gmail.send'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
    code_challenge_methods_supported: ['S256'],
  };

  return new Response(JSON.stringify(discoveryDoc, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export async function handleJWKS(
  request: Request,
  env: Env
): Promise<Response> {
  const jwk = await publicKeyToJWK(env.JWT_PUBLIC_KEY);

  const jwks: JWKS = {
    keys: [jwk],
  };

  return new Response(JSON.stringify(jwks, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
