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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount_inr: number
          coins: number
          created_at: string
          id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["req_status"]
          user_id: string
          utr: string
        }
        Insert: {
          amount_inr: number
          coins: number
          created_at?: string
          id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["req_status"]
          user_id: string
          utr?: string
        }
        Update: {
          amount_inr?: number
          coins?: number
          created_at?: string
          id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["req_status"]
          user_id?: string
          utr?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          coins: number
          created_at: string
          email: string
          id: string
          mobile: string
          name: string
        }
        Insert: {
          coins?: number
          created_at?: string
          email?: string
          id: string
          mobile?: string
          name?: string
        }
        Update: {
          coins?: number
          created_at?: string
          email?: string
          id?: string
          mobile?: string
          name?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          claimed_at: string
          id: string
          note: string | null
          proof_url: string | null
          reviewed_at: string | null
          reward_coins: number
          status: Database["public"]["Enums"]["req_status"]
          submitted_at: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          id?: string
          note?: string | null
          proof_url?: string | null
          reviewed_at?: string | null
          reward_coins?: number
          status?: Database["public"]["Enums"]["req_status"]
          submitted_at?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          id?: string
          note?: string | null
          proof_url?: string | null
          reviewed_at?: string | null
          reward_coins?: number
          status?: Database["public"]["Enums"]["req_status"]
          submitted_at?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          active: boolean
          claimed_count: number
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_admin_task: boolean
          link: string | null
          reward_coins: number
          title: string
          total_slots: number
        }
        Insert: {
          active?: boolean
          claimed_count?: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_admin_task?: boolean
          link?: string | null
          reward_coins: number
          title: string
          total_slots?: number
        }
        Update: {
          active?: boolean
          claimed_count?: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_admin_task?: boolean
          link?: string | null
          reward_coins?: number
          title?: string
          total_slots?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount_inr: number
          coins: number
          created_at: string
          id: string
          method: string
          payout_detail: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["req_status"]
          user_id: string
        }
        Insert: {
          amount_inr: number
          coins: number
          created_at?: string
          id?: string
          method: string
          payout_detail?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["req_status"]
          user_id: string
        }
        Update: {
          amount_inr?: number
          coins?: number
          created_at?: string
          id?: string
          method?: string
          payout_detail?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["req_status"]
          user_id?: string
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
    }
    Enums: {
      app_role: "admin" | "user"
      req_status: "pending" | "approved" | "rejected"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "user"],
      req_status: ["pending", "approved", "rejected"],
    },
  },
} as const
