import { StrictMode } from "react";
import { MotionConfig } from "framer-motion";
import { createRoot } from "react-dom/client";
import "@/index.css";
import "@/api/rotas";
import App from "@/App";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Confirmador } from "@/components/ui/confirmador";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Com "reduzir movimento" ligado no sistema, as animações do framer-motion viram só troca de opacidade. */}
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={200}>
        <App />
        <Toaster />
        <Confirmador />
      </TooltipProvider>
    </MotionConfig>
  </StrictMode>,
);
