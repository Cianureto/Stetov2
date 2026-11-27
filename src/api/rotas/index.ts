// Registra todas as rotas do app (cada arquivo chama `rota(...)` ao ser importado).
// Ordem importa só dentro de um arquivo: rotas fixas ("/clientes/opcoes") antes das com parâmetro ("/clientes/:id").
import "@/api/rotas/auth";
import "@/api/rotas/clientes";
import "@/api/rotas/empresasContabeis";
import "@/api/rotas/prestadores";
import "@/api/rotas/registros";
import "@/api/rotas/contas";
import "@/api/rotas/categorias";
import "@/api/rotas/painel";
import "@/api/rotas/relatorios";
import "@/api/rotas/usuarios";
import "@/api/rotas/pedidosAcesso";
import "@/api/rotas/auditoria";
import "@/api/rotas/importacao";
