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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          bcc_replies: boolean
          created_at: string
          custom_sending_domain: string | null
          email: string
          id: string
          logo_path: string | null
          name: string
          notify_new_inquiry: boolean
          reply_to_email: string | null
          sender_email: string
          sender_name: string
          signature: string | null
          slug: string
          status: Database["public"]["Enums"]["business_status"]
          timezone: string
          updated_at: string
          website: string | null
        }
        Insert: {
          bcc_replies?: boolean
          created_at?: string
          custom_sending_domain?: string | null
          email: string
          id?: string
          logo_path?: string | null
          name: string
          notify_new_inquiry?: boolean
          reply_to_email?: string | null
          sender_email: string
          sender_name: string
          signature?: string | null
          slug: string
          status?: Database["public"]["Enums"]["business_status"]
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          bcc_replies?: boolean
          created_at?: string
          custom_sending_domain?: string | null
          email?: string
          id?: string
          logo_path?: string | null
          name?: string
          notify_new_inquiry?: boolean
          reply_to_email?: string | null
          sender_email?: string
          sender_name?: string
          signature?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["business_status"]
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          business_id: string
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          answered_at: string | null
          answered_manually: boolean
          archived_at: string | null
          business_id: string
          created_at: string
          customer_email: string
          customer_id: string
          customer_name: string
          id: string
          ip_hash: string | null
          message: string
          origin: string | null
          read_at: string | null
          reply_token: string
          search_text: string
          source_id: string | null
          subject: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          answered_at?: string | null
          answered_manually?: boolean
          archived_at?: string | null
          business_id: string
          created_at?: string
          customer_email: string
          customer_id: string
          customer_name: string
          id?: string
          ip_hash?: string | null
          message: string
          origin?: string | null
          read_at?: string | null
          reply_token?: string
          search_text?: string
          source_id?: string | null
          subject: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          answered_at?: string | null
          answered_manually?: boolean
          archived_at?: string | null
          business_id?: string
          created_at?: string
          customer_email?: string
          customer_id?: string
          customer_name?: string
          id?: string
          ip_hash?: string | null
          message?: string
          origin?: string | null
          read_at?: string | null
          reply_token?: string
          search_text?: string
          source_id?: string | null
          subject?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_customer_fk"
            columns: ["customer_id", "business_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "business_id"]
          },
          {
            foreignKeyName: "inquiries_source_fk"
            columns: ["source_id", "business_id"]
            isOneToOne: false
            referencedRelation: "inquiry_sources"
            referencedColumns: ["id", "business_id"]
          },
        ]
      }
      inquiry_events: {
        Row: {
          actor_id: string | null
          business_id: string
          created_at: string
          id: string
          inquiry_id: string
          message_id: string | null
          type: Database["public"]["Enums"]["inquiry_event_type"]
        }
        Insert: {
          actor_id?: string | null
          business_id: string
          created_at?: string
          id?: string
          inquiry_id: string
          message_id?: string | null
          type: Database["public"]["Enums"]["inquiry_event_type"]
        }
        Update: {
          actor_id?: string | null
          business_id?: string
          created_at?: string
          id?: string
          inquiry_id?: string
          message_id?: string | null
          type?: Database["public"]["Enums"]["inquiry_event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_events_inquiry_fk"
            columns: ["inquiry_id", "business_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id", "business_id"]
          },
          {
            foreignKeyName: "inquiry_events_inquiry_fk"
            columns: ["inquiry_id", "business_id"]
            isOneToOne: false
            referencedRelation: "inquiries_view"
            referencedColumns: ["id", "business_id"]
          },
          {
            foreignKeyName: "inquiry_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_sources: {
        Row: {
          allowed_origins: string[]
          business_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          public_key: string
          updated_at: string
        }
        Insert: {
          allowed_origins?: string[]
          business_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          public_key?: string
          updated_at?: string
        }
        Update: {
          allowed_origins?: string[]
          business_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          public_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_sources_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["membership_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attempt_count: number
          bcc_email: string | null
          body_html: string | null
          body_text: string
          business_id: string
          content: string
          created_at: string
          customer_id: string
          direction: Database["public"]["Enums"]["message_direction"]
          error_message: string | null
          from_email: string
          from_name: string | null
          id: string
          in_reply_to: string | null
          inquiry_id: string
          last_attempt_at: string | null
          provider: string
          provider_message_id: string | null
          received_at: string | null
          references_header: string | null
          reply_to_email: string | null
          rfc_message_id: string
          sent_at: string | null
          sent_by: string | null
          status: Database["public"]["Enums"]["message_status"]
          subject: string
          to_email: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          bcc_email?: string | null
          body_html?: string | null
          body_text: string
          business_id: string
          content: string
          created_at?: string
          customer_id: string
          direction?: Database["public"]["Enums"]["message_direction"]
          error_message?: string | null
          from_email: string
          from_name?: string | null
          id?: string
          in_reply_to?: string | null
          inquiry_id: string
          last_attempt_at?: string | null
          provider?: string
          provider_message_id?: string | null
          received_at?: string | null
          references_header?: string | null
          reply_to_email?: string | null
          rfc_message_id: string
          sent_at?: string | null
          sent_by?: string | null
          status: Database["public"]["Enums"]["message_status"]
          subject: string
          to_email: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          bcc_email?: string | null
          body_html?: string | null
          body_text?: string
          business_id?: string
          content?: string
          created_at?: string
          customer_id?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          error_message?: string | null
          from_email?: string
          from_name?: string | null
          id?: string
          in_reply_to?: string | null
          inquiry_id?: string
          last_attempt_at?: string | null
          provider?: string
          provider_message_id?: string | null
          received_at?: string | null
          references_header?: string | null
          reply_to_email?: string | null
          rfc_message_id?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string
          to_email?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_customer_fk"
            columns: ["customer_id", "business_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "business_id"]
          },
          {
            foreignKeyName: "messages_inquiry_fk"
            columns: ["inquiry_id", "business_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id", "business_id"]
          },
          {
            foreignKeyName: "messages_inquiry_fk"
            columns: ["inquiry_id", "business_id"]
            isOneToOne: false
            referencedRelation: "inquiries_view"
            referencedColumns: ["id", "business_id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          hits: number
          key: string
          window_start: string
        }
        Insert: {
          hits?: number
          key: string
          window_start: string
        }
        Update: {
          hits?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      inquiries_view: {
        Row: {
          answered_at: string | null
          answered_manually: boolean | null
          archived_at: string | null
          business_id: string | null
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          id: string | null
          ip_hash: string | null
          is_archived: boolean | null
          is_unread: boolean | null
          message: string | null
          origin: string | null
          read_at: string | null
          reply_token: string | null
          search_text: string | null
          source_id: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          answered_at?: string | null
          answered_manually?: boolean | null
          archived_at?: string | null
          business_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string | null
          ip_hash?: string | null
          is_archived?: never
          is_unread?: never
          message?: string | null
          origin?: string | null
          read_at?: string | null
          reply_token?: string | null
          search_text?: string | null
          source_id?: string | null
          status?: never
          subject?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          answered_at?: string | null
          answered_manually?: boolean | null
          archived_at?: string | null
          business_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string | null
          ip_hash?: string | null
          is_archived?: never
          is_unread?: never
          message?: string | null
          origin?: string | null
          read_at?: string | null
          reply_token?: string | null
          search_text?: string | null
          source_id?: string | null
          status?: never
          subject?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_customer_fk"
            columns: ["customer_id", "business_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "business_id"]
          },
          {
            foreignKeyName: "inquiries_source_fk"
            columns: ["source_id", "business_id"]
            isOneToOne: false
            referencedRelation: "inquiry_sources"
            referencedColumns: ["id", "business_id"]
          },
        ]
      }
    }
    Functions: {
      check_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number }
        Returns: boolean
      }
      create_business_with_owner: {
        Args: {
          p_allowed_origins: string[]
          p_email: string
          p_name: string
          p_owner_id: string
          p_sender_email: string
          p_sender_name: string
          p_slug: string
          p_status?: Database["public"]["Enums"]["business_status"]
          p_timezone: string
          p_website: string
        }
        Returns: string
      }
      get_dashboard_stats: {
        Args: { p_business_id: string }
        Returns: {
          answered: number
          awaiting: number
          new: number
          total: number
          unread: number
        }[]
      }
      get_inquiry_activity: {
        Args: { p_business_id: string; p_days?: number }
        Returns: {
          day: string
          inquiries: number
        }[]
      }
      mark_inquiry_answered: {
        Args: { p_inquiry_id: string }
        Returns: boolean
      }
      mark_inquiry_unanswered: {
        Args: { p_inquiry_id: string }
        Returns: boolean
      }
      set_inquiry_archived: {
        Args: { p_archived: boolean; p_inquiry_id: string }
        Returns: boolean
      }
      submit_inquiry: {
        Args: {
          p_email: string
          p_ip_hash: string
          p_message: string
          p_name: string
          p_origin: string
          p_source_id: string
          p_subject: string
          p_user_agent: string
        }
        Returns: string
      }
    }
    Enums: {
      business_status: "pending" | "active" | "suspended"
      inquiry_event_type:
        | "received"
        | "reply_sent"
        | "reply_failed"
        | "marked_answered"
        | "marked_unanswered"
        | "archived"
        | "restored"
      membership_role: "owner" | "member"
      message_direction: "outbound" | "inbound"
      message_status: "sending" | "sent" | "failed" | "received"
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
      business_status: ["pending", "active", "suspended"],
      inquiry_event_type: [
        "received",
        "reply_sent",
        "reply_failed",
        "marked_answered",
        "marked_unanswered",
        "archived",
        "restored",
      ],
      membership_role: ["owner", "member"],
      message_direction: ["outbound", "inbound"],
      message_status: ["sending", "sent", "failed", "received"],
    },
  },
} as const
