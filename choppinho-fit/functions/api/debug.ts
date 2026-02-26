/**
 * GET /api/debug
 * Endpoint de debug para verificar configuração
 */

import { jsonResponse } from '../_middleware';

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  N8N_WEBHOOK_MAGIC_LINK?: string;
  ENVIRONMENT?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return jsonResponse({
    message: 'Debug info',
    environment: {
      SUPABASE_URL: !!context.env.SUPABASE_URL ? 'SET' : 'MISSING',
      SUPABASE_URL_PREFIX: context.env.SUPABASE_URL?.substring(0, 30) || 'undefined',
      SUPABASE_SERVICE_ROLE_KEY: !!context.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      SERVICE_KEY_PREFIX: context.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'undefined',
      N8N_WEBHOOK_MAGIC_LINK: !!context.env.N8N_WEBHOOK_MAGIC_LINK ? 'SET' : 'MISSING',
      WEBHOOK_URL: context.env.N8N_WEBHOOK_MAGIC_LINK || 'undefined',
      ENVIRONMENT: context.env.ENVIRONMENT || 'undefined',
    },
    timestamp: new Date().toISOString(),
    url: context.request.url,
  });
};
