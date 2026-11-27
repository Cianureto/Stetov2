import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { WifiOff } from "lucide-react";
import { useOnline } from "@/hooks/useOnline";
import { PularParaConteudo } from "@/components/PularParaConteudo";
import { ID_CONTEUDO, useFocoNoConteudoAoNavegar } from "@/hooks/useFocoNoConteudo";
import { PageTransition } from "@/components/ui/page-transition";
import { useAuth } from "@/context/useAuth";
import { inicioDoUsuario } from "@/lib/permissoes";
import { acoesVisiveis, itemAtivo, itensDaBarraDeAbas, secoesVisiveis, type AcaoRapida } from "@/lib/navegacao";
import { cn } from "@/lib/cn";
import { BarraLateral } from "@/components/layout/BarraLateral";
import { BarraSuperior } from "@/components/layout/BarraSuperior";
import { BarraAbas } from "@/components/layout/BarraAbas";
import { MenuMais } from "@/components/layout/MenuMais";
import { PastaAcoes } from "@/components/layout/PastaAcoes";
import type { OrigemPasta } from "@/lib/pasta";
import { PaletaBusca } from "@/components/layout/PaletaBusca";

/**
 * Estrutura comum das áreas do gestor e do consultor (padrão do projeto revenda, mobile first):
 * barra lateral escura flutuante a partir de `lg`; abaixo disso, cabeçalho de vidro e barra de abas
 * flutuante com ação rápida central e "Mais". O menu vem de `lib/navegacao.ts`.
 *
 * `telaCheia`: as telas do consultor desenham o próprio cabeçalho escuro de borda a borda, então o
 * conteúdo não leva espaçamento lateral no celular.
 */
export function AppShell({ pendentes = 0, telaCheia = false }: { pendentes?: number; telaCheia?: boolean } = {}) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const secoes = useMemo(() => secoesVisiveis(usuario), [usuario]);
  const acoes = useMemo(() => acoesVisiveis(usuario), [usuario]);
  const abas = itensDaBarraDeAbas(secoes);
  const [maisAberto, setMaisAberto] = useState(false);
  const [acoesAbertas, setAcoesAbertas] = useState(false);
  const [origemAcoes, setOrigemAcoes] = useState<OrigemPasta>("lateral");
  const [buscaAberta, setBuscaAberta] = useState(false);
  const online = useOnline();
  useFocoNoConteudoAoNavegar();

  // Atalho global da busca: ⌘K / Ctrl+K.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBuscaAberta((v) => !v);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  // Avisos flutuantes (versão nova, instalar) sobem acima da barra de abas (`--barra-inferior` no index.css).
  useEffect(() => {
    document.documentElement.setAttribute("data-barra-abas", "");
    return () => document.documentElement.removeAttribute("data-barra-abas");
  }, []);

  if (!usuario) return null;

  const inicio = inicioDoUsuario(usuario);
  const ativo = itemAtivo(pathname, secoes);
  const maisAtivo = !!ativo && !abas.some((a) => a.href === ativo.item.href);
  const temPedidosForaDasAbas = pendentes > 0 && !abas.some((a) => a.contador === "pedidos");

  const escolherAcao = (a: AcaoRapida) => {
    setAcoesAbertas(false);
    navigate(a.href);
  };
  const acaoRapida =
    acoes.length === 0
      ? undefined
      : (origem: OrigemPasta) => {
          if (acoes.length === 1) return escolherAcao(acoes[0]);
          setOrigemAcoes(origem);
          setAcoesAbertas(true);
        };
  const rotuloAcao = acoes.length === 1 ? acoes[0].label : "Novo";

  return (
    <div className="min-h-dvh bg-areia lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <PularParaConteudo />
      <BarraLateral secoes={secoes} pendentes={pendentes} inicio={inicio} onAcaoRapida={acaoRapida && (() => acaoRapida("lateral"))} rotuloAcao={rotuloAcao} acoes={acoes} pastaAberta={acoesAbertas && origemAcoes === "lateral"} />

      <div className="flex min-w-0 flex-col">
        <BarraSuperior secoes={secoes} inicio={inicio} onBuscar={() => setBuscaAberta(true)} />
        {!online && (
          <div role="status" className="mx-3 mt-3 flex items-start gap-2.5 rounded-xl bg-[var(--sidebar-bg)] px-3.5 py-2.5 text-[13px] font-medium text-white shadow-[var(--shadow-md)] lg:mx-10 2xl:mx-14">
            <WifiOff className="mt-0.5 size-4 shrink-0 text-[var(--acafrao)]" aria-hidden />
            Você está sem internet. O que já foi carregado continua na tela; salvar e atualizar voltam quando a conexão voltar.
          </div>
        )}
        <main
          id={ID_CONTEUDO}
          tabIndex={-1}
          className={cn(
            "w-full flex-1 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] outline-none lg:pb-10",
            telaCheia ? "" : "mx-auto max-w-[1600px] px-4 pt-5 sm:px-6 sm:pt-7 lg:px-10 lg:pt-8 2xl:px-14",
          )}
        >
          <PageTransition key={pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      <BarraAbas
        itens={abas}
        maisAtivo={maisAtivo}
        avisoMais={temPedidosForaDasAbas}
        onAcaoRapida={acaoRapida && (() => acaoRapida("abas"))}
        pastaAberta={acoesAbertas && origemAcoes === "abas"}
        rotuloAcao={rotuloAcao}
        onMais={() => setMaisAberto(true)}
      />
      <MenuMais aberto={maisAberto} onFechar={() => setMaisAberto(false)} secoes={secoes} pendentes={pendentes} />
      <PastaAcoes aberta={acoesAbertas} origem={origemAcoes} onFechar={() => setAcoesAbertas(false)} acoes={acoes} onEscolher={escolherAcao} />
      <PaletaBusca aberta={buscaAberta} onFechar={() => setBuscaAberta(false)} secoes={secoes} acoes={acoes} />
    </div>
  );
}
