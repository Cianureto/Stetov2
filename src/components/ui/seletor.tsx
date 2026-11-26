import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { filtrarOpcoes, normalizarBusca, type OpcaoSeletor } from "@/lib/busca";

/** A partir de quantas opções o campo de busca aparece (abaixo disso, digitar a inicial já pula para a opção). */
export const LIMITE_BUSCA = 7;

const GATILHO = {
  padrao: "input flex items-center justify-between gap-2 text-left",
  // Filtros sobre o cabeçalho escuro do consultor (Contas, Apresentações).
  escuro: "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-white/15 bg-[var(--consultor-dark)] px-2.5 text-left text-[13px] text-white outline-none focus-visible:border-white/40 pointer-coarse:h-11",
  // Ações dentro de cartões e linhas de tabela.
  compacto: "flex w-full items-center justify-between gap-2 rounded-md border border-[var(--borda-forte)] bg-areia-card px-2 py-1 text-left text-xs outline-none focus-visible:border-marca focus-visible:shadow-[0_0_0_3px_var(--marca-claro)] pointer-coarse:min-h-11",
};

type Props = {
  valor: string;
  onChange: (valor: string) => void;
  opcoes: OpcaoSeletor[];
  /** Nome do campo para leitor de tela (ex.: "Consultor"). Obrigatório: o gatilho nem sempre tem um <label> ligado. */
  rotulo: string;
  id?: string;
  /** Texto quando nenhuma opção está escolhida. */
  placeholder?: string;
  /** Acrescenta no topo uma opção de valor "" (ex.: "Todos os consultores", "— Nenhum —"). */
  opcaoVazia?: string;
  /** Mostra o campo de busca. Padrão: só quando há mais de LIMITE_BUSCA opções. */
  pesquisavel?: boolean;
  desabilitado?: boolean;
  /** Valida no envio do formulário como um <select required>. */
  obrigatorio?: boolean;
  variante?: keyof typeof GATILHO;
  className?: string;
};

/**
 * Seletor de uma opção, pesquisável: o dropdown padrão do app (substitui o <select> nativo).
 * Teclado: setas/Home/End movem, Enter escolhe, Esc fecha, letras filtram (ou pulam para a inicial).
 * No toque, o campo de busca não recebe foco sozinho (o teclado do celular cobriria a lista).
 */
