"use client";
import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/** Modal padrão para os fluxos de agendamento, feirão, detalhes, etc. */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className={cn("w-full max-w-lg rounded-xl border border-surface-border bg-surface p-5 shadow-2xl", className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-foreground/50 hover:bg-surface-hover hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
