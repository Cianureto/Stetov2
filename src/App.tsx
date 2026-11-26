import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/context/useAuth";
import { inicioDoUsuario } from "@/lib/permissoes";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ComPermissao } from "@/components/ComPermissao";
import { AppShell } from "@/components/layout/AppShell";
import LoginPage from "@/pages/auth/LoginPage";
import ClientesPage from "@/pages/clientes/ClientesPage";
import ClientePage from "@/pages/clientes/formularios/ClientePage";
import EmBreve from "@/pages/EmBreve";
import PerfilPage from "@/pages/perfil/PerfilPage";
import AcessosPage from "@/pages/acessos/AcessosPage";
import NovoUsuarioPage from "@/pages/acessos/NovoUsuarioPage";
import EmpresasPage from "@/pages/empresas/EmpresasPage";
import NovaEmpresaPage from "@/pages/empresas/NovaEmpresaPage";
import RelatoriosPage from "@/pages/relatorios/RelatoriosPage";
import PainelPage from "@/pages/painel/PainelPage";
import PendenciasPage from "@/pages/pendencias/PendenciasPage";
import ContasPage from "@/pages/contas/ContasPage";
import ContaPage from "@/pages/contas/formularios/ContaPage";
import CategoriasPage from "@/pages/contas/CategoriasPage";
import RegistrosPage from "@/pages/registros/RegistrosPage";
import RegistroPage from "@/pages/registros/formularios/RegistroPage";
import EmpresasContabeisPage from "@/pages/empresas-contabeis/EmpresasContabeisPage";
import EmpresaContabilPage from "@/pages/empresas-contabeis/EmpresaContabilPage";
import EmpresaContabilFormPage from "@/pages/empresas-contabeis/formularios/EmpresaContabilFormPage";
import PrestadoresPage from "@/pages/prestadores/PrestadoresPage";
import PrestadorPage from "@/pages/prestadores/formularios/PrestadorPage";

function Home() {
  const { usuario, carregando } = useAuth();
  if (carregando && !usuario) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  return <Navigate to={inicioDoUsuario(usuario)} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/painel" element={<ComPermissao permissao="painel.ver"><PainelPage /></ComPermissao>} />
              <Route path="/relatorios" element={<ComPermissao permissao="relatorios.ver"><RelatoriosPage /></ComPermissao>} />
              <Route path="/registros" element={<ComPermissao permissao="registros.ver"><RegistrosPage /></ComPermissao>} />
              <Route path="/registros/novo" element={<ComPermissao permissao="registros.gerenciar"><RegistroPage /></ComPermissao>} />
              <Route path="/registros/:id" element={<ComPermissao permissao="registros.gerenciar"><RegistroPage /></ComPermissao>} />
              <Route path="/contas" element={<ComPermissao permissao="contas.ver"><ContasPage /></ComPermissao>} />
              <Route path="/contas/categorias" element={<ComPermissao permissao="contas.gerenciar"><CategoriasPage /></ComPermissao>} />
              <Route path="/contas/nova" element={<ComPermissao permissao="contas.gerenciar"><ContaPage /></ComPermissao>} />
              <Route path="/contas/:id" element={<ComPermissao permissao="contas.gerenciar"><ContaPage /></ComPermissao>} />
              <Route path="/pendencias" element={<ComPermissao permissao="clientes.gerenciar"><PendenciasPage /></ComPermissao>} />

              <Route path="/clientes" element={<ComPermissao permissao="clientes.gerenciar"><ClientesPage /></ComPermissao>} />
              <Route path="/clientes/novo" element={<ComPermissao permissao="clientes.gerenciar"><ClientePage /></ComPermissao>} />
              <Route path="/clientes/:id" element={<ComPermissao permissao="clientes.gerenciar"><ClientePage /></ComPermissao>} />
              <Route path="/prestadores" element={<ComPermissao permissao="prestadores.gerenciar"><PrestadoresPage /></ComPermissao>} />
              <Route path="/prestadores/novo" element={<ComPermissao permissao="prestadores.gerenciar"><PrestadorPage /></ComPermissao>} />
              <Route path="/prestadores/:id" element={<ComPermissao permissao="prestadores.gerenciar"><PrestadorPage /></ComPermissao>} />
              <Route path="/empresas-contabeis" element={<ComPermissao permissao="empresas_contabeis.gerenciar"><EmpresasContabeisPage /></ComPermissao>} />
              <Route path="/empresas-contabeis/nova" element={<ComPermissao permissao="empresas_contabeis.gerenciar"><EmpresaContabilFormPage /></ComPermissao>} />
              <Route path="/empresas-contabeis/:id" element={<ComPermissao permissao="empresas_contabeis.gerenciar"><EmpresaContabilPage /></ComPermissao>} />
              <Route path="/empresas-contabeis/:id/editar" element={<ComPermissao permissao="empresas_contabeis.gerenciar"><EmpresaContabilFormPage /></ComPermissao>} />

              <Route path="/importacao" element={<ComPermissao permissao="importacao.executar"><EmBreve itens={["Planilha com mapeamento de colunas", "XML de NFSe", "Histórico com erros por linha"]} /></ComPermissao>} />
              <Route path="/acessos" element={<ComPermissao permissao="acessos.gerenciar"><AcessosPage /></ComPermissao>} />
              <Route path="/acessos/novo" element={<ComPermissao permissao="acessos.gerenciar"><NovoUsuarioPage /></ComPermissao>} />
              <Route path="/empresas" element={<ComPermissao permissao="empresas.gerenciar"><EmpresasPage /></ComPermissao>} />
              <Route path="/empresas/nova" element={<ComPermissao permissao="empresas.gerenciar"><NovaEmpresaPage /></ComPermissao>} />
              <Route path="/empresas/:empresaId/usuarios" element={<ComPermissao permissao="empresas.gerenciar"><AcessosPage /></ComPermissao>} />
              <Route path="/empresas/:empresaId/usuarios/novo" element={<ComPermissao permissao="empresas.gerenciar"><NovoUsuarioPage /></ComPermissao>} />
              <Route path="/auditoria" element={<ComPermissao permissao="auditoria.ver"><EmBreve itens={["Quem fez o quê e quando"]} /></ComPermissao>} />
              <Route path="/perfil" element={<PerfilPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
