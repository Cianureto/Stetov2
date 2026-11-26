// Gerado a partir do schema do Supabase (projeto Steto). Não edite à mão:
// regenere após cada migration.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "17.1"
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          acao: string
          antes: Json | null
          created_at: string
          depois: Json | null
          empresa_id: string | null
          id: number
          registro_id: string | null
          tabela: string
          usuario_email: string | null
          usuario_id: string | null
        }
        Insert: never
        Update: never
        Relationships: []
      }
      categorias_contas: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_id: string
          id: string
          legacy_id: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          legacy_id?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          legacy_id?: string | null
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_contas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          importacao_id: string | null
          aliquota_cofins: number
          aliquota_csll: number
          aliquota_ir: number
          aliquota_iss: number
          aliquota_pis: number
          created_at: string
          desconto_padrao_percent: number
          documento: string
          email: string | null
          empresa_id: string
          endereco: string | null
          id: string
          legacy_id: string | null
          origem_importacao: string | null
          razao_social: string
          regime_tributario: Database["public"]["Enums"]["regime_tributario"] | null
          status: Database["public"]["Enums"]["status_cliente"]
          telefone: string | null
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa"]
          updated_at: string
        }
        Insert: {
          importacao_id?: string | null
          aliquota_cofins?: number
          aliquota_csll?: number
          aliquota_ir?: number
          aliquota_iss?: number
          aliquota_pis?: number
          created_at?: string
          desconto_padrao_percent?: number
          documento: string
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          id?: string
          legacy_id?: string | null
          origem_importacao?: string | null
          razao_social: string
          regime_tributario?: Database["public"]["Enums"]["regime_tributario"] | null
          status?: Database["public"]["Enums"]["status_cliente"]
          telefone?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa"]
          updated_at?: string
        }
        Update: {
          importacao_id?: string | null
          aliquota_cofins?: number
          aliquota_csll?: number
          aliquota_ir?: number
          aliquota_iss?: number
          aliquota_pis?: number
          created_at?: string
          desconto_padrao_percent?: number
          documento?: string
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          id?: string
          legacy_id?: string | null
          origem_importacao?: string | null
          razao_social?: string
          regime_tributario?: Database["public"]["Enums"]["regime_tributario"] | null
          status?: Database["public"]["Enums"]["status_cliente"]
          telefone?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas: {
        Row: {
          grupo_recorrencia: string | null
          ajustes: Json
          banco_pagamento_codigo: string | null
          banco_pagamento_nome: string | null
          categoria_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          empresa_contabil_id: string | null
          empresa_id: string
          id: string
          legacy_id: string | null
          observacao: string | null
          recorrente: boolean
          status: Database["public"]["Enums"]["status_conta"]
          subcategoria_id: string | null
          tipo: Database["public"]["Enums"]["tipo_conta"]
          updated_at: string
          valor: number
          valor_base: number
        }
        Insert: {
          grupo_recorrencia?: string | null
          ajustes?: Json
          banco_pagamento_codigo?: string | null
          banco_pagamento_nome?: string | null
          categoria_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          empresa_contabil_id?: string | null
          empresa_id?: string
          id?: string
          legacy_id?: string | null
          observacao?: string | null
          recorrente?: boolean
          status?: Database["public"]["Enums"]["status_conta"]
          subcategoria_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_conta"]
          updated_at?: string
          valor: number
          valor_base: number
        }
        Update: {
          grupo_recorrencia?: string | null
          ajustes?: Json
          banco_pagamento_codigo?: string | null
          banco_pagamento_nome?: string | null
          categoria_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          empresa_contabil_id?: string | null
          empresa_id?: string
          id?: string
          legacy_id?: string | null
          observacao?: string | null
          recorrente?: boolean
          status?: Database["public"]["Enums"]["status_conta"]
          subcategoria_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_conta"]
          updated_at?: string
          valor?: number
          valor_base?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_empresa_contabil_id_fkey"
            columns: ["empresa_contabil_id"]
            isOneToOne: false
            referencedRelation: "empresas_contabeis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_subcategoria_id_fkey"
            columns: ["subcategoria_id"]
            isOneToOne: false
            referencedRelation: "subcategorias_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          is_steto: boolean
          legacy_id: string | null
          nome: string
          status: Database["public"]["Enums"]["status_ativo"]
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          is_steto?: boolean
          legacy_id?: string | null
          nome: string
          status?: Database["public"]["Enums"]["status_ativo"]
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          is_steto?: boolean
          legacy_id?: string | null
          nome?: string
          status?: Database["public"]["Enums"]["status_ativo"]
          updated_at?: string
        }
        Relationships: []
      }
      empresas_contabeis: {
        Row: {
          importacao_id: string | null
          cnpj: string
          created_at: string
          empresa_id: string
          id: string
          legacy_id: string | null
          nome_fantasia: string | null
          razao_social: string
          status: Database["public"]["Enums"]["status_ativo"]
          updated_at: string
        }
        Insert: {
          importacao_id?: string | null
          cnpj: string
          created_at?: string
          empresa_id?: string
          id?: string
          legacy_id?: string | null
          nome_fantasia?: string | null
          razao_social: string
          status?: Database["public"]["Enums"]["status_ativo"]
          updated_at?: string
        }
        Update: {
          importacao_id?: string | null
          cnpj?: string
          created_at?: string
          empresa_id?: string
          id?: string
          legacy_id?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          status?: Database["public"]["Enums"]["status_ativo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresas_contabeis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_importacoes: {
        Row: {
          created_at: string
          criado_por: string | null
          empresa_id: string
          falhadas: number
          id: string
          importadas: number
          legacy_id: string | null
          nome_arquivo: string
          novos_cadastros: number
          relatorio_erros: string | null
          status: Database["public"]["Enums"]["status_importacao"]
          tipo: Database["public"]["Enums"]["tipo_importacao"]
          total_linhas: number
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          empresa_id?: string
          falhadas?: number
          id?: string
          importadas?: number
          legacy_id?: string | null
          nome_arquivo: string
          novos_cadastros?: number
          relatorio_erros?: string | null
          status: Database["public"]["Enums"]["status_importacao"]
          tipo: Database["public"]["Enums"]["tipo_importacao"]
          total_linhas: number
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          empresa_id?: string
          falhadas?: number
          id?: string
          importadas?: number
          legacy_id?: string | null
          nome_arquivo?: string
          novos_cadastros?: number
          relatorio_erros?: string | null
          status?: Database["public"]["Enums"]["status_importacao"]
          tipo?: Database["public"]["Enums"]["tipo_importacao"]
          total_linhas?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_importacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          created_at: string
          email: string
          empresa_id: string
          id: string
          legacy_id: string | null
          nome: string | null
          papel: Database["public"]["Enums"]["papel_usuario"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          empresa_id: string
          id: string
          legacy_id?: string | null
          nome?: string | null
          papel?: Database["public"]["Enums"]["papel_usuario"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          empresa_id?: string
          id?: string
          legacy_id?: string | null
          nome?: string | null
          papel?: Database["public"]["Enums"]["papel_usuario"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      prestador_clientes: {
        Row: {
          ativo: boolean
          cliente_id: string
          created_at: string
          empresa_id: string
          prestador_id: string
        }
        Insert: {
          ativo?: boolean
          cliente_id: string
          created_at?: string
          empresa_id?: string
          prestador_id: string
        }
        Update: {
          ativo?: boolean
          cliente_id?: string
          created_at?: string
          empresa_id?: string
          prestador_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestador_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_clientes_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      prestador_empresas_contabeis: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_contabil_id: string
          empresa_id: string
          prestador_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_contabil_id: string
          empresa_id?: string
          prestador_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa_contabil_id?: string
          empresa_id?: string
          prestador_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestador_empresas_contabeis_empresa_contabil_id_fkey"
            columns: ["empresa_contabil_id"]
            isOneToOne: false
            referencedRelation: "empresas_contabeis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_empresas_contabeis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_empresas_contabeis_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      prestadores: {
        Row: {
          importacao_id: string | null
          agencia: string | null
          banco: string | null
          cadastro_completo: boolean | null
          chave_pix: string | null
          conta: string | null
          cpf: string
          created_at: string
          crm: string | null
          desconto_padrao_percent: number
          email: string | null
          empresa_id: string
          id: string
          legacy_id: string | null
          nome_completo: string
          regime_tributario: Database["public"]["Enums"]["regime_tributario"] | null
          status: Database["public"]["Enums"]["status_ativo"]
          telefone: string | null
          tipo_conta: Database["public"]["Enums"]["tipo_conta_bancaria"] | null
          updated_at: string
        }
        Insert: {
          importacao_id?: string | null
          agencia?: string | null
          banco?: string | null
          chave_pix?: string | null
          conta?: string | null
          cpf: string
          created_at?: string
          crm?: string | null
          desconto_padrao_percent?: number
          email?: string | null
          empresa_id?: string
          id?: string
          legacy_id?: string | null
          nome_completo: string
          regime_tributario?: Database["public"]["Enums"]["regime_tributario"] | null
          status?: Database["public"]["Enums"]["status_ativo"]
          telefone?: string | null
          tipo_conta?: Database["public"]["Enums"]["tipo_conta_bancaria"] | null
          updated_at?: string
        }
        Update: {
          importacao_id?: string | null
          agencia?: string | null
          banco?: string | null
          chave_pix?: string | null
          conta?: string | null
          cpf?: string
          created_at?: string
          crm?: string | null
          desconto_padrao_percent?: number
          email?: string | null
          empresa_id?: string
          id?: string
          legacy_id?: string | null
          nome_completo?: string
          regime_tributario?: Database["public"]["Enums"]["regime_tributario"] | null
          status?: Database["public"]["Enums"]["status_ativo"]
          telefone?: string | null
          tipo_conta?: Database["public"]["Enums"]["tipo_conta_bancaria"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestadores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_financeiros: {
        Row: {
          aliquota_cofins: number
          aliquota_csll: number
          aliquota_ir: number
          aliquota_iss: number
          aliquota_pis: number
          desconto_padrao_percent: number
          importacao_id: string | null
          acrescimo: number
          agencia: string | null
          aplicar_desconto: boolean
          banco: string | null
          chave_pix: string | null
          cliente_id: string
          competencia: string
          conta: string | null
          created_at: string
          data_pagamento: string | null
          desconto_adicional: number
          desconto_adicional_percent: number
          desconto_padrao_aplicado: number
          desconto_total_percent: number
          descontos: Json
          empresa_contabil_id: string
          empresa_id: string
          id: string
          legacy_id: string | null
          numero_nfs: string | null
          prestador_id: string
          setor: string | null
          situacao: Database["public"]["Enums"]["situacao_registro"]
          tipo_conta: Database["public"]["Enums"]["tipo_conta_bancaria"] | null
          tipo_pagamento: Database["public"]["Enums"]["tipo_pagamento"] | null
          updated_at: string
          valor_antecipacao: number
          valor_cofins: number
          valor_csll: number
          valor_devolucao: number
          valor_final_repasse: number
          valor_ir: number
          valor_iss: number
          valor_nf: number
          valor_pis: number
          valor_ted: number
          valor_total_tributos: number
        }
        Insert: {
          aliquota_cofins?: number
          aliquota_csll?: number
          aliquota_ir?: number
          aliquota_iss?: number
          aliquota_pis?: number
          desconto_padrao_percent?: number
          importacao_id?: string | null
          acrescimo?: number
          agencia?: string | null
          aplicar_desconto?: boolean
          banco?: string | null
          chave_pix?: string | null
          cliente_id: string
          competencia: string
          conta?: string | null
          created_at?: string
          data_pagamento?: string | null
          desconto_adicional?: number
          desconto_adicional_percent?: number
          desconto_padrao_aplicado?: number
          desconto_total_percent?: number
          descontos?: Json
          empresa_contabil_id: string
          empresa_id?: string
          id?: string
          legacy_id?: string | null
          numero_nfs?: string | null
          prestador_id: string
          setor?: string | null
          situacao?: Database["public"]["Enums"]["situacao_registro"]
          tipo_conta?: Database["public"]["Enums"]["tipo_conta_bancaria"] | null
          tipo_pagamento?: Database["public"]["Enums"]["tipo_pagamento"] | null
          updated_at?: string
          valor_antecipacao?: number
          valor_cofins?: number
          valor_csll?: number
          valor_devolucao?: number
          valor_final_repasse?: number
          valor_ir?: number
          valor_iss?: number
          valor_nf: number
          valor_pis?: number
          valor_ted?: number
          valor_total_tributos?: number
        }
        Update: {
          aliquota_cofins?: number
          aliquota_csll?: number
          aliquota_ir?: number
          aliquota_iss?: number
          aliquota_pis?: number
          desconto_padrao_percent?: number
          importacao_id?: string | null
          acrescimo?: number
          agencia?: string | null
          aplicar_desconto?: boolean
          banco?: string | null
          chave_pix?: string | null
          cliente_id?: string
          competencia?: string
          conta?: string | null
          created_at?: string
          data_pagamento?: string | null
          desconto_adicional?: number
          desconto_adicional_percent?: number
          desconto_padrao_aplicado?: number
          desconto_total_percent?: number
          descontos?: Json
          empresa_contabil_id?: string
          empresa_id?: string
          id?: string
          legacy_id?: string | null
          numero_nfs?: string | null
          prestador_id?: string
          setor?: string | null
          situacao?: Database["public"]["Enums"]["situacao_registro"]
          tipo_conta?: Database["public"]["Enums"]["tipo_conta_bancaria"] | null
          tipo_pagamento?: Database["public"]["Enums"]["tipo_pagamento"] | null
          updated_at?: string
          valor_antecipacao?: number
          valor_cofins?: number
          valor_csll?: number
          valor_devolucao?: number
          valor_final_repasse?: number
          valor_ir?: number
          valor_iss?: number
          valor_nf?: number
          valor_pis?: number
          valor_ted?: number
          valor_total_tributos?: number
        }
        Relationships: [
          {
            foreignKeyName: "registros_financeiros_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_financeiros_empresa_contabil_id_fkey"
            columns: ["empresa_contabil_id"]
            isOneToOne: false
            referencedRelation: "empresas_contabeis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_financeiros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_financeiros_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategorias_contas: {
        Row: {
          ativo: boolean
          categoria_id: string
          created_at: string
          empresa_id: string
          id: string
          legacy_id: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id: string
          created_at?: string
          empresa_id?: string
          id?: string
          legacy_id?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string
          created_at?: string
          empresa_id?: string
          id?: string
          legacy_id?: string | null
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategorias_contas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcategorias_contas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mesclar_cliente: {
        Args: { p_destino: string; p_origem: string }
        Returns: undefined
      }
      ranking_registros: {
        Args: { p_ate?: string; p_de?: string; p_empresa_contabil?: string; p_limite?: number; p_por: string }
        Returns: {
          id: string
          nome: string
          quantidade: number
          repasse: number
          repasse_pago: number
          repasse_pendente: number
          valor_nf: number
        }[]
      }
      resumo_contas: {
        Args: { p_ate?: string; p_de?: string }
        Returns: Json
      }
      resumo_registros: {
        Args: {
          p_ate?: string
          p_cliente?: string
          p_de?: string
          p_empresa_contabil?: string
          p_prestador?: string
          p_situacao?: Database["public"]["Enums"]["situacao_registro"]
        }
        Returns: Json
      }
      serie_mensal_registros: {
        Args: { p_empresa_contabil?: string; p_meses?: number }
        Returns: { competencia: string; quantidade: number; repasse: number; valor_nf: number }[]
      }
      salvar_prestador: {
        Args: {
          p_clientes: string[]
          p_dados: Json
          p_empresas_contabeis: string[]
          p_id: string
        }
        Returns: string
      }
    }
    Enums: {
      papel_usuario: "admin" | "usuario"
      regime_tributario: "simples_nacional" | "lucro_presumido" | "lucro_real"
      situacao_registro: "pendente" | "pago" | "cancelado"
      status_ativo: "ativo" | "inativo"
      status_cliente: "ativo" | "inativo" | "provisorio"
      status_conta: "pendente" | "pago" | "vencido"
      status_importacao: "sucesso" | "parcial" | "falha"
      tipo_conta: "pagar" | "receber"
      tipo_conta_bancaria: "corrente" | "poupanca"
      tipo_importacao: "registros_financeiros" | "clientes" | "prestadores" | "empresas_contabeis"
      tipo_pagamento: "banco" | "caixa"
      tipo_pessoa: "PJ" | "PF"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]
