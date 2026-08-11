import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-zap",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
