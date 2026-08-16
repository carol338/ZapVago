"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";

export function StartBookingForm({
  subdomain,
  businessName,
  colorPrimary,
  logo,
  serviceId,
  serviceName,
  flashSaleId,
  flashSaleName,
  flashSaleDiscount,
}: {
  subdomain: string;
  businessName: string;
  colorPrimary: string | null;
  logo: string | null;
  serviceId?: string;
  serviceName: string | null;
  flashSaleId?: string;
  flashSaleName?: string | null;
  flashSaleDiscount?: number | null;
}) {
  const router = useRouter();
  const primary = colorPrimary || "#00A884";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/${subdomain}/start-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, serviceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível iniciar o agendamento.");
      const suffix = flashSaleId ? `?flashSale=${flashSaleId}` : "";
      router.push(`/${subdomain}/agendar/${data.token}${suffix}`);
    } catch (err: any) {
      setError(err.message ?? "Algo deu errado. Tenta de novo.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B] p-6 text-[#FAFAFA]">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={businessName} className="mx-auto mb-3 h-14 w-14 rounded-xl object-cover" />
          ) : (
            <div
              className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold text-white"
              style={{ backgroundColor: primary }}
            >
              {businessName[0]}
            </div>
          )}
          <h1 className="text-lg font-bold">{businessName}</h1>
          <p className="mt-1 text-sm text-white/50">
            {serviceName ? `Agendar "${serviceName}"` : "Vamos agendar seu horário"}
          </p>
          {flashSaleName && (
            <div className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-400">
              🔥 {flashSaleName} — {flashSaleDiscount}% OFF
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div>
            <label className="mb-1 block text-xs text-white/50">Seu nome</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como podemos te chamar?"
              className="min-h-[44px] w-full rounded-lg border border-white/10 bg-black/30 px-3 text-[#FAFAFA] placeholder:text-white/30 focus:outline-none focus:ring-2"
              style={{ ["--tw-ring-color" as any]: primary }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Seu WhatsApp</label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="min-h-[44px] w-full rounded-lg border border-white/10 bg-black/30 px-3 text-[#FAFAFA] placeholder:text-white/30 focus:outline-none focus:ring-2"
              style={{ ["--tw-ring-color" as any]: primary }}
            />
          </div>

          {error && <p className="rounded-lg bg-red-500/10 p-2.5 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
            style={{ backgroundColor: primary }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Continuar"}
          </button>

          <p className="text-center text-xs text-white/30">
            Vamos te mandar a confirmação do agendamento nesse WhatsApp.
          </p>
        </form>

        <a
          href={`/${subdomain}`}
          className="mt-4 flex items-center justify-center gap-1 text-sm text-white/40 hover:text-white/60"
        >
          <MessageCircle size={14} /> Prefere falar com a gente? Volte e use o WhatsApp
        </a>
      </div>
    </div>
  );
}
