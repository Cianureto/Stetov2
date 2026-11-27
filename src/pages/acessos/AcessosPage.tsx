import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Ban, KeyRound, RotateCcw, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { ListaUsuarios, Usuario } from "@/api/types";
import { SenhaTemporaria } from "@/components/conta/SenhaTemporaria";
import { AcoesEmLinha } from "@/components/tabela/AcoesTabela";
import { BarraTabela } from "@/components/tabela/BarraTabela";
import { TabelaDados } from "@/components/tabela/TabelaDados";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CabecalhoHero, ChipIconeAcao, classeAcaoHero } from "@/components/ui/cabecalho-hero";
import { confirmar } from "@/components/ui/confirmar";
import { useAuth } from "@/context/useAuth";
import { useAcoesTabela } from "@/hooks/useAcoesTabela";
import { useTabelaServidor } from "@/hooks/useTabelaServidor";
import { emMassa, plural, type AcaoTabela } from "@/lib/acoesTabela";
import { mensagemErro } from "@/lib/erros";
import { formatarData } from "@/lib/format";
import type { Coluna } from "@/lib/tabela";

const chave = (u: Usuario) => u.id;
const nome = (u: Usuario) => u.nome;

function Situacao({ u }: { u: Usuario }) {
  if (!u.ativo) return <Badge variant="neutral">Inativo</Badge>;
  if (u.trocarSenha) return <Badge variant="aviso">Senha temporária</Badge>;
  return <Badge variant="sucesso">Ativo</Badge>;
}

