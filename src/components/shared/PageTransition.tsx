"use client";

import { usePathname } from "next/navigation";

/** Aplica um fade-in de 200ms a cada troca de rota (key = pathname força remontagem). */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-fade-in">
      {children}
    </div>
  );
}
