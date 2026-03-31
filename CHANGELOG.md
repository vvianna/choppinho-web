# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.1.0] - 2026-03-05 (Em Desenvolvimento)

### 🎉 Novo

#### Sistema de Análise com IA
- **Análise Inteligente de Treinos**: Integração com Claude AI para gerar análises detalhadas e personalizadas de cada corrida
- **Resumo Automático**: Geração de resumo em 2-3 linhas para envio rápido via WhatsApp
- **Análise Detalhada**: Insights completos incluindo desempenho, frequência cardíaca, pontos fortes e recomendações
- **Insights Estruturados**: Métricas técnicas em formato JSON para processamento e visualização
- **Integração com claude-runner**: Usa microserviço separado para processamento com IA
- **Dados Climáticos**: Análise considera condições climáticas no momento do treino
- **Personalização**: Análise respeita personalidade configurada (default, offensive, light_zen)

#### Sistema de Comparação de Treinos
- **Comparação Manual**: Permite selecionar 2 ou mais atividades para comparar side-by-side
- **Comparação Automática**: Sistema identifica automaticamente treinos similares após cada sync
- **Métricas Comparativas**: Compara distância, pace, frequência cardíaca, elevação e eficiência
- **Tipos de Comparação**:
  - `similar_distance` - Treinos com distâncias parecidas
  - `weekly_best` - Melhores treinos da semana
  - `monthly_best` - Melhores treinos do mês
- **View Materializada**: Acesso otimizado para consultas externas
- **Trigger Automático**: Gera comparações automaticamente após inserção de novas atividades

### 🔧 Técnico

#### Banco de Dados
- **Novos campos em `activities`**:
  - `raw_data` (JSONB) - Dados completos do Strava
  - `analysis_summary` (TEXT) - Resumo da análise
  - `analysis_detailed` (TEXT) - Análise completa
  - `analysis_generated_at` (TIMESTAMP) - Quando foi gerada
  - `summary_sent` (BOOLEAN) - Flag de envio do resumo
  - `detailed_sent` (BOOLEAN) - Flag de envio da análise completa
  - `analysis_insights` (JSONB) - Insights estruturados

- **Nova tabela `activity_comparisons`**:
  - Armazena comparações entre atividades
  - Score de similaridade (0-1)
  - Métricas comparativas em JSON
  - Insights gerados

- **Funções SQL**:
  - `calculate_activity_similarity()` - Calcula similaridade entre duas atividades
  - `find_similar_activities()` - Encontra atividades similares automaticamente
  - `generate_automatic_comparisons()` - Gera comparações após novo treino
  - `refresh_comparisons_view()` - Atualiza view materializada

#### API Endpoints
- `POST /api/activities/analyze-v2` - Gera análise com IA via claude-runner
- `POST /api/activities/compare` - Compara múltiplas atividades
- `GET /api/activities/compare/:id` - Busca comparações existentes

#### Integração
- Suporte ao microserviço `claude-runner` para processamento com IA
- Configuração via variáveis de ambiente:
  - `CLAUDE_RUNNER_URL` - URL do serviço
  - `CLAUDE_RUNNER_TOKEN` - Token de autenticação

### 📦 Dependências
- Nenhuma nova dependência npm adicionada
- Requer `claude-runner` rodando como serviço externo

### 🔄 Migrações
- `v1.1.0-analysis-comparison-system.sql` - Adiciona estrutura completa para análises e comparações

### 📝 Documentação
- Novo arquivo de migration com script de rollback incluído
- Types TypeScript atualizados com novas interfaces
- Documentação inline nos endpoints

---

## [1.0.0] - 2026-02-26

### 🎉 Release Inicial

#### Funcionalidades Principais
- **Autenticação via Magic Link**: Login seguro através do WhatsApp
- **Dashboard de Estatísticas**: Visualização de KPIs, gráficos de evolução e distribuição semanal
- **Integração Strava**: Conexão OAuth e sincronização manual de atividades
- **Configurações de Usuário**: Perfil, apelidos personalizados e modo de personalidade
- **Provas Inscritas**: CRUD completo para gerenciar provas futuras
- **Responsividade Mobile**: Layout adaptado para todos os dispositivos

#### Componentes
- Dashboard com métricas principais (distância, corridas, pace médio, tempo total)
- Gráfico de evolução semanal/mensal
- Gráfico de distribuição por dia da semana
- Lista de atividades recentes
- Gerenciamento de provas com countdown

#### Infraestrutura
- Frontend: React 18 + TypeScript + Vite + TailwindCSS
- Backend: Cloudflare Pages Functions (Serverless)
- Database: Supabase (PostgreSQL)
- Autenticação: Magic Link via WhatsApp + PIN Code
- Integração: N8N (Webhooks) + Strava API
- Charts: Recharts

---

## Convenções

### Tipos de Mudança
- **🎉 Novo**: Novas funcionalidades
- **🔧 Técnico**: Mudanças técnicas/infraestrutura
- **🐛 Correção**: Correções de bugs
- **💄 Visual**: Mudanças de UI/UX
- **📦 Dependências**: Atualizações de dependências
- **🔄 Migrações**: Scripts de banco de dados
- **📝 Documentação**: Atualizações de documentação
- **⚠️ Breaking**: Mudanças que quebram compatibilidade

### Versionamento
Seguimos [Semantic Versioning](https://semver.org/):
- **MAJOR** (x.0.0): Mudanças incompatíveis na API
- **MINOR** (1.x.0): Funcionalidades adicionadas de forma compatível
- **PATCH** (1.1.x): Correções de bugs compatíveis