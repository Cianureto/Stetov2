import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Seletor } from "@/components/ui/seletor";
import { Spinner } from "@/components/ui/spinner";
import { OPCOES_POR_PAGINA } from "@/lib/tabela";

/** Rodapé de paginação das listas (tabela e galeria): "Mostrando x–y de z", tamanho da página e páginas. */
export function Paginacao({ pagina, totalPaginas, total, porPagina, onPagina, onPorPagina, atualizando }: { pagina: number; totalPaginas: number; total: number; porPagina: number; onPagina: (p: number) => void; onPorPagina?: (n: number) => void; atualizando?: boolean }) {
  // Com troca de tamanho, o rodapé aparece sempre que a lista passa do menor tamanho de página.
  if (totalPaginas <= 1 && (!onPorPagina || total <= OPCOES_POR_PAGINA[0])) return null;
  const numeros = Array.from({ length: totalPaginas }, (_, i) => i + 1).filter((n) => n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 1);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-borda px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Enquanto a página nova não chega, os números antigos ficariam errados: mostra que está carregando. */}
        <p className="inline-flex items-center gap-1.5 text-xs text-foreground-muted">
          {atualizando ? (
            <>
              <Spinner tamanho="sm" /> Carregando página {pagina}…
            </>
          ) : (
            <>Mostrando {(pagina - 1) * porPagina + 1}–{Math.min(pagina * porPagina, total)} de {total}</>
          )}
        </p>
        {onPorPagina && (
          <Seletor
            className="h-8 w-[7.5rem] py-1 text-xs pointer-coarse:h-11"
            rotulo="Registros por página"
            valor={String(porPagina)}
            onChange={(v) => onPorPagina(Number(v))}
            opcoes={OPCOES_POR_PAGINA.map((n) => ({ valor: String(n), rotulo: `${n} por página` }))}
          />
        )}
      </div>
      {totalPaginas > 1 && (
      <nav aria-label="Paginação" className="flex items-center gap-1.5">
        <Button variant="secondary" size="icon-sm" disabled={pagina === 1} onClick={() => onPagina(pagina - 1)} aria-label="Página anterior">
          <ChevronLeft aria-hidden />
        </Button>
        {numeros.map((n, i) => (
          <span key={n} className="flex items-center gap-1.5">
            {i > 0 && numeros[i - 1] !== n - 1 && <span className="px-1 text-xs text-foreground-muted">…</span>}
            <Button variant={n === pagina ? "primary" : "secondary"} size="icon-sm" className="text-xs" aria-current={n === pagina ? "page" : undefined} onClick={() => onPagina(n)}>
              {n}
            </Button>
          </span>
        ))}
        <Button variant="secondary" size="icon-sm" disabled={pagina === totalPaginas} onClick={() => onPagina(pagina + 1)} aria-label="Próxima página">
          <ChevronRight aria-hidden />
        </Button>
      </nav>
      )}
    </div>
  );
}
