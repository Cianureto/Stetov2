import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import { mensagemErro } from "@/lib/erros";

/**
 * Caixa de diálogo simples (alerta ou confirmação), centralizada como os alertas do iPad. Na confirmação,
 * espera `onConfirmar` terminar (botão com "processando"): dando certo, fecha; se lançar erro, mostra a
 * mensagem no próprio diálogo e continua aberto para tentar de novo.
 */
export default function Aviso({
  titulo,
  mensagem,
  onFechar,
  confirmar,
}: {
  titulo?: string;
  mensagem: ReactNode;
  onFechar: () => void;
  confirmar?: { rotulo: string; perigo?: boolean; onConfirmar: () => void | Promise<unknown> };
}) {
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmarAcao() {
    if (!confirmar || processando) return;
    setProcessando(true);
    setErro(null);
    try {
      await confirmar.onConfirmar();
      onFechar();
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível concluir. Tente de novo."));
      setProcessando(false);
    }
  }
  const fechar = () => !processando && onFechar();

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-6"
        onClick={fechar}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <motion.div
          role="alertdialog"
          className="w-full max-w-[300px] overflow-hidden rounded-2xl bg-[var(--areia-card)] shadow-[var(--shadow-lg)]"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="px-5 pt-5 pb-4 text-center">
            {titulo && <h2 className="font-titulo text-[15px] font-semibold">{titulo}</h2>}
            <div className={`text-[13px] text-foreground-secondary ${titulo ? "mt-1" : ""}`}>{mensagem}</div>
            {erro && (
              <p role="alert" className="mt-3 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]">
                {erro}
              </p>
            )}
          </div>
          <div className="flex border-t border-borda">
            {confirmar ? (
              <>
                <button onClick={fechar} disabled={processando} className="flex-1 py-3 text-[14px] text-foreground-secondary transition-colors hover:bg-[var(--sidebar-hover-bg)] disabled:opacity-50">
                  Cancelar
                </button>
                <button
                  onClick={confirmarAcao}
                  disabled={processando}
                  aria-busy={processando || undefined}
                  className={`flex flex-1 items-center justify-center gap-2 border-l border-borda py-3 text-[14px] font-semibold transition-colors hover:bg-[var(--sidebar-hover-bg)] disabled:cursor-wait ${confirmar.perigo ? "text-[var(--danger)]" : "text-marca"}`}
                >
                  {processando ? <Spinner tamanho="sm" className="text-current" /> : null}
                  {processando ? "Aguarde…" : confirmar.rotulo}
                </button>
              </>
            ) : (
              <button onClick={onFechar} className="flex-1 py-3 text-[14px] font-semibold text-marca transition-colors hover:bg-[var(--sidebar-hover-bg)]">
                OK
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
