import { useParams } from "react-router-dom";
import type { EmpresaContabil } from "@/api/types";
import { FormularioEmpresaContabil } from "@/components/empresas-contabeis/FormularioEmpresaContabil";
import { TelaDoRegistro } from "@/components/ui/moldura-formulario";
import { useVoltar } from "@/hooks/useVoltar";

/** /empresas-contabeis/nova e /empresas-contabeis/:id/editar */
export default function EmpresaContabilFormPage() {
  const { id } = useParams();
  const voltar = useVoltar(id ? `/empresas-contabeis/${id}` : "/empresas-contabeis");
  if (!id) return <FormularioEmpresaContabil onFechar={voltar} onSalvo={voltar} />;
  return (
    <TelaDoRegistro<EmpresaContabil> caminho={`/empresas-contabeis/${id}`} mensagemFalha="Não foi possível carregar a empresa contábil.">
      {(empresa) => <FormularioEmpresaContabil empresa={empresa} onFechar={voltar} onSalvo={voltar} />}
    </TelaDoRegistro>
  );
}
