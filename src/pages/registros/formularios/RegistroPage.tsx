import { useParams } from "react-router-dom";
import type { Registro } from "@/api/types";
import { FormularioRegistro } from "@/components/registros/FormularioRegistro";
import { TelaDoRegistro } from "@/components/ui/moldura-formulario";
import { useVoltar } from "@/hooks/useVoltar";

/** /registros/novo e /registros/:id */
export default function RegistroPage() {
  const { id } = useParams();
  const voltar = useVoltar("/registros");
  if (!id) return <FormularioRegistro onFechar={voltar} onSalvo={voltar} />;
  return (
    <TelaDoRegistro<Registro> caminho={`/registros/${id}`} mensagemFalha="Não foi possível carregar o registro.">
      {(registro) => <FormularioRegistro registro={registro} onFechar={voltar} onSalvo={voltar} />}
    </TelaDoRegistro>
  );
}
