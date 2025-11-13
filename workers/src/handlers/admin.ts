/**
 * Admin Endpoints
 * - Client registration
 * - Initial setup
 */

import { Env, ClientData } from '../types';
import {
  generateES256KeyPair,
  exportPrivateKeyToPEM,
  exportPublicKeyToPEM,
  generateEd25519KeyPair,
  ed25519PublicKeyToProviderId,
} from '../crypto';

export async function handleSetupInit(
  request: Request,
  env: Env
): Promise<Response> {
  // Verify admin token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Generate ES256 key pair for JWT
  const { privateKey, publicKey } = await generateES256KeyPair();
  const privateKeyPEM = await exportPrivateKeyToPEM(privateKey);
  const publicKeyPEM = await exportPublicKeyToPEM(publicKey);

  return new Response(
    JSON.stringify(
      {
        message: 'Setup successful. Store these keys in your Cloudflare Workers secrets.',
        jwt_private_key: privateKeyPEM,
        jwt_public_key: publicKeyPEM,
        instructions: [
          'wrangler secret put JWT_PRIVATE_KEY',
          'wrangler secret put JWT_PUBLIC_KEY',
        ],
      },
      null,
      2
    ),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function handleClientRegister(
  request: Request,
  env: Env
): Promise<Response> {
  // Verify admin token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Parse request body
  const body = await request.json() as any;

  const clientId = body.clientId;
  const clientSecret = body.clientSecret || null;
  const redirectUris = body.redirectUris || [];
  const allowedScopes = body.allowedScopes || [];
  const clientType = body.clientType || 'public';
  const name = body.name || '';

  // Validate required fields
  if (!clientId || !redirectUris.length || !allowedScopes.length) {
    return new Response(
      JSON.stringify({
        error: 'invalid_request',
        error_description: 'Missing required fields: clientId, redirectUris, allowedScopes',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Create client data
  const client: ClientData = {
    clientId,
    clientSecret,
    redirectUris,
    allowedScopes,
    clientType: clientType as 'public' | 'confidential',
    name,
    createdAt: Date.now(),
  };

  // Store in KV
  await env.KV.put(`client:${clientId}`, JSON.stringify(client));

  return new Response(
    JSON.stringify({
      message: 'Client registered successfully',
      clientId,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function handleClientList(
  request: Request,
  env: Env
): Promise<Response> {
  // Verify admin token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // List all clients
  const list = await env.KV.list({ prefix: 'client:' });
  const clients = await Promise.all(
    list.keys.map(async (key) => {
      const data = await env.KV.get(key.name, 'json');
      return data;
    })
  );

  return new Response(JSON.stringify(clients, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function handleClientDelete(
  request: Request,
  env: Env,
  clientId: string
): Promise<Response> {
  // Verify admin token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Delete client
  await env.KV.delete(`client:${clientId}`);

  return new Response(
    JSON.stringify({
      message: 'Client deleted successfully',
      clientId,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function handleProviderRegister(
  request: Request,
  env: Env
): Promise<Response> {
  // Verify admin token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Parse request body
  const body = await request.json() as any;

  const appsScriptUrl = body.appsScriptUrl;
  const name = body.name || '';

  // Validate required fields
  if (!appsScriptUrl) {
    return new Response(
      JSON.stringify({
        error: 'invalid_request',
        error_description: 'Missing required field: appsScriptUrl',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Generate Ed25519 key pair for provider ID
  const { privateKey, publicKey } = await generateEd25519KeyPair();
  const providerId = ed25519PublicKeyToProviderId(publicKey);

  // Store provider data
  const providerData = {
    providerId,
    appsScriptUrl,
    publicKey: btoa(String.fromCharCode(...publicKey)),
    name,
    createdAt: Date.now(),
  };

  await env.KV.put(`provider:${providerId}`, JSON.stringify(providerData));

  return new Response(
    JSON.stringify({
      message: 'Provider registered successfully',
      providerId,
      privateKey: btoa(String.fromCharCode(...privateKey)),
      publicKey: btoa(String.fromCharCode(...publicKey)),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
