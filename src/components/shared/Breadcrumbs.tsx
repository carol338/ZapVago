"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

/** Trilha de navegação — trilha completa no desktop, "‹ Voltar + item atual" no mobile. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const router = useRouter();
  const last = items[items.length - 1];

  return (
    <div className="mb-3">
      <div className="flex items-center gap-1 md:hidden">
        <button
          onClick={() => router.back()}
          aria-label="Voltar"
          className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-surface-hover"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="truncate text-sm font-medium text-foreground/70">{last.label}</span>
      </div>

      <nav className="hidden items-center gap-1.5 text-sm text-foreground/50 md:flex">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={13} className="text-foreground/30" />}
              {item.href && !isLast ? (
                <Link href={item.href} className="transition-colors hover:text-foreground hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "font-medium text-foreground" : ""}>{item.label}</span>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
}
