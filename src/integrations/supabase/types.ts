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
          {
            foreignKeyName: "anonymous_votes_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "public_elections"
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
      elections: {
        Row: {
          bill_config: Json
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          identity_config: Json
          is_ongoing: boolean | null
          is_public: boolean
          start_date: string | null
          status: string | null
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
          is_ongoing?: boolean | null
          is_public?: boolean
          start_date?: string | null
          status?: string | null
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
          is_ongoing?: boolean | null
          is_public?: boolean
          start_date?: string | null
          status?: string | null
          title?: string
          voting_logic_config?: Json
          voting_page_config?: Json
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
            foreignKeyName: "voter_registry_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "public_elections"
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
      election_vote_summary: {
        Row: {
          election_id: string | null
          first_vote_at: string | null
          last_vote_at: string | null
          total_votes: number | null
          unique_options: number | null
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_votes_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymous_votes_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "public_elections"
            referencedColumns: ["id"]
          },
        ]
      }
      public_elections: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string | null
          is_ongoing: boolean | null
          is_public: boolean | null
          start_date: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string | null
          is_ongoing?: boolean | null
          is_public?: boolean | null
          start_date?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string | null
          is_ongoing?: boolean | null
          is_public?: boolean | null
          start_date?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_election_results: {
        Args: { election_uuid: string }
        Returns: {
          total_votes: number
          vote_count: number
          vote_value: string
        }[]
      }
      has_user_voted: { Args: { election_uuid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
