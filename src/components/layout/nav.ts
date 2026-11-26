import {
  BarChart3,
  Building,
  Building2,
  ClipboardList,
  FileUp,
  Hospital,
  LayoutDashboard,
  type LucideIcon,
  Receipt,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Quem vê o item. As permissões reais ficam no banco (RLS); isto só esconde o menu. */
  acesso?: 'admin' | 'steto-admin'
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  { items: [{ label: 'Visão geral', to: '/', icon: LayoutDashboard }] },
  {
    label: 'Cadastros',
    items: [
      { label: 'Empresas contábeis', to: '/empresas-contabeis', icon: Building2 },
      { label: 'Clientes', to: '/clientes', icon: Hospital },
      { label: 'Prestadores', to: '/prestadores', icon: UserRound },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { label: 'Registros financeiros', to: '/registros', icon: Receipt },
      { label: 'Contas a pagar e receber', to: '/contas', icon: Wallet },
      { label: 'Pendências de clientes', to: '/pendencias', icon: ClipboardList },
      { label: 'Relatórios', to: '/relatorios', icon: BarChart3 },
    ],
  },
  {
    label: 'Administração',
    items: [
      { label: 'Importação', to: '/importacao', icon: FileUp, acesso: 'admin' },
      { label: 'Usuários', to: '/usuarios', icon: Users, acesso: 'admin' },
      { label: 'Empresas', to: '/empresas', icon: Building, acesso: 'steto-admin' },
    ],
  },
]
