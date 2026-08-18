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
          proof_url: string | null
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
          proof_url?: string | null
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
          proof_url?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["req_status"]
          user_id?: string
          utr?: string
        }
        Relationships: []
      }
      device_accounts: {
        Row: {
          created_at: string
          device_id: string
          fingerprint: string
          id: string
          user_agent: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          fingerprint?: string
          id?: string
          user_agent?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          fingerprint?: string
          id?: string
          user_agent?: string
          user_id?: string
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
          referral_code: string
          referred_by: string | null
        }
        Insert: {
          coins?: number
          created_at?: string
          email?: string
          id: string
          mobile?: string
          name?: string
          referral_code: string
          referred_by?: string | null
        }
        Update: {
          coins?: number
          created_at?: string
          email?: string
          id?: string
          mobile?: string
          name?: string
          referral_code?: string
          referred_by?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          coins: number
          created_at: string
          expires_at: string | null
          id: string
          max_uses: number
          updated_at: string
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          coins: number
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number
          updated_at?: string
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          coins?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          coins: number
          created_at: string
          id: string
          promo_id: string
          user_id: string
        }
        Insert: {
          coins: number
          created_at?: string
          id?: string
          promo_id: string
          user_id: string
        }
        Update: {
          coins?: number
          created_at?: string
          id?: string
          promo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_earnings: {
        Row: {
          coins: number
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          source: string
        }
        Insert: {
          coins: number
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          source?: string
        }
        Update: {
          coins?: number
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          source?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          claimed_at: string
          expires_at: string | null
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
          expires_at?: string | null
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
          expires_at?: string | null
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
          allow_multiple: boolean
          approved: boolean
          category: string
          claimed_count: number
          created_at: string
          created_by: string | null
          description: string
          disabled: boolean
          id: string
          is_admin_task: boolean
          link: string | null
          reward_coins: number
          sample_image_url: string | null
          title: string
          total_slots: number
        }
        Insert: {
          active?: boolean
          allow_multiple?: boolean
          approved?: boolean
          category?: string
          claimed_count?: number
          created_at?: string
          created_by?: string | null
          description?: string
          disabled?: boolean
          id?: string
          is_admin_task?: boolean
          link?: string | null
          reward_coins: number
          sample_image_url?: string | null
          title: string
          total_slots?: number
        }
        Update: {
          active?: boolean
          allow_multiple?: boolean
          approved?: boolean
          category?: string
          claimed_count?: number
          created_at?: string
          created_by?: string | null
          description?: string
          disabled?: boolean
          id?: string
          is_admin_task?: boolean
          link?: string | null
          reward_coins?: number
          sample_image_url?: string | null
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
          admin_note: string | null
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
          admin_note?: string | null
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
          admin_note?: string | null
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
      claim_task_slot: {
        Args: { p_minutes: number; p_task_id: string; p_user_id: string }
        Returns: string
      }
      gen_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recount_task_slots: { Args: { p_task_id: string }; Returns: undefined }
      register_device_account: {
        Args: {
          p_device_id: string
          p_fingerprint: string
          p_user_agent: string
          p_user_id: string
        }
        Returns: string
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
