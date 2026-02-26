/**
 * POST /api/auth/request
 * Solicita magic link via WhatsApp
 *
 * Recebe: { phone_number: "+5521967076547" }
 * Retorna: { success: true, message: "..." }
 */

import { getSupabaseClient } from '../../shared/supabase';
import { jsonResponse, errorResponse, type Env } from '../../_middleware';

interface RequestBody {
  phone_number: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Parse body
    const body = await context.request.json() as RequestBody;
    const { phone_number } = body;

    // Validar formato do telefone brasileiro
    const phoneRegex = /^\+55\d{10,11}$/;
    if (!phone_number || !phoneRegex.test(phone_number)) {
      return errorResponse('Número de telefone inválido. Use formato: +5521967076547', 400);
    }

    // Conectar ao Supabase
    const supabase = getSupabaseClient(context.env);

    // Gerar token UUID e salvar em auth_tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('auth_tokens')
      .insert({
        phone_number,
        // token é gerado automaticamente pelo DEFAULT gen_random_uuid()
        // expires_at é gerado automaticamente (NOW() + 15 minutes)
      })
      .select('token')
      .single();

    if (tokenError || !tokenData) {
      console.error('Error creating auth token:', tokenError);
      return errorResponse('Erro ao gerar token de autenticação', 500);
    }

    const token = tokenData.token;

    // Montar magic link
    const magicLink = `https://choppinho-web.pages.dev/auth/verify?token=${token}`;
    // TODO: Em produção, usar a URL real do deploy

    // Chamar webhook N8N para enviar WhatsApp
    try {
      const webhookUrl = context.env.N8N_WEBHOOK_MAGIC_LINK;

      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number,
          token,
          magic_link: magicLink,
        }),
      });

      if (!webhookResponse.ok) {
        console.error('N8N webhook failed:', await webhookResponse.text());
        // Não falhar a requisição se o WhatsApp falhar
        // O token foi criado, usuário pode usar manualmente
      }
    } catch (webhookError) {
      console.error('Error calling N8N webhook:', webhookError);
      // Continuar mesmo se o webhook falhar
    }

    return jsonResponse({
      success: true,
      message: 'Magic link enviado para seu WhatsApp! Verifique suas mensagens.',
    });

  } catch (error) {
    console.error('Error in /api/auth/request:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
};
