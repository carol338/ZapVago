/**
 * Wrapper de chamadas à API do Claude (Anthropic).
 * Usa Sonnet para conversas complexas (agendamento, remarcação, negociação)
 * e Haiku para mensagens simples (saudação, confirmações curtas).
 * Loga todas as chamadas para debug. Suporta MOCK_MODE para testar sem API key.
 */
import Anthropic from "@anthropic-ai/sdk";
import { isMockMode } from "@/lib/mock";
import { alertFailure } from "@/lib/alerting";

export interface ClaudeBotResponse {
  response: string;
  action: "reply" | "schedule" | "reschedule" | "cancel" | "transfer_to_human" | "add_to_waiting_list";
  sentiment: "positive" | "neutral" | "negative";
  language: string;
  data?: Record<string, any>;
}

const client = process.env.CLAUDE_API_KEY
  ? new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  : null;

const MODEL_COMPLEX = process.env.CLAUDE_MODEL_COMPLEX || "claude-sonnet-5";
const MODEL_SIMPLE = process.env.CLAUDE_MODEL_SIMPLE || "claude-haiku-4-5-20251001";

/** Heurística simples para decidir qual modelo usar por mensagem. */
function pickModel(userMessage: string): string {
  const simplePatterns = /^(oi|ol[áa]|bom dia|boa tarde|boa noite|obrigad[oa]|valeu|ok|beleza|sim|não|nao)[\s!.]*$/i;
  if (simplePatterns.test(userMessage.trim()) || userMessage.length < 12) {
    return MODEL_SIMPLE;
  }
  return MODEL_COMPLEX;
}

function mockResponse(userMessage: string): ClaudeBotResponse {
  // Simulação simples para permitir testar o fluxo sem chave de API real.
  const lower = userMessage.toLowerCase();
  if (lower.includes("cancelar")) {
    return {
      response: "Entendido! Vou cancelar seu horário. Pode confirmar seu nome? 📅",
      action: "cancel",
      sentiment: "neutral",
      language: "pt-BR",
      data: {},
    };
  }
  if (lower.includes("agend") || lower.includes("marcar") || lower.includes("corte")) {
    return {
      response: "Show! Temos horário amanhã às 10h ou às 15h com o Júlio. Qual prefere? ✂️",
      action: "reply",
      sentiment: "positive",
      language: "pt-BR",
      data: {},
    };
  }
  return {
    response: "Oi! Sou o ZapVago 🤖 Posso te ajudar a agendar, remarcar ou cancelar um horário. O que precisa?",
    action: "reply",
    sentiment: "neutral",
    language: "pt-BR",
    data: {},
  };
}

/**
 * Envia a mensagem do cliente + prompt de sistema para o Claude e retorna
 * a resposta já parseada como JSON estruturado (ver prompt.ts para o formato).
 */
export async function askClaude(systemPrompt: string, userMessage: string, history: any[] = [], businessId?: string): Promise<ClaudeBotResponse> {
  const startedAt = Date.now();

  if (isMockMode() || !client) {
    const result = mockResponse(userMessage);
    logClaudeCall({ mock: true, userMessage, model: "mock", durationMs: Date.now() - startedAt, result });
    return result;
  }

  const model = pickModel(userMessage);

  try {
    const messages = [
      ...history.map((h: any) => ({ role: (h.role === "client" ? "user" : "assistant") as "user" | "assistant", content: h.content })),
      { role: "user" as const, content: userMessage },
    ];

    const res = await client.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const textBlock = res.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const parsed = JSON.parse(extractJson(raw)) as ClaudeBotResponse;

    logClaudeCall({ mock: false, userMessage, model, durationMs: Date.now() - startedAt, result: parsed });
    return parsed;
  } catch (err) {
    console.error("[claude.ts] Erro ao chamar Claude:", err);
    logClaudeCall({ mock: false, userMessage, model, durationMs: Date.now() - startedAt, error: String(err) });
    if (businessId) {
      await alertFailure({ service: "claude", businessId, error: String(err), context: { model, userMessagePreview: userMessage.slice(0, 80) } });
    }
    return {
      response: "Desculpa, tive um probleminha técnico aqui 😅 Pode repetir sua mensagem ou já te transfiro pro dono.",
      action: "transfer_to_human",
      sentiment: "neutral",
      language: "pt-BR",
      data: {},
    };
  }
}

/** Extrai o primeiro bloco JSON válido de uma string (proteção contra texto extra). */
function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : "{}";
}

/** Log estruturado de todas as chamadas ao Claude, para debug e auditoria. */
function logClaudeCall(entry: Record<string, any>) {
  console.log(
    JSON.stringify({
      tag: "claude_call",
      timestamp: new Date().toISOString(),
      ...entry,
    })
  );
}
