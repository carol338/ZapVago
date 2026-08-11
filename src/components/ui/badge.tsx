import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-surface-hover text-foreground/80",
    success: "bg-risk-low/15 text-risk-low",
    warning: "bg-risk-mid/15 text-risk-mid",
    danger: "bg-risk-high/15 text-risk-high",
    info: "bg-zap/15 text-zap-light",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)} {...props} />;
}
