import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        className: "font-texto",
        style: {
          background: "var(--areia-card)",
          border: "1px solid var(--borda)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-lg)",
          color: "var(--foreground)",
          fontSize: "0.8125rem",
        },
      }}
      theme="light"
      richColors
    />
  );
}
