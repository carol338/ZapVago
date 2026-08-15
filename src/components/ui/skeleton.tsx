import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Placeholder com efeito de brilho (shimmer) — usado enquanto dados carregam. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton rounded-md", className)} {...props} />;
}
