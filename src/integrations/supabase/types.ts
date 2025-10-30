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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      anonymous_votes: {
        Row: {
          election_id: string
          id: string
          metadata: Json | null
          vote_value: string
          vote_weight: number | null
          voted_at: string
        }
        Insert: {
          election_id: string
          id?: string
          metadata?: Json | null
          vote_value: string
          vote_weight?: number | null
          voted_at?: string
        }
        Update: {
          election_id?: string
          id?: string
          metadata?: Json | null
          vote_value?: string
          vote_weight?: number | null
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_votes_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      delegations: {
        Row: {
          active: boolean
          created_at: string
          delegate_id: string
          delegator_id: string
          id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          delegate_id: string
          delegator_id: string
          id?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          delegate_id?: string
          delegator_id?: string
          id?: string
        }
        Relationships: []
      }
      discussion_comments: {
        Row: {
          content: string
          created_at: string
          election_id: string
          id: string
          is_edited: boolean | null
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          election_id: string
          id?: string
          is_edited?: boolean | null
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          election_id?: string
          id?: string
          is_edited?: boolean | null
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_comments_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "discussion_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      elections: {
        Row: {
          bill_config: Json
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          identity_config: Json
          illustration_url: string | null
          is_ongoing: boolean | null
          is_public: boolean
          start_date: string | null
          status: string | null
          tags: string[] | null
          title: string
          voting_logic_config: Json
          voting_page_config: Json
        }
        Insert: {
          bill_config: Json
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          identity_config: Json
          illustration_url?: string | null
          is_ongoing?: boolean | null
          is_public?: boolean
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          voting_logic_config: Json
          voting_page_config: Json
        }
        Update: {
          bill_config?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          identity_config?: Json
          illustration_url?: string | null
          is_ongoing?: boolean | null
          is_public?: boolean
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          voting_logic_config?: Json
          voting_page_config?: Json
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          notification_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          notification_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          notification_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          comment_id: string | null
          created_at: string
          election_id: string | null
          id: string
          is_read: boolean
          metadata: Json | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          related_user_id: string | null
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          election_id?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          related_user_id?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          election_id?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          related_user_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          profile_video_url: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          profile_video_url?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          profile_video_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      voter_registry: {
        Row: {
          election_id: string
          id: string
          vote_id: string | null
          voted_at: string
          voter_id: string
        }
        Insert: {
          election_id: string
          id?: string
          vote_id?: string | null
          voted_at?: string
          voter_id: string
        }
        Update: {
          election_id?: string
          id?: string
          vote_id?: string | null
          voted_at?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voter_registry_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voter_registry_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "anonymous_votes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_user_vote_in_election: {
        Args: { p_election_id: string; p_user_id?: string }
        Returns: boolean
      }
      get_election_results: {
        Args: { election_uuid: string }
        Returns: {
          total_votes: number
          vote_count: number
          vote_value: string
        }[]
      }
      get_valid_delegators_for_election: {
        Args: { delegate_user_id: string; election_id: string }
        Returns: {
          delegator_count: number
          delegators: Json
        }[]
      }
      has_user_voted: { Args: { election_uuid: string }; Returns: boolean }
      is_valid_vote_value: {
        Args: { election_uuid: string; vote_val: string }
        Returns: boolean
      }
      should_notify_user: {
        Args: { p_notification_type: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      notification_type:
        | "comment_reply"
        | "delegation_received"
        | "delegator_voted"
        | "election_started"
        | "election_ending_soon"
        | "election_ended"
        | "election_invitation"
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
      notification_type: [
        "comment_reply",
        "delegation_received",
        "delegator_voted",
        "election_started",
        "election_ending_soon",
        "election_ended",
        "election_invitation",
      ],
    },
  },
} as const
