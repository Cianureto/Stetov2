import { useParams } from "react-router-dom";
import type { Prestador } from "@/api/types";
import { FormularioPrestador } from "@/components/prestadores/FormularioPrestador";
import { TelaDoRegistro } from "@/components/ui/moldura-formulario";
import { useVoltar } from "@/hooks/useVoltar";

/** /prestadores/novo e /prestadores/:id */
export default function PrestadorPage() {
  const { id } = useParams();
  const voltar = useVoltar("/prestadores");
  if (!id) return <FormularioPrestador onFechar={voltar} onSalvo={voltar} />;
  return (
    <TelaDoRegistro<Prestador> caminho={`/prestadores/${id}`} mensagemFalha="Não foi possível carregar o prestador.">
      {(prestador) => <FormularioPrestador prestador={prestador} onFechar={voltar} onSalvo={voltar} />}
    </TelaDoRegistro>
  );
}
