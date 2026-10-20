import type { Env } from './types';
import { checkRateLimit } from './pipeline/rateLimiter';
import { handleHumanize } from './routes/humanize';
import { handleCompareMeaning } from './routes/compareMeaning';
import { handleDetect } from './routes/detect';
import { handlePlagiarism } from './routes/plagiarism';
import { handleHealth } from './routes/health';

function getCorsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || 'https://humanizetext-nine.vercel.app,http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((s) => s.trim());

  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = getCorsHeaders(request, env);

    // Handle OPTIONS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // Rate Limiting by client IP
    const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'anonymous-edge';
    const rateLimitCap = parseInt(env.RATE_LIMIT_PER_MINUTE || '15', 10);
    const rateCheck = checkRateLimit(clientIp, rateLimitCap);

    if (!rateCheck.allowed && pathname !== '/api/health') {
      const errRes = new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please wait a moment before sending another request.',
          retryAfterSeconds: rateCheck.resetSeconds,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateCheck.resetSeconds.toString(),
            ...corsHeaders,
          },
        }
      );
      return errRes;
    }

    try {
      let response: Response;

      if (request.method === 'POST' && pathname === '/api/humanize') {
        response = await handleHumanize(request, env);
      } else if (request.method === 'POST' && pathname === '/api/compare-meaning') {
        response = await handleCompareMeaning(request, env);
      } else if (request.method === 'POST' && pathname === '/api/detect') {
        response = await handleDetect(request, env);
      } else if (request.method === 'POST' && (pathname === '/api/plagiarism/check' || pathname === '/api/plagiarism')) {
        response = await handlePlagiarism(request, env);
      } else if (request.method === 'GET' && pathname === '/api/health') {
        response = await handleHealth(request, env);
      } else {
        response = new Response(
          JSON.stringify({ success: false, error: `Endpoint not found: ${request.method} ${pathname}` }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Merge CORS headers into response
      const newHeaders = new Headers(response.headers);
      for (const [key, value] of Object.entries(corsHeaders)) {
        newHeaders.set(key, value as string);
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'An internal error occurred while processing the request.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
};
