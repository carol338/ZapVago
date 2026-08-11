/**
 * Utilitário central de modo mock.
 * Quando MOCK_MODE=true no .env, claude.ts e whatsapp.ts simulam respostas
 * em vez de chamar as APIs reais — útil para testar o fluxo sem gastar
 * créditos ou sem ainda ter as contas do WhatsApp Business / Anthropic.
 */
export const isMockMode = () => process.env.MOCK_MODE !== "false";
