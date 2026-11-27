import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { Categoria, ContaDetalhe, OpcaoApi } from "@/api/types";
import { CamposAjustes } from "@/components/contas/CamposAjustes";
import { Button } from "@/components/ui/button";
import { CampoMoeda } from "@/components/ui/campo-moeda";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MolduraFormulario, type PropsFormulario } from "@/components/ui/moldura-formulario";
import { SecaoFormulario } from "@/components/ui/secao-formulario";
import { Seletor } from "@/components/ui/seletor";
import { useAcao } from "@/hooks/useAcao";
import { useDadosApi } from "@/hooks/useDadosApi";
import { BANCOS, rotuloBanco } from "@/lib/bancos";
import { hojeBrasilia, valorFinalConta, type Ajuste } from "@/lib/contas";
import { formatarMoeda } from "@/lib/format";
import { CaixaMarcar } from "@/components/ui/caixa-marcar";
import { PilulaDeslizante } from "@/components/ui/pilula-deslizante";

const OPCOES_STATUS = [{ valor: "pendente", rotulo: "Pendente" }, { valor: "pago", rotulo: "Paga" }];

/** Conta a pagar ou receber (tela /contas/nova e /contas/:id). Recorrente gera 12 parcelas mensais ao criar. */
export function FormularioConta({ modo, conta, onFechar, onSalvo }: PropsFormulario<ContaDetalhe> & { conta?: ContaDetalhe }) {
  const [tipo, setTipo] = useState<"pagar" | "receber">(conta?.tipo ?? "pagar");
  const [descricao, setDescricao] = useState(conta?.descricao ?? "");
  const [categoriaId, setCategoriaId] = useState(conta?.categoria?.id ?? "");
  const [subcategoriaId, setSubcategoriaId] = useState(conta?.subcategoria?.id ?? "");
  const [empresaContabilId, setEmpresaContabilId] = useState(conta?.empresaContabil?.id ?? "");
  const [valorBase, setValorBase] = useState(conta?.valorBase ?? 0);
  const [ajustes, setAjustes] = useState<Ajuste[]>(conta?.ajustes ?? []);
  const [dataVencimento, setDataVencimento] = useState(conta?.dataVencimento ?? hojeBrasilia());
  const [status, setStatus] = useState<"pendente" | "pago">(conta?.status ?? "pendente");
  const [dataPagamento, setDataPagamento] = useState(conta?.dataPagamento ?? "");
  const [banco, setBanco] = useState(conta?.bancoPagamento ?? "");
  const [observacao, setObservacao] = useState(conta?.observacao ?? "");
  const [recorrente, setRecorrente] = useState(conta?.recorrente ?? false);
  const categorias = useDadosApi<Categoria[]>("/categorias-contas");
  const empresas = useDadosApi<OpcaoApi[]>("/empresas-contabeis/opcoes");
  const { pendente, erro, executar } = useAcao("Não foi possível salvar a conta.");

  const valorFinal = valorFinalConta(valorBase, ajustes);
  const opcoesCategoria = useMemo(() => (categorias.dados ?? []).filter((c) => c.ativo || c.id === categoriaId).map((c) => ({ valor: c.id, rotulo: c.nome })), [categorias.dados, categoriaId]);
  const opcoesSub = useMemo(
    () => (categorias.dados?.find((c) => c.id === categoriaId)?.subcategorias ?? []).filter((s) => s.ativo || s.id === subcategoriaId).map((s) => ({ valor: s.id, rotulo: s.nome })),
    [categorias.dados, categoriaId, subcategoriaId],
  );
  const opcoesBanco = useMemo(() => {
    const lista = BANCOS.map((b) => ({ valor: rotuloBanco(b), rotulo: rotuloBanco(b) }));
    return banco && !lista.some((o) => o.valor === banco) ? [{ valor: banco, rotulo: banco }, ...lista] : lista;
  }, [banco]);
  const pagamentoInformado = status === "pago" || !!dataPagamento;

  async function salvar(e: FormEvent) {
    e.preventDefault();
    await executar(async () => {
      if (pagamentoInformado && !banco) throw new Error("Informe o banco do pagamento.");
      const corpo = {
        tipo, descricao, categoriaId, subcategoriaId: subcategoriaId || null, empresaContabilId: empresaContabilId || null, valorBase, ajustes,
        dataVencimento, status, dataPagamento: dataPagamento || null, bancoPagamento: banco || null, observacao, recorrente,
      };
      const salva = conta ? await api.patch<ContaDetalhe>(`/contas/${conta.id}`, corpo) : await api.post<ContaDetalhe>("/contas", corpo);
      toast.success(conta ? "Conta atualizada." : recorrente ? "Conta cadastrada com 12 parcelas mensais." : "Conta cadastrada.");
      onSalvo(salva);
    });
  }

  return (
    <MolduraFormulario
      modo={modo}
      rotulo="Financeiro"
      titulo={conta ? "Editar conta" : "Nova conta"}
      descricao="Despesa a pagar ou valor a receber da empresa."
      largura="lg"
      onFechar={onFechar}
      onSubmit={salvar}
      erro={erro}
      footer={
        <>
          <Button type="button" variant="secondary" className="flex-1" onClick={onFechar}>Cancelar</Button>
          <Button type="submit" variant="accent" className="flex-1" disabled={pendente}>{pendente ? "Salvando..." : conta ? "Salvar alterações" : "Cadastrar conta"}</Button>
        </>
      }
    >
      <SecaoFormulario titulo="Conta">
        <div className="segmented" role="radiogroup" aria-label="Tipo da conta">
          {(["pagar", "receber"] as const).map((t) => (
            <button key={t} type="button" role="radio" aria-checked={tipo === t} className={`segmented-item ${tipo === t ? "active" : ""}`} onClick={() => setTipo(t)}>
              {tipo === t && <PilulaDeslizante grupo="tipo-conta" className="rounded-[7px] bg-areia-card shadow-[var(--shadow-sm)]" />}
              {t === "pagar" ? "A pagar" : "A receber"}
            </button>
          ))}
        </div>
        <div>
          <Label htmlFor="conta-descricao">Descrição</Label>
          <Input id="conta-descricao" required minLength={2} maxLength={200} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
        <div className="grid gap-3 @2xl:grid-cols-3">
          <div>
            <Label htmlFor="conta-categoria">Categoria</Label>
            <Seletor id="conta-categoria" rotulo="Categoria" obrigatorio pesquisavel valor={categoriaId} onChange={(v) => { setCategoriaId(v); setSubcategoriaId(""); }} opcoes={opcoesCategoria} placeholder={categorias.carregando ? "Carregando..." : "Escolha a categoria"} />
          </div>
          <div>
            <Label htmlFor="conta-subcategoria">Subcategoria</Label>
            <Seletor id="conta-subcategoria" rotulo="Subcategoria" opcaoVazia="Nenhuma" valor={subcategoriaId} onChange={setSubcategoriaId} opcoes={opcoesSub} desabilitado={!categoriaId} />
          </div>
          <div>
            <Label htmlFor="conta-empresa">Empresa contábil</Label>
            <Seletor id="conta-empresa" rotulo="Empresa contábil" opcaoVazia="Nenhuma" pesquisavel valor={empresaContabilId} onChange={setEmpresaContabilId} opcoes={empresas.dados ?? []} />
          </div>
        </div>
      </SecaoFormulario>

      <SecaoFormulario titulo="Valor" descricao={ajustes.length ? `Valor final: ${formatarMoeda(valorFinal)}` : "Acrescente juros, multa ou desconto se houver."}>
        <div className="grid gap-3 @2xl:grid-cols-[14rem_14rem]">
          <div>
            <Label htmlFor="conta-valor">Valor base</Label>
            <CampoMoeda id="conta-valor" valor={valorBase} onChange={setValorBase} />
          </div>
          <div>
            <Label htmlFor="conta-vencimento">Vencimento</Label>
            <Input id="conta-vencimento" type="date" required value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />
          </div>
        </div>
        <CamposAjustes ajustes={ajustes} onChange={setAjustes} />
        <p className="rounded-lg bg-[var(--areia)] px-3 py-2 text-sm">
          Valor final: <strong className="tabular-nums">{formatarMoeda(valorFinal)}</strong>
        </p>
      </SecaoFormulario>

      <SecaoFormulario titulo="Pagamento">
        <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-3">
          <div>
            <Label htmlFor="conta-status">Situação</Label>
            <Seletor id="conta-status" rotulo="Situação" valor={status} onChange={(v) => setStatus(v as "pendente" | "pago")} opcoes={OPCOES_STATUS} />
          </div>
          <div>
            <Label htmlFor="conta-data-pagamento">Data do pagamento</Label>
            <Input id="conta-data-pagamento" type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} />
          </div>
          <div className="col-span-2 @2xl:col-span-1">
            <Label htmlFor="conta-banco">Banco do pagamento{pagamentoInformado ? "" : " (ao pagar)"}</Label>
            <Seletor id="conta-banco" rotulo="Banco do pagamento" pesquisavel opcaoVazia="Não informado" obrigatorio={pagamentoInformado} valor={banco} onChange={setBanco} opcoes={opcoesBanco} />
          </div>
        </div>
      </SecaoFormulario>

      <SecaoFormulario titulo="Outros">
        <div>
          <Label htmlFor="conta-observacao">Observação</Label>
          <textarea id="conta-observacao" rows={2} maxLength={1000} className="input resize-y" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </div>
        {!conta && (
          <label className="flex items-start gap-2.5 text-sm">
            <CaixaMarcar className="mt-0.5" marcada={recorrente} onChange={setRecorrente} />
            <span>
              <span className="font-medium">Conta recorrente</span>
              <span className="block text-xs text-foreground-muted">Cria 12 parcelas mensais a partir do vencimento. Cada parcela pode ser editada depois.</span>
            </span>
          </label>
        )}
      </SecaoFormulario>
    </MolduraFormulario>
  );
}
