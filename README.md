# ZapVago

Micro SaaS de agendamento inteligente via WhatsApp para pequenos negócios de serviços (barbearias, salões, clínicas, manicures, pet shops, estúdios de tatuagem etc).

Diferenciais implementados: Prontuário Inteligente, Lista de Espera Ativa, Pré-Venda Inteligente, Painel de Sentimentos, Previsão de Faltas, Modo Feirão, Receita do Mês, Multilíngue, Modo Silencioso e Fidelidade Automática.

## Stack

Next.js 14 (App Router) + TailwindCSS + Recharts · Prisma + PostgreSQL · NextAuth.js · WhatsApp Business Cloud API · Claude API (Anthropic) · BullMQ + Redis.

## Rodando localmente

### 1. Pré-requisitos
- Node.js 20+
- PostgreSQL (local ou hospedado — ex: Railway, Supabase, Neon)
- Redis (opcional no início — só é necessário para os jobs agendados via BullMQ)

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

- `DATABASE_URL`: string de conexão do PostgreSQL
- `NEXTAUTH_SECRET`: gere com `openssl rand -base64 32`
- `MOCK_MODE`: deixe `"true"` para testar sem as chaves do WhatsApp/Claude — o sistema simula as respostas e loga no console o que seria enviado. Mude para `"false"` quando tiver as chaves reais.
- `WHATSAPP_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_VERIFY_TOKEN`: obtidos no provedor WhatsApp Business Cloud API (ex: 360dialog, WapBiz, ou diretamente na Meta)
- `CLAUDE_API_KEY`: chave da API da Anthropic (console.anthropic.com)
- `REDIS_URL`: necessário apenas se for usar o worker do BullMQ (lembretes, relatório mensal, lista de espera, feirões automáticos). Sem Redis, use as rotas `/api/cron/*` com um cron externo (ex: Vercel Cron, cron-job.org).

### 4. Banco de dados

```bash
npm run db:push     # cria as tabelas a partir do schema.prisma
npm run db:seed      # popula com a barbearia fake "Barbearia do Zé"
```

Login de teste após o seed: `ze@barbeariadoze.com.br` / `senha123`

### 5. Rodar

```bash
npm run dev
```

Acesse http://localhost:3000

Se for usar os jobs agendados via BullMQ (requer Redis), rode em outro terminal:

```bash
npm run worker
```

## Estrutura do projeto

```
prisma/schema.prisma       Modelo de dados completo (Business, Client, Appointment, Conversation, etc)
prisma/seed.ts              Dados fake para teste (barbearia com serviços, profissionais, clientes, agendamentos)
src/lib/                    Lógica de negócio: claude.ts, whatsapp.ts, prompt.ts, noshow.ts, loyalty.ts,
                             waiting-list.ts, silent-mode.ts, reports.ts, queue.ts, worker.ts
src/app/api/                Todas as rotas de API (auth, business, services, professionals, appointments,
                             clients, conversations, whatsapp/webhook, flash-sales, waiting-list, loyalty, reports)
src/app/(pages)             Landing, login, register, onboarding (wizard 4 etapas), dashboard e subpáginas
src/components/             Componentes de UI: AgendaGrid, modais, ConversationView, ClientProfile,
                             SentimentDashboard, ReportsDashboard, OnboardingWizard, etc.
src/middleware.ts           Protege /dashboard e as rotas de API sensíveis
```

## Sobre o MOCK_MODE

Como o WhatsApp Business e a API do Claude exigem contas próprias, o projeto vem configurado para
**simular** essas chamadas por padrão (`MOCK_MODE=true`):

- `src/lib/whatsapp.ts` apenas loga no console a mensagem que seria enviada.
- `src/lib/claude.ts` retorna respostas simuladas simples baseadas em palavras-chave (agendar, cancelar, etc).

Isso permite testar todo o fluxo (agenda, clientes, conversas, feirões, relatórios) sem gastar créditos
de API. Quando tiver as contas do WhatsApp Business (via 360dialog, WapBiz ou Meta direto) e da Anthropic,
basta preencher as chaves no `.env` e mudar `MOCK_MODE` para `"false"`.

## Deploy sugerido

- Frontend/API (Next.js): Vercel
- PostgreSQL + Redis + Worker do BullMQ: Railway ou Render
- Configure o webhook do WhatsApp para apontar para `https://seu-dominio.com/api/whatsapp/webhook`
- Configure um cron externo (Vercel Cron ou similar) para chamar `/api/cron/reminders` a cada 15-30min
  e `/api/cron/monthly-report` no dia 1 de cada mês, caso não esteja usando o worker do BullMQ.

## Planos

| Plano | Preço | Limite |
|---|---|---|
| Grátis | R$ 0/mês | 50 agendamentos/mês, 1 profissional |
| Pro | R$ 147/mês | Ilimitado, 5 profissionais, lista de espera, fidelidade básico |
| Business | R$ 297/mês | Tudo ilimitado + feirões, sentimentos, previsão de faltas, multilíngue |

(A lógica de cobrança/limites por plano não está implementada neste scaffold — é o próximo passo natural,
via Stripe ou similar, checando `Business.plan` antes de criar agendamentos/profissionais.)