export function Seletor({ valor, onChange, opcoes, rotulo, id, placeholder = "Selecione...", opcaoVazia, pesquisavel, desabilitado, obrigatorio, variante = "padrao", className }: Props) {
  const base = useId();
  const idLista = `${base}-lista`;
  const gatilho = useRef<HTMLButtonElement>(null);
  const campoBusca = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [ativo, setAtivo] = useState(0);

  const todas = useMemo(() => (opcaoVazia === undefined ? opcoes : [{ valor: "", rotulo: opcaoVazia }, ...opcoes]), [opcoes, opcaoVazia]);
  const visiveis = useMemo(() => filtrarOpcoes(todas, busca), [todas, busca]);
  const selecionada = todas.find((opcao) => opcao.valor === valor);
  const comBusca = pesquisavel ?? opcoes.length > LIMITE_BUSCA;
  const idAtivo = visiveis[ativo] ? `${base}-op-${ativo}` : undefined;

  useEffect(() => {
    if (aberto && idAtivo) document.getElementById(idAtivo)?.scrollIntoView?.({ block: "nearest" });
  }, [aberto, idAtivo]);

  function abrir(abrindo: boolean) {
    if (abrindo) {
      setBusca("");
      setAtivo(Math.max(0, todas.findIndex((opcao) => opcao.valor === valor)));
    }
    setAberto(abrindo);
  }

  function escolher(opcao: OpcaoSeletor | undefined) {
    if (!opcao || opcao.desabilitada) return;
    if (opcao.valor !== valor) onChange(opcao.valor);
    setAberto(false);
  }

  function filtrar(texto: string) {
    setBusca(texto);
    setAtivo(0);
  }

  /** Próximo índice habilitado a partir de `de`, andando `passo` (1 ou -1). */
  function mover(de: number, passo: number) {
    for (let i = de; i >= 0 && i < visiveis.length; i += passo) if (!visiveis[i].desabilitada) return setAtivo(i);
  }

  function teclar(ev: KeyboardEvent) {
    const acoes: Record<string, () => void> = {
      ArrowDown: () => mover(ativo + 1, 1),
      ArrowUp: () => mover(ativo - 1, -1),
      Home: () => mover(0, 1),
      End: () => mover(visiveis.length - 1, -1),
      Enter: () => escolher(visiveis[ativo]),
      Tab: () => setAberto(false),
    };
    if (acoes[ev.key]) {
      if (ev.key !== "Tab") ev.preventDefault();
      acoes[ev.key]();
      return;
    }
    // Sem campo de busca: a letra digitada pula para a próxima opção que começa com ela.
    if (!comBusca && ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey) {
      const letra = normalizarBusca(ev.key);
      const ordem = [...visiveis.keys()].map((i) => (ativo + 1 + i) % visiveis.length);
      const achada = ordem.find((i) => normalizarBusca(visiveis[i].rotulo).startsWith(letra));
      if (achada !== undefined) setAtivo(achada);
    }
  }

  const texto = selecionada?.rotulo ?? placeholder;

  return (
    <PopoverPrimitive.Root open={aberto} onOpenChange={abrir} modal>
      <div className="relative min-w-0">
        <PopoverPrimitive.Trigger asChild disabled={desabilitado}>
          <button
            ref={gatilho}
            id={id}
            type="button"
            aria-haspopup="listbox"
            aria-label={`${rotulo}: ${texto}`}
            onKeyDown={(ev) => {
              if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
                ev.preventDefault();
                abrir(true);
              }
            }}
            className={cn(GATILHO[variante], "disabled:cursor-not-allowed disabled:opacity-60", className)}
          >
            <span className={cn("min-w-0 truncate", !selecionada && (variante === "escuro" ? "text-white/70" : "text-foreground-muted"))}>{texto}</span>
            <ChevronDown aria-hidden className="size-4 shrink-0 opacity-60" />
          </button>
        </PopoverPrimitive.Trigger>
        {obrigatorio && (
          // Mantém a validação nativa do formulário ("Preencha este campo") apontando para o gatilho.
          <input tabIndex={-1} aria-hidden required value={valor} onChange={() => {}} onFocus={() => gatilho.current?.focus()} className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full opacity-0" />
        )}
      </div>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          collisionPadding={12}
          onKeyDown={teclar}
          onOpenAutoFocus={(ev) => {
            ev.preventDefault();
            const toque = window.matchMedia?.("(pointer: coarse)").matches;
            (comBusca && !toque ? campoBusca.current : lista.current)?.focus();
          }}
          className={cn(
            "z-50 w-[var(--radix-popover-trigger-width)] min-w-56 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-lg border border-[var(--borda)] bg-[var(--areia-card)] shadow-[var(--shadow-lg)] outline-none",
            "data-[state=open]:animate-[scale-in_0.16s_cubic-bezier(0.16,1,0.3,1)]",
          )}
        >
          {comBusca && (
            <div className="relative border-b border-[var(--borda)] p-2">
              <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" />
              <input
                ref={campoBusca}
                type="search"
                role="combobox"
                aria-label={`Procurar ${rotulo.toLowerCase()}`}
                aria-expanded
                aria-controls={idLista}
                aria-autocomplete="list"
                aria-activedescendant={idAtivo}
                value={busca}
                onChange={(ev) => filtrar(ev.target.value)}
                placeholder="Procurar..."
                autoComplete="off"
                className="input !py-1.5 pl-8 text-[13px]"
              />
            </div>
          )}
          <ul ref={lista} id={idLista} role="listbox" aria-label={rotulo} aria-activedescendant={idAtivo} tabIndex={-1} className="max-h-64 overflow-y-auto overscroll-contain py-1 outline-none">
            {visiveis.map((opcao, i) => {
              const escolhida = opcao.valor === valor;
              return (
                <li
                  key={`${opcao.valor}-${i}`}
                  id={`${base}-op-${i}`}
                  role="option"
                  aria-selected={escolhida}
                  aria-disabled={opcao.desabilitada || undefined}
                  onPointerMove={() => !opcao.desabilitada && setAtivo(i)}
                  onClick={() => escolher(opcao)}
                  className={cn(
                    "flex cursor-pointer items-start gap-2 px-3 py-2 text-sm pointer-coarse:min-h-11 pointer-coarse:items-center",
                    i === ativo && "bg-[var(--sidebar-hover-bg)]",
                    escolhida && "font-medium",
                    opcao.desabilitada && "cursor-not-allowed opacity-50",
                  )}
                >
                  <Check aria-hidden className={cn("mt-0.5 size-4 shrink-0 text-marca pointer-coarse:mt-0", !escolhida && "invisible")} />
                  <span className="min-w-0">
                    <span className="block break-words">{opcao.rotulo}</span>
                    {opcao.descricao && <span className="block text-xs text-foreground-muted">{opcao.descricao}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
          {visiveis.length === 0 && <p role="status" className="px-3 pb-3 text-sm text-foreground-muted">{todas.length ? "Nada encontrado." : "Nenhuma opção."}</p>}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
