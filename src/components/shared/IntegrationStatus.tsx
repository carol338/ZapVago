"use client";

/**
 * Configurações → "Status das Integrações". Mostra a última falha real
 * (fora de MOCK_MODE) de cada integração externa — ver src/lib/alerting.ts,
 * que registra cada uma em IntegrationFailure. Sem falha registrada = ok;
 * ver nota em GET /api/integrations/status sobre o que isso significa.
 */
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

const SERVICE_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  mercadopago: "Mercado Pago",
  claude: "Claude AI",
};

// Só WhatsApp e Mercado Pago têm alerta vermelho dedicado — são os dois que
// afetam o cliente final diretamente (mensagem não chega, pagamento não
// processa). Claude AI continua com fallback de conversa (ver claude.ts),
// então não tem o mesmo alerta aqui.
const DOWN_MESSAGE: Record<string, string> = {
  whatsapp: "🔴 WhatsApp fora do ar. Seus clientes não estão recebendo mensagens. Verifique suas credenciais.",
  mercadopago: "🔴 Mercado Pago fora do ar. Pagamentos online estão desabilitados.",
};

interface StatusEntry {
  service: string;
  ok: boolean;
  isDown: boolean;
  lastFailureAt: string | null;
  lastError: string | null;
  count24h: number;
}

function formatFailureTime(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return `às ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return "ontem";
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

export function IntegrationStatus() {
  const [status, setStatus] = useState<StatusEntry[] | null>(null);

  useEffect(() => {
    fetch("/api/integrations/status").then((r) => r.json()).then(setStatus);
  }, []);

  if (!status) return null;

  return (
    <Card>
      <CardHeader><CardTitle>Status das Integrações</CardTitle></CardHeader>
      <div className="space-y-3">
        {status.map((s) => (
          <div key={s.service}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{SERVICE_LABEL[s.service] ?? s.service}</span>
              {s.ok ? (
                <span className="flex items-center gap-1.5 text-sm text-risk-low">
                  <CheckCircle2 size={15} /> Funcionando
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-risk-high">
                  <XCircle size={15} /> Falhou {formatFailureTime(s.lastFailureAt!)}
                </span>
              )}
            </div>
            {s.isDown && DOWN_MESSAGE[s.service] && (
              <p className="mt-2 rounded-lg bg-risk-high/10 p-2.5 text-xs font-medium text-risk-high">
                {DOWN_MESSAGE[s.service]}
              </p>
            )}
            {s.count24h > 0 && (
              <p className="mt-1 flex items-start gap-1.5 text-xs text-risk-mid">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                {SERVICE_LABEL[s.service] ?? s.service} falhou {s.count24h}x nas últimas 24h. Verifique suas credenciais.
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
