import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full min-h-[44px] rounded-lg border border-surface-border bg-background px-3 py-2 text-base text-foreground transition-all duration-200 placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-zap",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
