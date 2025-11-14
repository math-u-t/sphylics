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
import {
  handleCommentPost,
  handleCommentEdit,
  handleCommentDelete,
  handleCommentsGet,
} from './handlers/comment';
import {
  handleReactionAdd,
  handleReactionRemove,
  handleReactionList,
} from './handlers/reaction';
import {
  handleCommentReport,
  handleChatReport,
  handleReportsList,
  handleReportReview,
} from './handlers/report';
import {
  handleServiceStats,
  handleServiceDetail,
  handleNotificationList,
  handleAdminLogs,
} from './handlers/service';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { requireAdminToken } from './middleware/auth';

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

    // Rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, env);
    if (rateLimitResponse) {
      return rateLimitResponse;
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
      // Flexio API Routes
      // ============================================================

      // Chat Routes
      } else if (path === '/chat/new' && method === 'POST') {
        response = await handleChatCreate(request, env);
      } else if (path === '/chat/list' && method === 'GET') {
        response = await handleChatList(request, env);
      } else if (path === '/chat/reactions' && method === 'GET') {
        response = await handleReactionList(request, env);

      // Chat-specific routes (with :chatLink parameter)
      } else if (path.match(/^\/chat\/[^\/]+\/post$/) && method === 'POST') {
        const chatLink = path.split('/')[2];
        response = await handleCommentPost(request, env, chatLink);
      } else if (path.match(/^\/chat\/[^\/]+\/comment\/edit$/) && method === 'POST') {
        const chatLink = path.split('/')[2];
        response = await handleCommentEdit(request, env, chatLink);
      } else if (path.match(/^\/chat\/[^\/]+\/comment\/reaction$/) && method === 'POST') {
        const chatLink = path.split('/')[2];
        response = await handleReactionAdd(request, env, chatLink);
      } else if (path.match(/^\/chat\/[^\/]+\/join$/) && method === 'POST') {
        const chatLink = path.split('/')[2];
        response = await handleParticipantUpdate(request, env, chatLink);
      } else if (path.match(/^\/chat\/[^\/]+\/edit$/) && method === 'POST') {
        const chatLink = path.split('/')[2];
        response = await handleChatUpdate(request, env);
      } else if (path.match(/^\/chat\/[^\/]+\/del$/) && method === 'POST') {
        const chatLink = path.split('/')[2];
        response = await handleChatDelete(request, env);
      } else if (path.match(/^\/chat\/[^\/]+\/report$/) && method === 'POST') {
        const chatLink = path.split('/')[2];
        response = await handleChatReport(request, env, chatLink);
      } else if (path.match(/^\/chat\/[^\/]+\/comments$/) && method === 'GET') {
        const chatLink = path.split('/')[2];
        response = await handleCommentsGet(request, env, chatLink);

      // Comment-specific routes (with :chatLink and :commentId)
      } else if (path.match(/^\/chat\/[^\/]+\/del\/[^\/]+$/) && method === 'POST') {
        const parts = path.split('/');
        const chatLink = parts[2];
        const commentId = parts[4];
        response = await handleCommentDelete(request, env, chatLink, commentId);
      } else if (path.match(/^\/chat\/[^\/]+\/comment\/[^\/]+\/report$/) && method === 'POST') {
        const parts = path.split('/');
        const chatLink = parts[2];
        const commentId = parts[4];
        response = await handleCommentReport(request, env, chatLink, commentId);
      } else if (path.match(/^\/chat\/[^\/]+\/comment\/[^\/]+\/reaction$/) && method === 'DELETE') {
        const parts = path.split('/');
        const chatLink = parts[2];
        const commentId = parts[4];
        response = await handleReactionRemove(request, env, chatLink, commentId);

      // Admin Routes
      } else if (path === '/admin/reports' && method === 'GET') {
        const authResult = await requireAdminToken(request, env);
        if (authResult instanceof Response) {
          response = authResult;
        } else {
          response = await handleReportsList(request, env);
        }
      } else if (path.match(/^\/admin\/report\/[^\/]+\/review$/) && method === 'POST') {
        const authResult = await requireAdminToken(request, env);
        if (authResult instanceof Response) {
          response = authResult;
        } else {
          const reportId = path.split('/')[3];
          response = await handleReportReview(request, env, reportId, authResult.userName);
        }

      // Service Routes
      } else if (path === '/service/stats' && method === 'POST') {
        response = await handleServiceStats(request, env);
      } else if (path === '/service/detail' && method === 'POST') {
        response = await handleServiceDetail(request, env);
      } else if (path === '/service/admin' && method === 'POST') {
        response = await handleAdminLogs(request, env);
      } else if (path === '/notification/bbauth' && method === 'POST') {
        response = await handleNotificationList(request, env);

      // Legacy routes (backward compatibility)
      } else if (path === '/chat/update' && method === 'PUT') {
        response = await handleChatUpdate(request, env);
      } else if (path === '/chat/delete' && method === 'DELETE') {
        response = await handleChatDelete(request, env);
      } else if (path.startsWith('/chat/') && path.endsWith('/participants') && method === 'POST') {
        const link = path.split('/')[2];
        response = await handleParticipantUpdate(request, env, link);
      } else if (path.startsWith('/chat/') && method === 'GET' && !path.includes('/')) {
        const link = path.split('/').pop()!;
        response = await handleChatGet(request, env, link);

      } else if (path === '/' && method === 'GET') {
        // Root endpoint - API info
        response = new Response(
          JSON.stringify({
            name: 'flexio-api',
            version: '1.0.0',
            description: 'Flexio API - Complete Anonymous Chat System with OAuth 2.0',
            endpoints: {
              oauth: {
                authorization: '/oauth/authorize',
                token: '/oauth/token',
                userinfo: '/oauth/userinfo',
                discovery: '/.well-known/openid-configuration',
                jwks: '/.well-known/jwks.json',
              },
              chat: {
                list: 'GET /chat/list',
                create: 'POST /chat/new',
                get: 'GET /chat/:chatLink',
                join: 'POST /chat/:chatLink/join',
                edit: 'POST /chat/:chatLink/edit',
                delete: 'POST /chat/:chatLink/del',
                report: 'POST /chat/:chatLink/report',
                authority: 'GET /chat/:chatLink/authority',
                comments: 'GET /chat/:chatLink/comments',
              },
              comment: {
                post: 'POST /chat/:chatLink/post',
                edit: 'POST /chat/:chatLink/comment/edit',
                delete: 'POST /chat/:chatLink/del/:commentId',
                report: 'POST /chat/:chatLink/comment/:commentId/report',
              },
              reaction: {
                add: 'POST /chat/:chatLink/comment/reaction',
                remove: 'DELETE /chat/:chatLink/comment/:commentId/reaction',
                list: 'GET /chat/reactions',
              },
              admin: {
                reports: 'GET /admin/reports',
                review: 'POST /admin/report/:reportId/review',
                logs: 'POST /service/admin',
              },
              service: {
                stats: 'POST /service/stats',
                detail: 'POST /service/detail',
                notifications: 'POST /notification/bbauth',
              },
            },
            features: [
              'Anonymous chat rooms with role-based permissions',
              'Comment system with reactions (21 permanent + 10 seasonal)',
              'Trust score calculation',
              'Report system for moderation',
              'Admin logging for transparency',
              'Rate limiting (60 req/min)',
              'JWT-based authentication (5 token types)',
            ],
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