/** /acessos (usuários da própria empresa) e /empresas/:empresaId/usuarios (administrador da Steto). */
export default function AcessosPage() {
  const { empresaId } = useParams();
  const { usuario: eu } = useAuth();
  const navigate = useNavigate();
  const [senha, setSenha] = useState<{ email: string; senha: string } | null>(null);
  const caminho = empresaId ? `/usuarios?empresa=${empresaId}` : `/usuarios?empresa=${eu?.empresa.id ?? ""}`;
  const tabela = useTabelaServidor<Usuario, ListaUsuarios>(caminho, "usuarios", { ordemPadrao: "nome", naUrl: "", mensagemFalha: "Não foi possível carregar os usuários." });
  const { recarregar, resposta } = tabela;

  const acoes = useMemo<AcaoTabela<Usuario>[]>(() => [
    {
      chave: "inativar", rotulo: "Inativar", Icone: Ban, permissao: "acessos.gerenciar", aplicavel: (u) => u.ativo && u.id !== eu?.id,
      confirmar: (us) => ({ titulo: us.length === 1 ? `Inativar ${us[0].nome}?` : `Inativar ${us.length} usuários?`, descricao: "A pessoa perde o acesso na hora. Dá para reativar depois.", acao: "Inativar" }),
      executar: emMassa("/usuarios/em-massa", "inativar"), sucesso: (n) => `${plural(n, "usuário inativado", "usuários inativados")}.`,
    },
    {
      chave: "ativar", rotulo: "Reativar", Icone: RotateCcw, permissao: "acessos.gerenciar", aplicavel: (u) => !u.ativo,
      executar: emMassa("/usuarios/em-massa", "ativar"), sucesso: (n) => `${plural(n, "usuário reativado", "usuários reativados")}.`,
    },
  ], [eu?.id]);
  const controle = useAcoesTabela({ acoes, chave, nome, aoConcluir: recarregar });

  const mudarPapel = useCallback(async (u: Usuario) => {
    const novo = u.papel === "admin" ? "usuario" : "admin";
    const ok = await confirmar({ titulo: novo === "admin" ? `Tornar ${u.nome} administrador?` : `Tirar ${u.nome} da administração?`, descricao: novo === "admin" ? "Administradores gerenciam usuários, importação e auditoria." : "A pessoa continua com acesso aos cadastros e ao financeiro.", acao: "Confirmar" });
    if (!ok) return;
    try {
      await api.patch(`/usuarios/${u.id}`, { papel: novo });
      toast.success("Papel atualizado.");
      recarregar?.();
    } catch (e) {
      toast.error(mensagemErro(e, "Não foi possível mudar o papel."));
    }
  }, [recarregar]);

  const redefinir = useCallback(async (u: Usuario) => {
    if (!(await confirmar({ titulo: `Criar uma senha temporária para ${u.nome}?`, descricao: "A senha atual deixa de valer e a pessoa cria uma nova no próximo acesso.", acao: "Criar senha" }))) return;
    try {
      const r = await api.post<{ senhaTemporaria: string }>(`/usuarios/${u.id}/redefinir-senha`);
      setSenha({ email: u.email, senha: r.senhaTemporaria });
      recarregar?.();
    } catch (e) {
      toast.error(mensagemErro(e, "Não foi possível redefinir a senha."));
    }
  }, [recarregar]);

  const colunas = useMemo<Coluna<Usuario>[]>(() => [
    {
      chave: "nome", titulo: "Usuário", filtro: { tipo: "texto" },
      render: (u) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{u.nome}{u.id === eu?.id && <span className="ml-1.5 text-xs font-normal text-foreground-muted">(você)</span>}</div>
          <div className="truncate text-xs text-foreground-muted">{u.email}</div>
        </div>
      ),
    },
    { chave: "email", titulo: "E-mail", filtro: { tipo: "texto" }, soFiltro: true },
    { chave: "papel", titulo: "Papel", filtro: { tipo: "opcoes", opcoes: { admin: "Administrador", usuario: "Usuário" } }, render: (u) => (u.papel === "admin" ? <Badge variant="marca">Administrador</Badge> : <Badge variant="outline">Usuário</Badge>) },
    { chave: "ativo", titulo: "Situação", filtro: { tipo: "booleano", rotulo: "Ativo" }, render: (u) => <Situacao u={u} /> },
    { chave: "criadoEm", titulo: "Desde", filtro: { tipo: "data" }, ordemInicial: "desc", render: (u) => formatarData(u.criadoEm), className: "hidden md:table-cell whitespace-nowrap text-foreground-muted" },
    {
      chave: "acoes", titulo: "Ações", ordenavel: false, alinhar: "direita",
      render: (u) => u.id === eu?.id ? null : (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="secondary" onClick={() => void mudarPapel(u)}>{u.papel === "admin" ? <UserRound aria-hidden /> : <ShieldCheck aria-hidden />} {u.papel === "admin" ? "Tornar usuário" : "Tornar admin"}</Button>
          <Button size="icon-sm" variant="secondary" aria-label={`Criar senha temporária para ${u.nome}`} title="Criar senha temporária" onClick={() => void redefinir(u)}><KeyRound aria-hidden /></Button>
          <AcoesEmLinha controle={controle} linha={u} comRotulo={false} />
        </div>
      ),
    },
  ], [controle, eu?.id, mudarPapel, redefinir]);

  const total = resposta?.meta.total;
  const novoCaminho = empresaId ? `/empresas/${empresaId}/usuarios/novo` : "/acessos/novo";
  return (
    <div className="space-y-6">
      <CabecalhoHero
        rotulo="Administração"
        titulo={empresaId ? "Usuários da empresa" : "Usuários e acessos"}
        descricao="Quem entra no sistema e com qual papel. Contas novas recebem uma senha temporária."
        acao={<button type="button" onClick={() => navigate(novoCaminho)} className={classeAcaoHero}><ChipIconeAcao /> Novo usuário</button>}
        numeros={[{ valor: total, rotulo: "Usuários" }]}
      />
      <div className="card overflow-hidden">
        <BarraTabela tabela={tabela} colunas={colunas} placeholder="Pesquisar nome ou e-mail…" className="border-b border-borda p-4" />
        <TabelaDados
          tabela={tabela}
          colunas={colunas}
          chaveLinha={chave}
          acoes={controle}
          vazio="Nenhum usuário."
          renderCelular={(u) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><div className="font-medium">{u.nome}</div><div className="truncate text-xs text-foreground-muted">{u.email}</div></div>
                <Situacao u={u} />
              </div>
              {u.id !== eu?.id && (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => void mudarPapel(u)}>{u.papel === "admin" ? "Tornar usuário" : "Tornar admin"}</Button>
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => void redefinir(u)}><KeyRound aria-hidden /> Nova senha</Button>
                </div>
              )}
            </div>
          )}
        />
      </div>
      {senha && <SenhaTemporaria email={senha.email} senha={senha.senha} onFechar={() => setSenha(null)} />}
    </div>
  );
}
