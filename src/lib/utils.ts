import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina classes Tailwind com merge inteligente de conflitos. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Converte "yyyy-MM-dd" em meia-noite LOCAL (evita o bug de new Date() interpretar como UTC e cair no dia errado). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getSession() {
  // helper reexportado em componentes client-side; ver src/lib/auth.ts para o server-side
}
