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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      core_lists: {
        Row: {
          created_at: string
          difficulty: string
          id: string
          source_weekly_todo_id: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: string
          id?: string
          source_weekly_todo_id?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          id?: string
          source_weekly_todo_id?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_lists_source_weekly_todo_id_fkey"
            columns: ["source_weekly_todo_id"]
            isOneToOne: false
            referencedRelation: "weekly_todos"
            referencedColumns: ["id"]
          },
        ]
      }
      core_tasks: {
        Row: {
          created_at: string
          done: boolean
          due: string | null
          goal_id: string
          id: string
          notes: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          profile_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          due?: string | null
          goal_id: string
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          profile_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          due?: string | null
          goal_id?: string
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          profile_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_tasks_goal_id_goals_id_fk"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string | null
          following_id: string | null
        }
        Insert: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
        }
        Update: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_profiles_profile_id_fk"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "follows_following_id_profiles_profile_id_fk"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string | null
          created_at: string
          id: string
          profile_id: string
          status: Database["public"]["Enums"]["goal_status"]
          target: string | null
          title: string
          updated_at: string
          why: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          profile_id: string
          status?: Database["public"]["Enums"]["goal_status"]
          target?: string | null
          title: string
          updated_at?: string
          why: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target?: string | null
          title?: string
          updated_at?: string
          why?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      message_room_member: {
        Row: {
          created_at: string | null
          profile_id: string
          room_id: number
        }
        Insert: {
          created_at?: string | null
          profile_id: string
          room_id: number
        }
        Update: {
          created_at?: string | null
          profile_id?: string
          room_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "message_room_member_profile_id_profiles_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "message_room_member_room_id_message_rooms_room_id_fk"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "message_rooms"
            referencedColumns: ["room_id"]
          },
        ]
      }
      message_rooms: {
        Row: {
          created_at: string | null
          room_id: number
        }
        Insert: {
          created_at?: string | null
          room_id?: never
        }
        Update: {
          created_at?: string | null
          room_id?: never
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          message_id: number
          room_id: number | null
          sender_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          message_id?: never
          room_id?: number | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          message_id?: never
          room_id?: number | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_message_rooms_room_id_fk"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "message_rooms"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "messages_sender_id_profiles_profile_id_fk"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      notifications: {
        Row: {
          core_list_id: string
          created_at: string | null
          goal_id: string | null
          notification_id: number
          source_id: string | null
          target_id: string
          todo_list_id: number
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          core_list_id: string
          created_at?: string | null
          goal_id?: string | null
          notification_id?: never
          source_id?: string | null
          target_id: string
          todo_list_id: number
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          core_list_id?: string
          created_at?: string | null
          goal_id?: string | null
          notification_id?: never
          source_id?: string | null
          target_id?: string
          todo_list_id?: number
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_core_list_id_core_tasks_id_fk"
            columns: ["core_list_id"]
            isOneToOne: false
            referencedRelation: "core_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_goal_id_goals_id_fk"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_source_id_profiles_profile_id_fk"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "notifications_target_id_profiles_profile_id_fk"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "notifications_todo_list_id_todo_list_id_fk"
            columns: ["todo_list_id"]
            isOneToOne: false
            referencedRelation: "todo_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_todo_list_id_todo_list_id_fk"
            columns: ["todo_list_id"]
            isOneToOne: false
            referencedRelation: "todo_list_test_view"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_styles: Database["public"]["Enums"]["ai_styles"] | null
          avatar: string | null
          bio: string | null
          created_at: string | null
          headline: string | null
          histories: Json | null
          motivation_type: Database["public"]["Enums"]["motivation_type"] | null
          name: string
          profile_id: string
          task_count: Database["public"]["Enums"]["task_count"] | null
          todo_style: Database["public"]["Enums"]["todo_style"] | null
          updated_at: string | null
          username: string
        }
        Insert: {
          ai_styles?: Database["public"]["Enums"]["ai_styles"] | null
          avatar?: string | null
          bio?: string | null
          created_at?: string | null
          headline?: string | null
          histories?: Json | null
          motivation_type?:
            | Database["public"]["Enums"]["motivation_type"]
            | null
          name: string
          profile_id: string
          task_count?: Database["public"]["Enums"]["task_count"] | null
          todo_style?: Database["public"]["Enums"]["todo_style"] | null
          updated_at?: string | null
          username: string
        }
        Update: {
          ai_styles?: Database["public"]["Enums"]["ai_styles"] | null
          avatar?: string | null
          bio?: string | null
          created_at?: string | null
          headline?: string | null
          histories?: Json | null
          motivation_type?:
            | Database["public"]["Enums"]["motivation_type"]
            | null
          name?: string
          profile_id?: string
          task_count?: Database["public"]["Enums"]["task_count"] | null
          todo_style?: Database["public"]["Enums"]["todo_style"] | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      todo_list: {
        Row: {
          created_at: string | null
          done: boolean | null
          id: number
          profile_id: string | null
          text: string
        }
        Insert: {
          created_at?: string | null
          done?: boolean | null
          id?: number
          profile_id?: string | null
          text: string
        }
        Update: {
          created_at?: string | null
          done?: boolean | null
          id?: number
          profile_id?: string | null
          text?: string
        }
        Relationships: []
      }
      weekly_todo_history: {
        Row: {
          checked_count: number
          created_at: string
          id: string
          period_end: string
          period_start: string
          promoted_to_core: boolean
          title: string
          user_id: string
          weekly_todo_id: string
        }
        Insert: {
          checked_count: number
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          promoted_to_core?: boolean
          title: string
          user_id: string
          weekly_todo_id: string
        }
        Update: {
          checked_count?: number
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          promoted_to_core?: boolean
          title?: string
          user_id?: string
          weekly_todo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_todo_history_weekly_todo_id_fkey"
            columns: ["weekly_todo_id"]
            isOneToOne: false
            referencedRelation: "weekly_todos"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_todos: {
        Row: {
          check_0: boolean
          check_1: boolean
          check_2: boolean
          check_3: boolean
          check_4: boolean
          check_5: boolean
          check_6: boolean
          checks: boolean[]
          core_list_id: string | null
          created_at: string
          id: string
          period_end: string
          period_start: string
          promoted_to_core: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          check_0?: boolean
          check_1?: boolean
          check_2?: boolean
          check_3?: boolean
          check_4?: boolean
          check_5?: boolean
          check_6?: boolean
          checks?: boolean[]
          core_list_id?: string | null
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          promoted_to_core?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          check_0?: boolean
          check_1?: boolean
          check_2?: boolean
          check_3?: boolean
          check_4?: boolean
          check_5?: boolean
          check_6?: boolean
          checks?: boolean[]
          core_list_id?: string | null
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          promoted_to_core?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_todos_core_list_id_fkey"
            columns: ["core_list_id"]
            isOneToOne: false
            referencedRelation: "core_lists"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      todo_list_test_view: {
        Row: {
          created_at: string | null
          done: boolean | null
          id: number | null
          profile_id: string | null
          text: string | null
        }
        Insert: {
          created_at?: string | null
          done?: boolean | null
          id?: number | null
          profile_id?: string | null
          text?: string | null
        }
        Update: {
          created_at?: string | null
          done?: boolean | null
          id?: number | null
          profile_id?: string | null
          text?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ai_styles: "soft" | "strict" | "playful"
      goal_status: "active" | "done"
      motivation_type: "reward" | "progress" | "meaning"
      notification_type: "goal" | "todo" | "core" | "mention"
      task_count: "few" | "normal" | "many"
      task_priority: "low" | "medium" | "high"
      todo_style: "driver" | "dreamer" | "developer" | "drifter"
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
      ai_styles: ["soft", "strict", "playful"],
      goal_status: ["active", "done"],
      motivation_type: ["reward", "progress", "meaning"],
      notification_type: ["goal", "todo", "core", "mention"],
      task_count: ["few", "normal", "many"],
      task_priority: ["low", "medium", "high"],
      todo_style: ["driver", "dreamer", "developer", "drifter"],
    },
  },
} as const
