/**
 * bbauth - RFC 6749準拠 OAuth 2.0 Provider
 * Cloudflare Workers Entry Point
 */

import { Env } from './types';
import { handleAuthorize } from './handlers/authorize';
import { handleCallback } from './handlers/callback';
import { handleToken } from './handlers/token';
import { handleUserInfo } from './handlers/userinfo';
import { handleDiscovery, handleJWKS } from './handlers/discovery';
import {
  handleSetupInit,
  handleClientRegister,
  handleClientList,
  handleClientDelete,
  handleProviderRegister,
} from './handlers/admin';
import {
  handleChatCreate,
  handleChatGet,
  handleChatList,
  handleChatUpdate,
  handleChatDelete,
  handleParticipantUpdate,
} from './handlers/chat';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': getAllowedOrigin(request, env),
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle OPTIONS (preflight)
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    let response: Response;

    try {
      // Route handling
      if (path === '/oauth/authorize' && method === 'GET') {
        response = await handleAuthorize(request, env);
      } else if (path === '/oauth/callback' && method === 'GET') {
        response = await handleCallback(request, env);
      } else if (path === '/oauth/token' && method === 'POST') {
        response = await handleToken(request, env);
      } else if (path === '/oauth/userinfo' && method === 'GET') {
        response = await handleUserInfo(request, env);
      } else if (path === '/.well-known/openid-configuration' && method === 'GET') {
        response = await handleDiscovery(request, env);
      } else if (path === '/.well-known/jwks.json' && method === 'GET') {
        response = await handleJWKS(request, env);
      } else if (path === '/setup/init' && method === 'POST') {
        response = await handleSetupInit(request, env);
      } else if (path === '/admin/client/register' && method === 'POST') {
        response = await handleClientRegister(request, env);
      } else if (path === '/admin/client/list' && method === 'GET') {
        response = await handleClientList(request, env);
      } else if (path.startsWith('/admin/client/delete/') && method === 'DELETE') {
        const clientId = path.split('/').pop()!;
        response = await handleClientDelete(request, env, clientId);
      } else if (path === '/admin/provider/register' && method === 'POST') {
        response = await handleProviderRegister(request, env);

      // ============================================================
      // Chat API Routes
      // ============================================================
      } else if (path === '/chat/new' && method === 'POST') {
        response = await handleChatCreate(request, env);
      } else if (path === '/chat/list' && method === 'GET') {
        response = await handleChatList(request, env);
      } else if (path === '/chat/update' && method === 'PUT') {
        response = await handleChatUpdate(request, env);
      } else if (path === '/chat/delete' && method === 'DELETE') {
        response = await handleChatDelete(request, env);
      } else if (path.startsWith('/chat/') && path.endsWith('/participants') && method === 'POST') {
        const link = path.split('/')[2];
        response = await handleParticipantUpdate(request, env, link);
      } else if (path.startsWith('/chat/') && method === 'GET' && !path.includes('/participants')) {
        const link = path.split('/').pop()!;
        response = await handleChatGet(request, env, link);

      } else if (path === '/' && method === 'GET') {
        // Root endpoint - API info
        response = new Response(
          JSON.stringify({
            name: 'flexio-api',
            version: '1.0.0',
            description: 'Flexio API - OAuth 2.0 Provider & Chat API',
            endpoints: {
              oauth: {
                authorization: '/oauth/authorize',
                token: '/oauth/token',
                userinfo: '/oauth/userinfo',
                discovery: '/.well-known/openid-configuration',
                jwks: '/.well-known/jwks.json',
              },
              chat: {
                create: 'POST /chat/new',
                get: 'GET /chat/:link',
                list: 'GET /chat/list',
                update: 'PUT /chat/update',
                delete: 'DELETE /chat/delete',
                participants: 'POST /chat/:link/participants',
              },
            },
          }, null, 2),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        response = new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Error:', error);
      response = new Response(
        JSON.stringify({
          error: 'server_error',
          error_description: 'Internal server error',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  },
};

function getAllowedOrigin(request: Request, env: Env): string {
  const origin = request.headers.get('Origin');
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || [];

  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }

  return allowedOrigins[0] || '*';
}
