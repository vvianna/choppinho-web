const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar .env manualmente
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const SUPABASE_URL = env.PROJECT_URL || 'https://hlvebuymxlxhsnbbvvkc.supabase.co';
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
    console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrada no .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: 'choppinho' }
});

async function testConnection() {
    console.log('--- 🍺 Testando Conexão Choppinho Fit (JS) ---');
    console.log(`URL: ${SUPABASE_URL}`);

    try {
        // 1. Testar se a tabela auth_tokens existe
        console.log('\n1. Verificando tabela auth_tokens...');
        const { data: tableData, error: tableError } = await supabase
            .from('auth_tokens')
            .select('id')
            .limit(1);

        if (tableError) {
            console.error('❌ Erro ao acessar auth_tokens:', tableError.message);
            if (tableError.message.includes('relation "choppinho.auth_tokens" does not exist')) {
                console.log('💡 DICA: A tabela auth_tokens NÃO existe no schema choppinho. Execute o SQL da FASE 1!');
            }
        } else {
            console.log('✅ Tabela auth_tokens acessível!');
        }

        // 2. Testar se a tabela users existe e tem os novos campos
        console.log('\n2. Verificando campos na tabela users...');
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, phone_number, web_session_token')
            .limit(1);

        if (userError) {
            console.error('❌ Erro ao acessar users:', userError.message);
        } else {
            console.log('✅ Tabela users acessível e campos verificados!');
        }

    } catch (err) {
        console.error('❌ Erro inesperado:', err.message);
    }
}

testConnection();
