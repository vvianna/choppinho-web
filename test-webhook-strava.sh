#!/bin/bash

# Script para testar o webhook do N8N diretamente
# Uso: ./test-webhook-strava.sh

WEBHOOK_URL="https://webhook.vvmbrrj.com.br/webhook/strava-sync"

echo "🧪 Testando webhook N8N: $WEBHOOK_URL"
echo ""

# Payload de teste
PAYLOAD='{
  "user_id": "test-user-123",
  "strava_athlete_id": 12345678,
  "strava_access_token": "test_token",
  "strava_refresh_token": "test_refresh",
  "token_expires_at": "2026-12-31T23:59:59Z",
  "sync_since": "2026-01-28T00:00:00Z"
}'

echo "📦 Payload:"
echo "$PAYLOAD" | jq .
echo ""

echo "🚀 Enviando requisição..."
echo ""

# Fazer requisição com timeout de 30s
RESPONSE=$(curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\n%{http_code}" \
  --max-time 30 \
  -v 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo ""
echo "📊 Resultado:"
echo "Status HTTP: $HTTP_CODE"
echo ""
echo "Resposta:"
echo "$BODY" | grep -v "^*\|^<\|^>" | head -20
echo ""

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Webhook respondeu com sucesso!"
else
  echo "❌ Webhook retornou erro HTTP $HTTP_CODE"
  echo ""
  echo "Verifique:"
  echo "  1. O workflow está ativo no N8N?"
  echo "  2. A URL está correta?"
  echo "  3. O N8N está acessível?"
fi
