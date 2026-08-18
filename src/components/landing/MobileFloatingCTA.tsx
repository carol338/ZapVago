"use client";

/** Barra fixa no rodapé, só no mobile — aparece depois que o visitante rola além do Hero. */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function MobileFloatingCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > window.innerHeight * 0.6);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-surface-border bg-surface/95 p-3 backdrop-blur transition-transform duration-300 sm:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <Link href="/register">
        <Button className="min-h-[48px] w-full whitespace-nowrap">
          Testar grátis 14 dias <ArrowRight size={16} className="ml-1.5" />
        </Button>
      </Link>
    </div>
  );
}
