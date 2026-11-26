import type { ComponentType } from "react";
import {
  BarChart3, Building, Building2, ClipboardList, FilePlus2, FileUp, Hospital, KeyRound, LayoutDashboard, Receipt, ShieldCheck, UserPlus, UserRound, Wallet,
} from "lucide-react";
import { filtrarOpcoes } from "@/lib/busca";
import { pode, type PermissaoQualquer } from "@/lib/permissoes";

// Menu do Steto, agrupado por área de trabalho (padrão do ConectaPRO / projeto revenda). O shell
// (`components/layout/AppShell.tsx`) só desenha o que está aqui: barra lateral, barra de abas do celular,
// menu "Mais", trilha do cabeçalho e busca ⌘K. `permissao` só controla a exibição; quem decide é o banco.

type Icone = ComponentType<{ className?: string; width?: number; height?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;

export type ItemMenu = {
  href: string;
  label: string;
  Icone: Icone;
  /** Alguma destas permissões. */
  permissao?: PermissaoQualquer | PermissaoQualquer[];
  /** Prioridade na barra de abas do celular (menor = mais importante; até 3 itens). */
  aba?: number;
  /** Rótulo curto na barra de abas. */
  rotuloAba?: string;
  /** Mostra uma contagem (reservado; o Steto ainda não usa). */
  contador?: "pedidos";
};

export type SecaoMenu = { chave: string; titulo: string; itens: ItemMenu[] };

export type AcaoRapida = { href: string; label: string; descricao: string; Icone: Icone; permissao?: PermissaoQualquer };

export const SECOES: SecaoMenu[] = [
  {
    chave: "acompanhamento",
    titulo: "Acompanhamento",
    itens: [
      { href: "/painel", label: "Visão geral", Icone: LayoutDashboard, permissao: "painel.ver", aba: 1, rotuloAba: "Início" },
      { href: "/relatorios", label: "Relatórios", Icone: BarChart3, permissao: "relatorios.ver" },
    ],
  },
  {
    chave: "financeiro",
    titulo: "Financeiro",
    itens: [
      { href: "/registros", label: "Registros financeiros", Icone: Receipt, permissao: "registros.ver", aba: 2, rotuloAba: "Registros" },
      { href: "/contas", label: "Contas a pagar e receber", Icone: Wallet, permissao: "contas.ver", aba: 3, rotuloAba: "Contas" },
      { href: "/pendencias", label: "Pendências de clientes", Icone: ClipboardList, permissao: "clientes.gerenciar" },
    ],
  },
  {
    chave: "cadastros",
    titulo: "Cadastros",
    itens: [
      { href: "/clientes", label: "Clientes", Icone: Hospital, permissao: "clientes.gerenciar", aba: 4 },
      { href: "/prestadores", label: "Prestadores", Icone: UserRound, permissao: "prestadores.gerenciar", aba: 5 },
      { href: "/empresas-contabeis", label: "Empresas contábeis", Icone: Building2, permissao: "empresas_contabeis.gerenciar" },
    ],
  },
  {
    chave: "administracao",
    titulo: "Administração",
    itens: [
      { href: "/importacao", label: "Importação", Icone: FileUp, permissao: "importacao.executar" },
      { href: "/acessos", label: "Usuários e acessos", Icone: KeyRound, permissao: "acessos.gerenciar" },
      { href: "/empresas", label: "Empresas", Icone: Building, permissao: "empresas.gerenciar" },
      { href: "/auditoria", label: "Auditoria", Icone: ShieldCheck, permissao: "auditoria.ver" },
    ],
  },
  {
    chave: "conta",
    titulo: "Minha conta",
    itens: [{ href: "/perfil", label: "Meu perfil", Icone: UserRound }],
  },
];

/** Botão central "+" do celular e topo da barra lateral. Com mais de uma, o botão abre um menu. */
export const ACOES: AcaoRapida[] = [
  { href: "/registros/novo", label: "Novo registro", descricao: "Nota emitida e repasse ao prestador", Icone: FilePlus2, permissao: "registros.gerenciar" },
  { href: "/contas/nova", label: "Nova conta", descricao: "Conta a pagar ou a receber", Icone: Wallet, permissao: "contas.gerenciar" },
  { href: "/clientes/novo", label: "Novo cliente", descricao: "Hospital ou clínica", Icone: Hospital, permissao: "clientes.gerenciar" },
  { href: "/prestadores/novo", label: "Novo prestador", descricao: "Médico que recebe repasses", Icone: UserPlus, permissao: "prestadores.gerenciar" },
];

type Usuario = Parameters<typeof pode>[0];

const permite = (usuario: Usuario, permissao?: PermissaoQualquer | PermissaoQualquer[]) =>
  !permissao || [permissao].flat().some((p) => pode(usuario, p));

/** Seções do usuário logado, só com os itens que o perfil permite (seções vazias somem). */
export function secoesVisiveis(usuario: Usuario): SecaoMenu[] {
  if (!usuario) return [];
  return SECOES.map((s) => ({ ...s, itens: s.itens.filter((i) => permite(usuario, i.permissao)) })).filter((s) => s.itens.length > 0);
}

export function acoesVisiveis(usuario: Usuario): AcaoRapida[] {
  if (!usuario) return [];
  return ACOES.filter((a) => permite(usuario, a.permissao));
}

/** Os 3 itens de maior prioridade para a barra de abas (o resto fica em "Mais"). */
export function itensDaBarraDeAbas(secoes: SecaoMenu[]): ItemMenu[] {
  return secoes
    .flatMap((s) => s.itens)
    .filter((i) => i.aba)
    .sort((a, b) => (a.aba ?? 0) - (b.aba ?? 0))
    .slice(0, 3);
}

/** O item do menu que corresponde à rota (o prefixo mais longo vence). */
export function itemAtivo(pathname: string, secoes: SecaoMenu[]): { secao: SecaoMenu; item: ItemMenu } | null {
  let melhor: { secao: SecaoMenu; item: ItemMenu } | null = null;
  for (const secao of secoes) {
    for (const item of secao.itens) {
      const casa = pathname === item.href || pathname.startsWith(`${item.href}/`);
      if (casa && (!melhor || item.href.length > melhor.item.href.length)) melhor = { secao, item };
    }
  }
  return melhor;
}

/** Trilha do cabeçalho: seção / tela. */
export function trilhaPara(pathname: string, secoes: SecaoMenu[]): { label: string; href?: string }[] {
  const ativo = itemAtivo(pathname, secoes);
  if (!ativo) return [];
  return [{ label: ativo.secao.titulo }, { label: ativo.item.label, href: ativo.item.href }];
}

/** Linha de papel no menu do usuário: "Administrador · Steto". */
export const papelDoUsuario = (usuario: { papel: "admin" | "usuario"; empresa?: { nome: string } }) =>
  `${usuario.papel === "admin" ? "Administrador" : "Usuário"}${usuario.empresa ? ` · ${usuario.empresa.nome}` : ""}`;

export type ResultadoBusca = { chave: string; rotulo: string; descricao: string; href: string; Icone: Icone; tipo: "Ação" | "Tela" };

/** Resultados agrupados (ações antes das telas), filtrados sem diferenciar acentos. */
export function resultadosDaBusca(termo: string, secoes: SecaoMenu[], acoes: AcaoRapida[]): ResultadoBusca[] {
  const daAcao: ResultadoBusca[] = acoes.map((a) => ({ chave: `acao:${a.href}`, rotulo: a.label, descricao: a.descricao, href: a.href, Icone: a.Icone, tipo: "Ação" }));
  const daTela: ResultadoBusca[] = secoes.flatMap((s) =>
    s.itens.map((i) => ({ chave: `tela:${i.href}`, rotulo: i.label, descricao: s.titulo, href: i.href, Icone: i.Icone, tipo: "Tela" as const })),
  );
  return filtrarOpcoes([...daAcao, ...daTela], termo.trim());
}
