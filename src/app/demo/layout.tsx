/**
 * Layout da demonstração pública (/demo) — sem autenticação de propósito
 * (não está no matcher de src/middleware.ts). Todo o conteúdo vem de
 * src/lib/demo-data.ts; nenhuma tela aqui faz fetch pra API real.
 */
import { DemoSidebar, DemoBottomNav } from "@/components/demo/DemoNav";
import { DemoBanner } from "@/components/demo/DemoBanner";

export const metadata = { title: "Demonstração — ZapVago" };

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DemoBanner />
      <div className="flex flex-1 flex-col md:flex-row">
        <DemoSidebar />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-20 md:p-6 md:pb-6">{children}</main>
        <DemoBottomNav />
      </div>
    </div>
  );
}
