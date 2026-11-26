import { useParams } from "react-router-dom";
import type { ContaDetalhe } from "@/api/types";
import { EstadoCarga } from "@/components/EstadoCarga";
import { FormularioConta } from "@/components/contas/FormularioConta";
import { SerieRecorrente } from "@/components/contas/SerieRecorrente";
import { Skeleton } from "@/components/ui/skeleton";
import { useDadosApi } from "@/hooks/useDadosApi";
import { useVoltar } from "@/hooks/useVoltar";

/** /contas/nova e /contas/:id (com as parcelas da série, se recorrente). */
export default function ContaPage() {
  const { id } = useParams();
  const voltar = useVoltar("/contas");
  const carga = useDadosApi<ContaDetalhe>(id ? `/contas/${id}` : null, "Não foi possível carregar a conta.");
  if (!id) return <FormularioConta onFechar={voltar} onSalvo={voltar} />;
  return (
    <EstadoCarga carga={carga} esqueleto={<Skeleton className="h-96 w-full rounded-2xl" />}>
      {(conta) => (
        <div className="space-y-0">
          {/* key: ao abrir outra parcela da série, o formulário recomeça com os dados dela. */}
          <FormularioConta key={conta.id} conta={conta} onFechar={voltar} onSalvo={voltar} />
          <div className="-mt-6 pb-10">
            <SerieRecorrente conta={conta} onMudou={carga.recarregar} />
          </div>
        </div>
      )}
    </EstadoCarga>
  );
}
