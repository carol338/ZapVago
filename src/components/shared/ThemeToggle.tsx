"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

/** Botão de alternância dark/light — evita mismatch de hidratação só renderizando após montar no client. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={className ?? "h-11 w-11"} />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      className={
        className ??
        "flex h-11 w-11 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-surface-hover hover:text-foreground"
      }
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
