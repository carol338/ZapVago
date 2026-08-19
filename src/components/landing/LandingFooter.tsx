import Link from "next/link";
import { MessageCircle, Instagram, Linkedin, Youtube } from "lucide-react";

const LINKS = [
  { label: "Termos de Uso", href: "/terms" },
  { label: "Privacidade", href: "/privacy" },
  { label: "Contato", href: "mailto:contato@zapvago.app" },
];

const SOCIAL = [
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/zapvago" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/company/zapvago" },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com/@zapvago" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-surface-border">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="text-zap" size={20} />
            <span className="font-bold">ZapVago</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground/50">
            {LINKS.map((l) => (
              <Link key={l.label} href={l.href} className="hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-center gap-6">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/50 transition-colors duration-200 hover:bg-surface-hover hover:text-zap"
              >
                <s.icon size={17} />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 text-center text-sm text-foreground/40">
          <p>© {new Date().getFullYear()} ZapVago. Todos os direitos reservados.</p>
          <Link href="/privacy" className="flex items-center gap-1 hover:text-foreground/70">
            🔒 Conforme LGPD
          </Link>
        </div>
      </div>
    </footer>
  );
}
