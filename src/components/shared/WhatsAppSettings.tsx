"use client";

/**
 * Conectar/reconectar o WhatsApp Business fora do onboarding — pra quem
 * pulou a etapa 2 no cadastro (ou precisa trocar credenciais depois).
 * Usa as mesmas rotas do onboarding: POST /api/business/whatsapp-config
 * (salva) e POST /api/business/whatsapp-test (testa de verdade mandando
 * uma mensagem pro WhatsApp do dono).
 */
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

type Status = "idle" | "saving" | "testing" | "success";

export function WhatsAppSettings() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [savedPhoneNumberId, setSavedPhoneNumberId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/business/whatsapp-config")
      .then((r) => r.json())
      .then((d) => {
        setConnected(!!d.connected);
        setSavedPhoneNumberId(d.phoneNumberId ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function testConnection() {
    setError(null);
    setStatus("testing");
    try {
      const res = await fetch("/api/business/whatsapp-test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Teste falhou.");
        setStatus("idle");
        return;
      }
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setError("Erro de rede ao testar a conexão.");
      setStatus("idle");
    }
  }

  async function saveConnection() {
    setError(null);
    const phoneId = phoneNumberId.trim();
    const token = accessToken.trim();
    if (!phoneId || !token) {
      setError("Preencha o Phone Number ID e o token de acesso.");
      return;
    }
    if (!/^\d+$/.test(phoneId)) {
      setError("Phone Number ID deve conter apenas números.");
      return;
    }
    if (token.length < 20) {
      setError("Token de acesso muito curto — confira se copiou o token completo.");
      return;
    }

    setStatus("saving");
    try {
      const saveRes = await fetch("/api/business/whatsapp-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumberId: phoneId, accessToken: token }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        setError(saveData.error ?? "Não foi possível salvar. Confira os dados e tente novamente.");
        setStatus("idle");
        return;
      }

      setStatus("testing");
      const testRes = await fetch("/api/business/whatsapp-test", { method: "POST" });
      const testData = await testRes.json();
      if (!testRes.ok) {
        setError(testData.error ?? "Credenciais salvas, mas o teste de conexão falhou. Confira os dados e tente novamente.");
        setStatus("idle");
        return;
      }

      setConnected(true);
      setSavedPhoneNumberId(phoneId);
      setEditing(false);
      setPhoneNumberId("");
      setAccessToken("");
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setError("Erro de rede ao conectar.");
      setStatus("idle");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>WhatsApp</CardTitle></CardHeader>
        <p className="text-sm text-foreground/40">Carregando...</p>
      </Card>
    );
  }

  const showForm = !connected || editing;

  return (
    <Card>
      <CardHeader><CardTitle>WhatsApp</CardTitle></CardHeader>

      {connected && !editing && (
        <div className="mb-4 flex items-center gap-2 text-sm text-zap-light">
          <CheckCircle2 size={18} />
          Conectado{savedPhoneNumberId ? ` — Phone Number ID: ${savedPhoneNumberId}` : ""}
        </div>
      )}

      {status === "success" && <p className="mb-3 text-sm text-zap-light">✅ Mensagem de teste enviada com sucesso!</p>}

      {showForm && !connected && (
        <div className="mb-4 rounded-xl border border-surface-border bg-background p-4 text-sm text-foreground/70">
          <p className="mb-2 font-medium text-foreground">Como conectar:</p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>
              Acesse{" "}
              <a href="https://business.facebook.com" target="_blank" rel="noreferrer" className="text-zap-light hover:underline">
                business.facebook.com
              </a>
            </li>
            <li>Crie ou selecione seu WhatsApp Business</li>
            <li>Vá em Configurações &gt; Números de telefone</li>
            <li>Copie o Phone Number ID e gere um token de acesso permanente</li>
          </ol>
        </div>
      )}

      {showForm && (
        <>
          <div className="mb-3">
            <Label>Phone Number ID</Label>
            <Input
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="123456789012345"
              disabled={status !== "idle"}
            />
          </div>
          <div className="mb-3">
            <Label>Token de acesso permanente</Label>
            <Input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="EAAG..."
              disabled={status !== "idle"}
            />
          </div>
        </>
      )}

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-risk-high/10 p-3 text-sm text-risk-high">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {showForm ? (
          <>
            <Button onClick={saveConnection} disabled={status !== "idle"}>
              {status === "saving" ? (
                <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={14} /> Salvando...</span>
              ) : status === "testing" ? (
                <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={14} /> Testando...</span>
              ) : (
                "Conectar"
              )}
            </Button>
            {editing && (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(false);
                  setError(null);
                  setPhoneNumberId("");
                  setAccessToken("");
                }}
              >
                Cancelar
              </Button>
            )}
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={testConnection} disabled={status !== "idle"}>
              {status === "testing" ? (
                <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={14} /> Testando...</span>
              ) : (
                "Testar conexão"
              )}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(true)}>Reconectar / trocar credenciais</Button>
          </>
        )}
      </div>
    </Card>
  );
}
