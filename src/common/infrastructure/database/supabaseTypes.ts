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
      ActiveSessionBiometrics: {
        Row: {
          activated_at: string
          patient_id: number
        }
        Insert: {
          activated_at?: string
          patient_id: number
        }
        Update: {
          activated_at?: string
          patient_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ActiveSessionBiometrics_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "Patient"
            referencedColumns: ["id"]
          },
        ]
      }
      BiometricMinutes: {
        Row: {
          accel_std_g: number | null
          body_position_type: string | null
          eda_scl_usiemens: number | null
          id: number
          pulse_rate_bpm: number | null
          respiratory_rate_brpm: number | null
          temperature_celsius: number | null
          timestamp_iso: string
        }
        Insert: {
          accel_std_g?: number | null
          body_position_type?: string | null
          eda_scl_usiemens?: number | null
          id?: never
          pulse_rate_bpm?: number | null
          respiratory_rate_brpm?: number | null
          temperature_celsius?: number | null
          timestamp_iso: string
        }
        Update: {
          accel_std_g?: number | null
          body_position_type?: string | null
          eda_scl_usiemens?: number | null
          id?: never
          pulse_rate_bpm?: number | null
          respiratory_rate_brpm?: number | null
          temperature_celsius?: number | null
          timestamp_iso?: string
        }
        Relationships: []
      }
      ContextIntervals: {
        Row: {
          attempt_no: number | null
          context_type: string
          created_at: string | null
          end_minute_utc: string
          id: number
          patient_id: number
          session_id: number | null
          start_minute_utc: string
        }
        Insert: {
          attempt_no?: number | null
          context_type: string
          created_at?: string | null
          end_minute_utc: string
          id?: never
          patient_id: number
          session_id?: number | null
          start_minute_utc: string
        }
        Update: {
          attempt_no?: number | null
          context_type?: string
          created_at?: string | null
          end_minute_utc?: string
          id?: never
          patient_id?: number
          session_id?: number | null
          start_minute_utc?: string
        }
        Relationships: [
          {
            foreignKeyName: "ContextIntervals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "Patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ContextIntervals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["id"]
          },
        ]
      }
      Patient: {
        Row: {
          birth_date: string
          created_at: string | null
          email: string
          gender: string
          id: number
          name: string
          surname: string
          user_id: string
          username: string
        }
        Insert: {
          birth_date: string
          created_at?: string | null
          email: string
          gender: string
          id?: never
          name: string
          surname: string
          user_id: string
          username: string
        }
        Update: {
          birth_date?: string
          created_at?: string | null
          email?: string
          gender?: string
          id?: never
          name?: string
          surname?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      PatientNotifications: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          patient_id: number | null
          subject: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          patient_id?: number | null
          subject: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          patient_id?: number | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "PatientNotifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "Patient"
            referencedColumns: ["id"]
          },
        ]
      }
      PatientSession: {
        Row: {
          assigned_date: string
          completed_date: string | null
          created_at: string | null
          id: number
          patient_id: number
          post_evaluation: number | null
          pre_evaluation: number | null
          resume_at: number | null
          session_id: number
          state: string
        }
        Insert: {
          assigned_date: string
          completed_date?: string | null
          created_at?: string | null
          id?: never
          patient_id: number
          post_evaluation?: number | null
          pre_evaluation?: number | null
          resume_at?: number | null
          session_id: number
          state: string
        }
        Update: {
          assigned_date?: string
          completed_date?: string | null
          created_at?: string | null
          id?: never
          patient_id?: number
          post_evaluation?: number | null
          pre_evaluation?: number | null
          resume_at?: number | null
          session_id?: number
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "PatientSession_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "Patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PatientSession_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["id"]
          },
        ]
      }
      Question: {
        Row: {
          id: number
        }
        Insert: {
          id: number
        }
        Update: {
          id?: number
        }
        Relationships: []
      }
      SecurityLogs: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      Session: {
        Row: {
          created_at: string | null
          day_offset: number
          duration: number | null
          id: number
          number: number
          source: string | null
        }
        Insert: {
          created_at?: string | null
          day_offset: number
          duration?: number | null
          id?: never
          number: number
          source?: string | null
        }
        Update: {
          created_at?: string | null
          day_offset?: number
          duration?: number | null
          id?: never
          number?: number
          source?: string | null
        }
        Relationships: []
      }
      Survey: {
        Row: {
          completed_date: string
          evaluation: number
          id: number
          patient_id: number
          question_id: number
        }
        Insert: {
          completed_date: string
          evaluation: number
          id?: never
          patient_id: number
          question_id: number
        }
        Update: {
          completed_date?: string
          evaluation?: number
          id?: never
          patient_id?: number
          question_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "Survey_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "Patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Survey_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "Question"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_professional: { Args: never; Returns: boolean }
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
