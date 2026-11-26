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
              <Route path="/painel" element={<ComPermissao permissao="painel.ver"><EmBreve itens={["Totais do mês: notas, tributos e repasses", "Evolução mensal", "Últimos registros", "Contas vencendo em 7 dias"]} /></ComPermissao>} />
              <Route path="/relatorios" element={<ComPermissao permissao="relatorios.ver"><EmBreve itens={["Filtros por período, empresa contábil e situação", "Exportação para Excel", "Resumo do período gerado por IA"]} /></ComPermissao>} />
              <Route path="/registros" element={<ComPermissao permissao="registros.ver"><EmBreve itens={["Lançamento por cliente, prestador, empresa contábil e mês", "Cálculo de tributos, descontos e repasse", "Situação com atualização em lote"]} /></ComPermissao>} />
              <Route path="/registros/novo" element={<ComPermissao permissao="registros.gerenciar"><EmBreve itens={["Formulário de lançamento em tela própria"]} /></ComPermissao>} />
              <Route path="/contas" element={<ComPermissao permissao="contas.ver"><EmBreve itens={["Contas com vencimento, status e banco", "Categorias e subcategorias", "Ajustes e recorrência"]} /></ComPermissao>} />
              <Route path="/contas/nova" element={<ComPermissao permissao="contas.gerenciar"><EmBreve itens={["Formulário de conta em tela própria"]} /></ComPermissao>} />
              <Route path="/pendencias" element={<ComPermissao permissao="clientes.gerenciar"><EmBreve itens={["Clientes provisórios criados por importação", "Correção rápida dos dados que faltam"]} /></ComPermissao>} />

              <Route path="/clientes" element={<ComPermissao permissao="clientes.gerenciar"><ClientesPage /></ComPermissao>} />
              <Route path="/clientes/novo" element={<ComPermissao permissao="clientes.gerenciar"><ClientePage /></ComPermissao>} />
              <Route path="/clientes/:id" element={<ComPermissao permissao="clientes.gerenciar"><ClientePage /></ComPermissao>} />
              <Route path="/prestadores" element={<ComPermissao permissao="prestadores.gerenciar"><EmBreve itens={["Lista com cadastro completo/incompleto", "Dados bancários e Pix", "Vínculos com clientes e empresas contábeis"]} /></ComPermissao>} />
              <Route path="/prestadores/novo" element={<ComPermissao permissao="prestadores.gerenciar"><EmBreve itens={["Formulário de prestador em tela própria"]} /></ComPermissao>} />
              <Route path="/empresas-contabeis" element={<ComPermissao permissao="empresas_contabeis.gerenciar"><EmBreve itens={["Empresas pelas quais as notas são emitidas", "Clientes e prestadores vinculados"]} /></ComPermissao>} />

              <Route path="/importacao" element={<ComPermissao permissao="importacao.executar"><EmBreve itens={["Planilha com mapeamento de colunas", "XML de NFSe", "Histórico com erros por linha"]} /></ComPermissao>} />
              <Route path="/acessos" element={<ComPermissao permissao="acessos.gerenciar"><EmBreve itens={["Usuários da empresa", "Perfis de acesso com permissões"]} /></ComPermissao>} />
              <Route path="/empresas" element={<ComPermissao permissao="empresas.gerenciar"><EmBreve itens={["Empresas que usam o Steto", "Ativar e inativar"]} /></ComPermissao>} />
              <Route path="/auditoria" element={<ComPermissao permissao="auditoria.ver"><EmBreve itens={["Quem fez o quê e quando"]} /></ComPermissao>} />
              <Route path="/perfil" element={<EmBreve itens={["Dados pessoais", "Trocar senha"]} />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
