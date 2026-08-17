"use client";

/** Envolve uma seção e aplica fade-in + leve slide-up quando entra na viewport. */
import { useEffect, useRef, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

const HIDDEN_TRANSFORM = {
  up: "translate-y-6",
  left: "-translate-x-8",
  right: "translate-x-8",
};

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${HIDDEN_TRANSFORM[direction]}`,
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
