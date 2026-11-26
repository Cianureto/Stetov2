import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Seletor } from "@/components/ui/seletor";
import { BANCOS, rotuloBanco } from "@/lib/bancos";
import { TIPO_CONTA_BANCARIA_LABEL } from "@/lib/labels";

export type DadosBancarios = { banco: string; agencia: string; conta: string; tipoConta: string; chavePix: string };

const OPCOES_TIPO = Object.entries(TIPO_CONTA_BANCARIA_LABEL).map(([valor, rotulo]) => ({ valor, rotulo }));

/** Banco (lista com busca; um banco antigo fora da lista continua como opção), agência, conta, tipo e Pix. */
export function CamposBancarios({ valores, onChange }: { valores: DadosBancarios; onChange: (v: DadosBancarios) => void }) {
  const opcoesBanco = useMemo(() => {
    const lista = BANCOS.map((b) => ({ valor: rotuloBanco(b), rotulo: rotuloBanco(b) }));
    return valores.banco && !lista.some((o) => o.valor === valores.banco) ? [{ valor: valores.banco, rotulo: valores.banco }, ...lista] : lista;
  }, [valores.banco]);
  const mudar = (campo: keyof DadosBancarios, v: string) => onChange({ ...valores, [campo]: v });

  return (
    <>
      <div className="grid gap-3 @2xl:grid-cols-[minmax(0,1fr)_10rem]">
        <div>
          <Label htmlFor="prestador-banco">Banco</Label>
          <Seletor id="prestador-banco" rotulo="Banco" pesquisavel opcaoVazia="Não informado" valor={valores.banco} onChange={(v) => mudar("banco", v)} opcoes={opcoesBanco} placeholder="Escolha o banco" />
        </div>
        <div>
          <Label htmlFor="prestador-tipo-conta">Tipo de conta</Label>
          <Seletor id="prestador-tipo-conta" rotulo="Tipo de conta" opcaoVazia="—" valor={valores.tipoConta} onChange={(v) => mudar("tipoConta", v)} opcoes={OPCOES_TIPO} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-[10rem_12rem_minmax(0,1fr)]">
        <div>
          <Label htmlFor="prestador-agencia">Agência</Label>
          <Input id="prestador-agencia" inputMode="numeric" maxLength={10} className="tabular-nums" value={valores.agencia} onChange={(e) => mudar("agencia", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="prestador-conta">Conta</Label>
          <Input id="prestador-conta" maxLength={20} placeholder="00000-0" className="tabular-nums" value={valores.conta} onChange={(e) => mudar("conta", e.target.value)} />
        </div>
        <div className="col-span-2 @2xl:col-span-1">
          <Label htmlFor="prestador-pix">Chave Pix</Label>
          <Input id="prestador-pix" maxLength={140} autoComplete="off" placeholder="CPF, e-mail, telefone ou chave aleatória" value={valores.chavePix} onChange={(e) => mudar("chavePix", e.target.value)} />
        </div>
      </div>
    </>
  );
}
