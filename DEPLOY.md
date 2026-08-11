# Deploy do ZapVago — Vercel + Railway

Guia passo a passo para publicar o ZapVago num link de verdade, acessível por qualquer pessoa,
sem precisar instalar nada localmente. Frontend + API no Vercel, banco de dados e Redis no Railway.

Tempo estimado: 30-45 minutos. Custo: os planos gratuitos do Vercel e Railway cobrem bem o início;
o Railway cobra a partir de ~US$5/mês de uso quando o app começa a ter tráfego real.

---

## 0. Pré-requisitos

- Conta no [GitHub](https://github.com) (gratuita)
- Conta no [Vercel](https://vercel.com) (gratuita, pode entrar com login do GitHub)
- Conta no [Railway](https://railway.app) (gratuita para começar, pede cartão depois de um tempo de uso)
- Conta na [Anthropic Console](https://console.anthropic.com) para pegar a chave do Claude
- Conta em um provedor de WhatsApp Business Cloud API — recomendo [360dialog](https://www.360dialog.com) para começar

---

## 1. Subir o código pro GitHub

O Vercel só publica a partir de um repositório Git.

1. Extraia o `zapvago.zip` numa pasta no seu computador.
2. Crie um repositório novo (vazio) no GitHub, ex: `zapvago`.
3. No terminal, dentro da pasta `zapvago`:

```bash
git init
git add .
git commit -m "ZapVago - scaffold inicial"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/zapvago.git
git push -u origin main
```

---

## 2. Criar o banco de dados e o Redis no Railway

1. Entre em [railway.app](https://railway.app) e crie um **New Project**.
2. Dentro do projeto, clique em **New** → **Database** → **PostgreSQL**. O Railway já sobe o banco e gera a `DATABASE_URL` sozinho.
3. Clique em **New** novamente → **Database** → **Redis**. Isso gera a `REDIS_URL`.
4. Em cada um dos dois serviços (Postgres e Redis), abra a aba **Variables** (ou **Connect**) e copie a *connection string* completa — você vai colar essas duas URLs no Vercel daqui a pouco.

> Dica: guarde as duas URLs num bloco de notas por enquanto, você vai usá-las na Etapa 4.

---

## 3. Criar as contas de API que o app consome

### Claude (Anthropic)
1. Entre em [console.anthropic.com](https://console.anthropic.com) → **API Keys** → **Create Key**.
2. Copie a chave (começa com `sk-ant-...`) — só aparece uma vez.

### WhatsApp Business Cloud API (via 360dialog)
1. Crie uma conta em [360dialog](https://www.360dialog.com) e siga o fluxo de ativação do número de WhatsApp Business do seu negócio (eles pedem verificação do número e aprovação da Meta — pode levar de 1 a alguns dias).
2. Depois de aprovado, o painel do 360dialog te dá o `WHATSAPP_API_TOKEN` e o `WHATSAPP_PHONE_NUMBER_ID`.
3. Defina você mesmo um `WHATSAPP_VERIFY_TOKEN` — pode ser qualquer string aleatória, ex: `zapvago-verify-8k2j`. Você vai usar o mesmo valor na Etapa 6.

Se ainda não tiver essa conta aprovada, sem problema: publique o app mesmo assim com `MOCK_MODE=true` e troque depois — nenhuma outra etapa deste guia muda.

---

## 4. Publicar no Vercel

1. Entre em [vercel.com/new](https://vercel.com/new) e importe o repositório `zapvago` que você acabou de subir no GitHub.
2. Na tela de configuração do projeto, abra **Environment Variables** e adicione, uma por uma:

| Nome | Valor |
|---|---|
| `DATABASE_URL` | a connection string do Postgres (Etapa 2) |
| `REDIS_URL` | a connection string do Redis (Etapa 2) |
| `NEXTAUTH_SECRET` | gere com `openssl rand -base64 32` no terminal |
| `NEXTAUTH_URL` | `https://SEU-PROJETO.vercel.app` (ajuste depois de saber a URL final) |
| `NEXT_PUBLIC_APP_URL` | mesmo valor acima |
| `CLAUDE_API_KEY` | a chave da Anthropic (Etapa 3) |
| `WHATSAPP_API_TOKEN` | do 360dialog (Etapa 3) — pode deixar em branco por enquanto |
| `WHATSAPP_PHONE_NUMBER_ID` | do 360dialog (Etapa 3) — idem |
| `WHATSAPP_VERIFY_TOKEN` | o valor que você inventou (Etapa 3) |
| `MOCK_MODE` | `true` para começar testando sem gastar; troque para `false` quando tiver o WhatsApp/Claude configurados |
| `CRON_SECRET` | outra string aleatória, para proteger as rotas `/api/cron/*` |

3. Clique em **Deploy**. O Vercel builda e publica automaticamente (leva ~2 minutos).
4. Depois que o deploy terminar, copie a URL real que o Vercel te deu (ex: `zapvago-abcd.vercel.app`) e volte em **Settings → Environment Variables** para corrigir `NEXTAUTH_URL` e `NEXT_PUBLIC_APP_URL` com essa URL certa. Redesploy (Vercel faz isso automaticamente ao salvar a variável, ou clique em **Redeploy**).

---

## 5. Criar as tabelas no banco de produção

O Prisma precisa rodar `db push` contra o Postgres do Railway pelo menos uma vez. Do seu computador:

```bash
cd zapvago
echo 'DATABASE_URL="cole aqui a mesma URL do Railway"' > .env
npm install
npm run db:push
npm run db:seed   # opcional — cria a barbearia de teste "Barbearia do Zé"
```

Isso cria as tabelas direto no banco que o app publicado no Vercel está usando.

---

## 6. Conectar o webhook do WhatsApp

Assim que tiver a conta do 360dialog aprovada:

1. No painel do provedor, configure a **Callback URL** (webhook) como:
   `https://SEU-PROJETO.vercel.app/api/whatsapp/webhook`
2. No campo **Verify Token**, cole o mesmo valor que você colocou em `WHATSAPP_VERIFY_TOKEN`.
3. Salve — o provedor faz uma checagem GET automática; se o token bater, aparece "verificado".
4. No Vercel, mude `MOCK_MODE` para `false` e redesploy.

A partir daqui, mensagens reais no WhatsApp do negócio chegam no `/api/whatsapp/webhook` e o Claude responde de verdade.

---

## 7. Jobs agendados (lembretes e relatório mensal)

Como o Vercel não mantém um processo rodando 24h (é serverless), o worker do BullMQ (`npm run worker`) não roda lá.
Duas opções:

**Opção simples — Vercel Cron** (recomendada para começar):
Crie um arquivo `vercel.json` na raiz do projeto:

```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/monthly-report", "schedule": "0 8 1 * *" }
  ]
}
```

Essas rotas já existem no projeto e checam o header `Authorization: Bearer CRON_SECRET` — o Vercel Cron envia isso automaticamente quando `CRON_SECRET` está configurado nas variáveis de ambiente do projeto.

**Opção completa — worker do BullMQ:** suba um serviço adicional no Railway (**New → Empty Service**, aponte pro mesmo repo, comando de start `npm run worker`). Mais robusto, mas não é necessário para começar a testar.

---

## 8. Testar

1. Acesse `https://SEU-PROJETO.vercel.app`, crie uma conta (ou use o login do seed).
2. Complete o onboarding.
3. Se o WhatsApp já estiver conectado: mande uma mensagem de um celular pro número do negócio e veja o bot responder.
4. Se ainda estiver em `MOCK_MODE=true`: as respostas do bot aparecem simuladas nos logs do Vercel (aba **Logs** do projeto), e você testa o resto do painel normalmente.

---

## Checklist rápido

- [ ] Código no GitHub
- [ ] Postgres + Redis criados no Railway
- [ ] Chave da Anthropic
- [ ] Conta WhatsApp Business (360dialog) — pode ficar para depois
- [ ] Projeto publicado no Vercel com todas as variáveis de ambiente
- [ ] `npm run db:push` rodado contra o banco de produção
- [ ] Webhook do WhatsApp apontando para `/api/whatsapp/webhook`
- [ ] `vercel.json` com os crons, se for usar essa opção
