/**
 * Página pública do negócio (vitrine) — /{subdomain}, ex: /barbearia-do-ze.
 * Server Component: não exige login, busca tudo direto no banco.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { MapPin, Clock, MessageCircle, ShieldCheck, CalendarCheck } from "lucide-react";

const DIAS: { key: string; label: string }[] = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

async function getBusiness(slug: string) {
  return prisma.business.findUnique({
    where: { slug },
    include: {
      services: { where: { active: true }, orderBy: { order: "asc" } },
      professionals: { where: { active: true } },
    },
  });
}

export async function generateMetadata({ params }: { params: { subdomain: string } }): Promise<Metadata> {
  const business = await getBusiness(params.subdomain);
  if (!business) return { title: "Negócio não encontrado — ZapVago" };
  return {
    title: `${business.name} — Agende online`,
    description: `Agende seu horário na ${business.name} pelo WhatsApp ou direto por aqui.`,
  };
}

function whatsappLink(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export default async function BusinessPublicPage({ params }: { params: { subdomain: string } }) {
  const business = await getBusiness(params.subdomain);
  if (!business) notFound();

  const settings = (business.settings as Record<string, any>) ?? {};
  const workingHours = settings.workingHours ?? {};
  const primary = business.colorPrimary || "#00A884";
  const secondary = business.colorSecondary || "#06CF9C";
  const waMessage = `Oi! Vim pelo link da ${business.name} e quero agendar um horário 🙂`;
  const waHref = whatsappLink(business.phone, waMessage);

  const initials = business.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div
      className="min-h-screen bg-[#0A0A0B] pb-36 text-[#FAFAFA] md:pb-0"
      style={{ ["--pub-primary" as any]: primary, ["--pub-secondary" as any]: secondary }}
    >
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-white/10">
        {business.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        ) : (
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: `linear-gradient(135deg, var(--pub-primary), var(--pub-secondary))` }}
          />
        )}
        <div className="relative mx-auto max-w-3xl px-4 py-10 text-center sm:py-14">
          <div className="mb-4 flex justify-center">
            {business.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logo}
                alt={business.name}
                className="h-20 w-20 rounded-2xl border border-white/10 object-cover shadow-lg"
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg"
                style={{ backgroundColor: "var(--pub-primary)" }}
              >
                {initials}
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold sm:text-4xl">{business.name}</h1>

          <span
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: `${primary}26`, color: "var(--pub-primary)" }}
          >
            <ShieldCheck size={14} /> Agendamento Online
          </span>

          <div className="mx-auto mt-5 flex max-w-md flex-col gap-2 text-sm text-white/70">
            {business.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(business.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 hover:text-white hover:underline"
              >
                <MapPin size={15} className="shrink-0" /> {business.address}
              </a>
            )}
            <WorkingHoursSummary workingHours={workingHours} />
          </div>

          <div className="mt-7 hidden justify-center gap-3 md:flex">
            <Link
              href={`/${business.slug}/agendar`}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: "var(--pub-primary)" }}
            >
              <CalendarCheck size={18} /> Agendar agora
            </Link>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 font-medium text-white transition-colors hover:bg-white/5"
            >
              <MessageCircle size={18} /> Agendar pelo WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* Serviços */}
      {business.services.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-10">
          <h2 className="mb-5 text-xl font-bold">Serviços</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {business.services.map((s) => (
              <div key={s.id} className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="flex h-28 items-center justify-center" style={{ backgroundColor: `${s.color}22` }}>
                  {s.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl" style={{ color: s.color }}>
                      ✂️
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <p className="font-semibold">{s.name}</p>
                  {s.description && <p className="text-sm text-white/50">{s.description}</p>}
                  <p className="text-sm text-white/50">{s.duration} min</p>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="text-lg font-bold" style={{ color: "var(--pub-primary)" }}>
                      {formatCurrency(s.price)}
                    </span>
                    <Link
                      href={`/${business.slug}/agendar?service=${s.id}`}
                      className="flex min-h-[44px] items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105"
                      style={{ backgroundColor: "var(--pub-primary)" }}
                    >
                      Agendar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Profissionais */}
      {business.professionals.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pb-10">
          <h2 className="mb-5 text-xl font-bold">Profissionais</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {business.professionals.map((p) => {
              const specialties = business.services.filter((s) => p.serviceIds.includes(s.id)).map((s) => s.name);
              return (
                <div key={p.id} className="flex flex-col items-center rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                  {p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo} alt={p.name} className="mb-2 h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div
                      className="mb-2 flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <p className="w-full truncate font-medium">{p.name}</p>
                  {specialties.length > 0 && (
                    <p className="mt-1 w-full truncate text-xs text-white/40" title={specialties.join(", ")}>
                      {specialties.join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/30">
        Página feita com{" "}
        <a href="/" className="hover:text-white/60 hover:underline">
          ZapVago
        </a>
      </footer>

      {/* CTA fixo — mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 space-y-2 border-t border-white/10 bg-[#0A0A0B]/95 p-3 backdrop-blur md:hidden">
        <Link
          href={`/${business.slug}/agendar`}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg font-medium text-white"
          style={{ backgroundColor: "var(--pub-primary)" }}
        >
          <CalendarCheck size={18} /> Agendar agora
        </Link>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-white/15 text-sm font-medium text-white"
        >
          <MessageCircle size={16} /> Agendar pelo WhatsApp
        </a>
      </div>
    </div>
  );
}

function WorkingHoursSummary({ workingHours }: { workingHours: Record<string, { start: string; end: string } | null> }) {
  const todayKey = DIAS[(new Date().getDay() + 6) % 7].key; // getDay(): 0=dom
  const today = workingHours?.[todayKey];
  return (
    <div className="flex items-center justify-center gap-2">
      <Clock size={15} className="shrink-0" />
      {today ? (
        <span>
          Hoje: {today.start} – {today.end}
        </span>
      ) : (
        <span>Fechado hoje</span>
      )}
    </div>
  );
}
