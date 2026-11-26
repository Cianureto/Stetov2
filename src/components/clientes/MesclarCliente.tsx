import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { Cliente, OpcaoApi } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Seletor } from "@/components/ui/seletor";
import { useAcao } from "@/hooks/useAcao";
import { useDadosApi } from "@/hooks/useDadosApi";

/** Mescla um cliente provisório num cliente existente: registros e vínculos passam para ele e o provisório some. */
export function MesclarCliente({ cliente, onFechar, onMesclado }: { cliente: Cliente; onFechar: () => void; onMesclado: () => void }) {
  const opcoes = useDadosApi<OpcaoApi[]>("/clientes/opcoes");
  const [destino, setDestino] = useState("");
  const { pendente, erro, executar } = useAcao("Não foi possível mesclar.");
  const lista = useMemo(() => (opcoes.dados ?? []).filter((o) => o.valor !== cliente.id), [opcoes.dados, cliente.id]);

  const mesclar = () =>
    executar(async () => {
      await api.post(`/clientes/${cliente.id}/mesclar`, { destinoId: destino });
      toast.success(`${cliente.razaoSocial} foi mesclado.`);
      onMesclado();
    });

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="md:max-w-md">
        <DialogHeader>
          <DialogTitle>Mesclar {cliente.razaoSocial}</DialogTitle>
          <DialogDescription>Os registros financeiros e os vínculos com prestadores passam para o cliente escolhido, e este cadastro provisório é excluído.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {erro && <p role="alert" className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">{erro}</p>}
          <div>
            <Label htmlFor="mesclar-destino">Cliente que fica</Label>
            <Seletor id="mesclar-destino" rotulo="Cliente que fica" pesquisavel valor={destino} onChange={setDestino} opcoes={lista} placeholder={opcoes.carregando ? "Carregando..." : "Escolha o cliente"} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" className="flex-1" onClick={onFechar}>Cancelar</Button>
            <Button variant="accent" className="flex-1" disabled={!destino || pendente} onClick={() => void mesclar()}>{pendente ? "Mesclando..." : "Mesclar"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
