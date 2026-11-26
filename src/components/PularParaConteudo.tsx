import { ID_CONTEUDO } from "@/hooks/useFocoNoConteudo";

/**
 * Link "Pular para o conteúdo": invisível até receber foco pelo teclado (Tab). Evita que quem navega
 * pelo teclado passe por todo o menu em cada tela.
 */
export function PularParaConteudo() {
  return (
    <a
      href={`#${ID_CONTEUDO}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-[calc(env(safe-area-inset-top)+0.75rem)] focus:z-[60] focus:rounded-lg focus:bg-marca focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-white focus:shadow-[var(--shadow-md)]"
    >
      Pular para o conteúdo
    </a>
  );
}
