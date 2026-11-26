import { useState } from "react";
import { useParams } from "react-router-dom";
import { FormularioUsuario, type UsuarioCriado } from "@/components/conta/FormularioUsuario";
import { SenhaTemporaria } from "@/components/conta/SenhaTemporaria";
import { useVoltar } from "@/hooks/useVoltar";

/** /acessos/novo e /empresas/:empresaId/usuarios/novo — depois de criar, mostra a senha temporária e volta. */
export default function NovoUsuarioPage() {
  const { empresaId } = useParams();
  const voltar = useVoltar(empresaId ? `/empresas/${empresaId}/usuarios` : "/acessos");
  const [criado, setCriado] = useState<UsuarioCriado | null>(null);
  return (
    <>
      <FormularioUsuario empresaId={empresaId} onFechar={voltar} onSalvo={setCriado} />
      {criado && <SenhaTemporaria email={criado.email} senha={criado.senhaTemporaria} onFechar={voltar} />}
    </>
  );
}
