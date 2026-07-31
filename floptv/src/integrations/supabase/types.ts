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
      chat_messages: {
        Row: {
          created_at: string
          display_name: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      like_totals: {
        Row: {
          avatar_url: string | null
          client_id: string
          created_at: string
          display_name: string
          id: string
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          client_id: string
          created_at?: string
          display_name?: string
          id?: string
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          client_id?: string
          created_at?: string
          display_name?: string
          id?: string
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lower_thirds: {
        Row: {
          accent_color: string
          accent_width: number
          air_since: string | null
          animation: string
          auto_hide_seconds: number
          badge_text: string
          bg_color: string
          corner_radius: number
          created_at: string
          font_scale: number
          id: string
          image_shape: string
          image_url: string | null
          is_active: boolean
          opacity: number
          position: string
          shadow: boolean
          style: string
          subtitle: string
          subtitle_color: string
          text_color: string
          ticker: boolean
          title: string
          updated_at: string
          uppercase: boolean
        }
        Insert: {
          accent_color?: string
          accent_width?: number
          air_since?: string | null
          animation?: string
          auto_hide_seconds?: number
          badge_text?: string
          bg_color?: string
          corner_radius?: number
          created_at?: string
          font_scale?: number
          id?: string
          image_shape?: string
          image_url?: string | null
          is_active?: boolean
          opacity?: number
          position?: string
          shadow?: boolean
          style?: string
          subtitle?: string
          subtitle_color?: string
          text_color?: string
          ticker?: boolean
          title?: string
          updated_at?: string
          uppercase?: boolean
        }
        Update: {
          accent_color?: string
          accent_width?: number
          air_since?: string | null
          animation?: string
          auto_hide_seconds?: number
          badge_text?: string
          bg_color?: string
          corner_radius?: number
          created_at?: string
          font_scale?: number
          id?: string
          image_shape?: string
          image_url?: string | null
          is_active?: boolean
          opacity?: number
          position?: string
          shadow?: boolean
          style?: string
          subtitle?: string
          subtitle_color?: string
          text_color?: string
          ticker?: boolean
          title?: string
          updated_at?: string
          uppercase?: boolean
        }
        Relationships: []
      }
      playlist_items: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          title: string
          updated_at: string
          youtube_video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
          youtube_video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          youtube_video_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      schedule_items: {
        Row: {
          created_at: string
          day: string
          description: string
          id: string
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day?: string
          description?: string
          id?: string
          start_time?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day?: string
          description?: string
          id?: string
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      stream_config: {
        Row: {
          description: string
          id: number
          interlude_started_at: string | null
          interlude_video_id: string | null
          is_live: boolean
          loop_stream: boolean
          pause_message: string
          paused: boolean
          started_at: string | null
          sync_mode: boolean
          title: string
          updated_at: string
          youtube_video_id: string | null
        }
        Insert: {
          description?: string
          id?: number
          interlude_started_at?: string | null
          interlude_video_id?: string | null
          is_live?: boolean
          loop_stream?: boolean
          pause_message?: string
          paused?: boolean
          started_at?: string | null
          sync_mode?: boolean
          title?: string
          updated_at?: string
          youtube_video_id?: string | null
        }
        Update: {
          description?: string
          id?: number
          interlude_started_at?: string | null
          interlude_video_id?: string | null
          is_live?: boolean
          loop_stream?: boolean
          pause_message?: string
          paused?: boolean
          started_at?: string | null
          sync_mode?: boolean
          title?: string
          updated_at?: string
          youtube_video_id?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_likes: {
        Args: {
          _amount: number
          _avatar_url: string
          _client_id: string
          _display_name: string
        }
        Returns: undefined
      }
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
    },
  },
} as const
