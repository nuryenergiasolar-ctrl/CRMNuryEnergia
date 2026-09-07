export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cobrancas: {
        Row: {
          cliente: string
          created_at: string
          descricao: string | null
          endereco: string | null
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          orcamento_id: string | null
          pago: boolean
          pago_em: string | null
          parcela: number
          telefone: string | null
          tipo: string | null
          total_parcelas: number
          updated_at: string
          valor: number
          vencimento: string
          vendedor: string | null
        }
        Insert: {
          cliente: string
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          orcamento_id?: string | null
          pago?: boolean
          pago_em?: string | null
          parcela?: number
          telefone?: string | null
          tipo?: string | null
          total_parcelas?: number
          updated_at?: string
          valor?: number
          vencimento?: string
          vendedor?: string | null
        }
        Update: {
          cliente?: string
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          orcamento_id?: string | null
          pago?: boolean
          pago_em?: string | null
          parcela?: number
          telefone?: string | null
          tipo?: string | null
          total_parcelas?: number
          updated_at?: string
          valor?: number
          vencimento?: string
          vendedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cobrancas_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          chave: string
          created_at: string
          updated_at: string
          valor: Json
        }
        Insert: {
          chave: string
          created_at?: string
          updated_at?: string
          valor?: Json
        }
        Update: {
          chave?: string
          created_at?: string
          updated_at?: string
          valor?: Json
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          arquivado_em: string | null
          concluido: boolean
          concluido_em: string | null
          created_at: string
          data_prevista: string
          id: string
          lead_id: string | null
          observacoes: string | null
          responsavel: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivado_em?: string | null
          concluido?: boolean
          concluido_em?: string | null
          created_at?: string
          data_prevista?: string
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          responsavel?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivado_em?: string | null
          concluido?: boolean
          concluido_em?: string | null
          created_at?: string
          data_prevista?: string
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          responsavel?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      integracoes: {
        Row: {
          ativo: boolean
          canal: string
          created_at: string
          id: string
          identificador: string | null
          observacoes: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          canal: string
          created_at?: string
          id?: string
          identificador?: string | null
          observacoes?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          canal?: string
          created_at?: string
          id?: string
          identificador?: string | null
          observacoes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lead_historico: {
        Row: {
          autor: string | null
          campo: string
          created_at: string
          id: string
          lead_id: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          autor?: string | null
          campo: string
          created_at?: string
          id?: string
          lead_id: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          autor?: string | null
          campo?: string
          created_at?: string
          id?: string
          lead_id?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_historico_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          arquivado_em: string | null
          campanha: string | null
          cidade: string | null
          created_at: string
          data_entrada: string
          data_fechamento: string | null
          email: string | null
          endereco: string | null
          etapa: string
          id: string
          motivo_perda: string | null
          nome: string
          observacoes: string | null
          origem: string
          produto: string | null
          produto_id: string | null
          telefone: string | null
          temperatura: string
          tipo: string
          ultimo_contato: string | null
          updated_at: string
          valor: number | null
          vendedor: string | null
        }
        Insert: {
          arquivado_em?: string | null
          campanha?: string | null
          cidade?: string | null
          created_at?: string
          data_entrada?: string
          data_fechamento?: string | null
          email?: string | null
          endereco?: string | null
          etapa?: string
          id?: string
          motivo_perda?: string | null
          nome: string
          observacoes?: string | null
          origem?: string
          produto?: string | null
          produto_id?: string | null
          telefone?: string | null
          temperatura?: string
          tipo?: string
          ultimo_contato?: string | null
          updated_at?: string
          valor?: number | null
          vendedor?: string | null
        }
        Update: {
          arquivado_em?: string | null
          campanha?: string | null
          cidade?: string | null
          created_at?: string
          data_entrada?: string
          data_fechamento?: string | null
          email?: string | null
          endereco?: string | null
          etapa?: string
          id?: string
          motivo_perda?: string | null
          nome?: string
          observacoes?: string | null
          origem?: string
          produto?: string | null
          produto_id?: string | null
          telefone?: string | null
          temperatura?: string
          tipo?: string
          ultimo_contato?: string | null
          updated_at?: string
          valor?: number | null
          vendedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_investimentos: {
        Row: {
          campanha: string | null
          canal: string
          cliques: number
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          impressoes: number
          leads_gerados: number
          observacoes: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          campanha?: string | null
          canal?: string
          cliques?: number
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          impressoes?: number
          leads_gerados?: number
          observacoes?: string | null
          updated_at?: string
          valor?: number
        }
        Update: {
          campanha?: string | null
          canal?: string
          cliques?: number
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          impressoes?: number
          leads_gerados?: number
          observacoes?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      metas: {
        Row: {
          created_at: string
          id: string
          observacoes: string | null
          periodo_fim: string | null
          periodo_inicio: string
          tipo: string
          titulo: string
          updated_at: string
          valor: number
          vendedor: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          observacoes?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string
          tipo?: string
          titulo: string
          updated_at?: string
          valor?: number
          vendedor?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          observacoes?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          valor?: number
          vendedor?: string | null
        }
        Relationships: []
      }
      orcamento_historico: {
        Row: {
          autor: string | null
          campo: string
          created_at: string
          id: string
          orcamento_id: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          autor?: string | null
          campo: string
          created_at?: string
          id?: string
          orcamento_id: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          autor?: string | null
          campo?: string
          created_at?: string
          id?: string
          orcamento_id?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_historico_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          anexos: Json
          arquivado_em: string | null
          cliente: string
          created_at: string
          data_conclusao: string | null
          data_pedido: string
          endereco: string | null
          equipamento: string | null
          id: string
          numero: string
          observacoes: string | null
          potencia: string | null
          prazo: string | null
          prioridade: string
          responsavel: string | null
          status: string
          telefone: string | null
          tipo: string
          updated_at: string
          valor: number | null
          vendedor: string
        }
        Insert: {
          anexos?: Json
          arquivado_em?: string | null
          cliente: string
          created_at?: string
          data_conclusao?: string | null
          data_pedido?: string
          endereco?: string | null
          equipamento?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          potencia?: string | null
          prazo?: string | null
          prioridade?: string
          responsavel?: string | null
          status?: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
          valor?: number | null
          vendedor: string
        }
        Update: {
          anexos?: Json
          arquivado_em?: string | null
          cliente?: string
          created_at?: string
          data_conclusao?: string | null
          data_pedido?: string
          endereco?: string | null
          equipamento?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          potencia?: string | null
          prazo?: string | null
          prioridade?: string
          responsavel?: string | null
          status?: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
          valor?: number | null
          vendedor?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preco_base: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preco_base?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco_base?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendedores: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          id: string
          meta_mensal: number | null
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          meta_mensal?: number | null
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          meta_mensal?: number | null
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      meu_vendedor: { Args: never; Returns: string }
      pode_ver_lead: { Args: { _id: string }; Returns: boolean }
      pode_ver_orcamento: { Args: { _id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "vendedor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "vendedor"],
    },
  },
} as const
