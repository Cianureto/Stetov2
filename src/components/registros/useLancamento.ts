import { useCallback, useState } from "react";
import { api } from "@/api/client";
import type { Cliente, Prestador, Registro } from "@/api/types";
import { aliquotasDoCliente, competenciaParaTela, TRIBUTOS, type Tributo } from "@/lib/repasse";
import { percentualParaCampo } from "@/lib/format";

const campoAliquotas = (a: Record<Tributo, number>) => Object.fromEntries(TRIBUTOS.map((t) => [t, percentualParaCampo(a[t])])) as Record<Tributo, string>;

/** Mês atual no formato da tela (MM/AAAA), no fuso de Brasília. */
const mesAtual = () => {
  const d = new Date(Date.now() - 3 * 3600_000);
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
};

/**
 * Estado do lançamento e as regras de preenchimento automático (as do app antigo):
 *  - prestador → desconto padrão, empresa contábil do primeiro vínculo e, se ele atende um só cliente, esse cliente;
 *  - cliente → alíquotas da nota (pessoa física: sem retenção).
 */
export function useLancamento(registro?: Registro) {
  const [prestadorId, setPrestadorId] = useState(registro?.prestador.id ?? "");
  const [clienteId, setClienteId] = useState(registro?.cliente.id ?? "");
  const [empresaContabilId, setEmpresaContabilId] = useState(registro?.empresaContabil.id ?? "");
  const [competencia, setCompetencia] = useState(registro ? competenciaParaTela(registro.competencia) : mesAtual());
  const [numeroNfs, setNumeroNfs] = useState(registro?.numeroNfs ?? "");
  const [setor, setSetor] = useState(registro?.setor ?? "");
  const [situacao, setSituacao] = useState<Registro["situacao"]>(registro?.situacao ?? "pendente");
  const [tipoPagamento, setTipoPagamento] = useState<string>(registro?.tipoPagamento ?? "banco");
  const [dataPagamento, setDataPagamento] = useState(registro?.dataPagamento ?? "");
  const [valorNf, setValorNf] = useState(registro?.valorNf ?? 0);
  const [aliquotas, setAliquotas] = useState<Record<Tributo, string>>(campoAliquotas(registro?.aliquotas ?? { pis: 0, cofins: 0, csll: 0, ir: 0, iss: 0 }));
  const [descontoAdicional, setDescontoAdicional] = useState(registro?.descontoAdicional ?? 0);
  const [acrescimo, setAcrescimo] = useState(registro?.acrescimo ?? 0);
  // % de desconto padrão: o gravado no registro enquanto o prestador for o mesmo; senão, o do cadastro.
  const [descontoPercent, setDescontoPercent] = useState(registro?.descontoPadraoPercent ?? 0);
  const [prestador, setPrestador] = useState<Prestador | null>(null);
  const [carregandoAuto, setCarregandoAuto] = useState(false);

  const escolherCliente = useCallback(async (id: string) => {
    setClienteId(id);
    if (!id) return;
    const c = await api.get<Cliente>(`/clientes/${id}`);
    setAliquotas(campoAliquotas(aliquotasDoCliente(c)));
  }, []);

  const escolherPrestador = useCallback(async (id: string) => {
    setPrestadorId(id);
    if (!id) return setPrestador(null);
    setCarregandoAuto(true);
    try {
      const p = await api.get<Prestador>(`/prestadores/${id}`);
      setPrestador(p);
      setDescontoPercent(registro && registro.prestador.id === id ? registro.descontoPadraoPercent : p.descontoPadraoPercent);
      setEmpresaContabilId((atual) => (atual && p.empresasContabeis.some((e) => e.id === atual) ? atual : (p.empresasContabeis[0]?.id ?? atual)));
      if (p.clientes.length === 1) await escolherCliente(p.clientes[0].id);
    } finally {
      setCarregandoAuto(false);
    }
  }, [registro, escolherCliente]);

  return {
    prestadorId, escolherPrestador, prestador, clienteId, escolherCliente, setClienteId, empresaContabilId, setEmpresaContabilId,
    competencia, setCompetencia, numeroNfs, setNumeroNfs, setor, setSetor, situacao, setSituacao, tipoPagamento, setTipoPagamento,
    dataPagamento, setDataPagamento, valorNf, setValorNf, aliquotas, setAliquotas, descontoAdicional, setDescontoAdicional,
    acrescimo, setAcrescimo, descontoPercent, carregandoAuto,
  };
}
