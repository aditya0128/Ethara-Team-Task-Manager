import { useEffect, useRef } from "react";
import { cn } from "../lib/utils";
import { X } from "@phosphor-icons/react";

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  testid,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  testid?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      data-testid={testid || "modal"}
    >
      <div
        ref={ref}
        className={cn(
          "panel-flat shadow-panel w-full animate-slide-up",
          size === "sm" && "max-w-sm",
          size === "md" && "max-w-lg",
          size === "lg" && "max-w-2xl"
        )}
      >
        {title && (
          <div className="px-5 py-3 border-b border-line flex items-center justify-between">
            <h3 className="h-display text-lg font-semibold text-white">{title}</h3>
            <button onClick={onClose} className="text-ink-muted hover:text-white" data-testid="modal-close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
