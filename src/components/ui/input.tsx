import * as React from "react";
import { cn } from "@/lib/cn";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "min-h-10 w-full rounded-[var(--radius-sm)] border border-borda bg-areia-card px-3.5 py-2 text-sm text-foreground shadow-[var(--shadow-xs)] outline-none transition-[border-color,box-shadow,background-color] duration-[var(--dur-hover)] placeholder:text-tinta-500 hover:border-tinta-300 disabled:bg-tinta-50 disabled:text-foreground-muted disabled:shadow-none aria-[invalid=true]:border-[var(--danger)]",
        "focus:border-azul-500 focus:shadow-[var(--anel-foco)]",
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
        "w-full rounded-[var(--radius-sm)] border border-borda bg-areia-card px-3.5 py-2 text-sm text-foreground shadow-[var(--shadow-xs)] outline-none transition-[border-color,box-shadow] duration-[var(--dur-hover)] placeholder:text-tinta-500 hover:border-tinta-300",
        "focus:border-azul-500 focus:shadow-[var(--anel-foco)]",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Input, Textarea };
