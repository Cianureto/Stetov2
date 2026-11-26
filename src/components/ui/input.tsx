import * as React from "react";
import { cn } from "@/lib/cn";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-[var(--radius-sm)] border border-[var(--borda-forte)] bg-areia-card px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-[var(--dur-hover)] placeholder:text-foreground-muted hover:border-foreground/30",
        "focus:border-marca focus:shadow-[0_0_0_3px_var(--marca-claro)]",
        "max-md:text-base max-md:py-2.5",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-[var(--radius-sm)] border border-[var(--borda-forte)] bg-areia-card px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-[var(--dur-hover)] placeholder:text-foreground-muted hover:border-foreground/30",
        "focus:border-marca focus:shadow-[0_0_0_3px_var(--marca-claro)]",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Input, Textarea };
