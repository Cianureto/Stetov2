import { useParams } from "react-router-dom";
import type { Cliente } from "@/api/types";
import { FormularioCliente } from "@/components/clientes/FormularioCliente";
import { TelaDoRegistro } from "@/components/ui/moldura-formulario";
import { useVoltar } from "@/hooks/useVoltar";

/** /clientes/novo e /clientes/:id */
export default function ClientePage() {
  const { id } = useParams();
  const voltar = useVoltar("/clientes");
  if (!id) return <FormularioCliente onFechar={voltar} onSalvo={voltar} />;
  return (
    <TelaDoRegistro<Cliente> caminho={`/clientes/${id}`} mensagemFalha="Não foi possível carregar o cliente.">
      {(cliente) => <FormularioCliente cliente={cliente} onFechar={voltar} onSalvo={voltar} />}
    </TelaDoRegistro>
  );
}
