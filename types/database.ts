export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          username: string | null
          bio: string | null
          quote: string | null
          region: string | null
          mood: string | null
          mood_color: string | null
          mood_confidence: number | null
          last_mood_update: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          username?: string | null
          bio?: string | null
          quote?: string | null
          region?: string | null
          mood?: string | null
          mood_color?: string | null
          mood_confidence?: number | null
          last_mood_update?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string | null
          bio?: string | null
          quote?: string | null
          region?: string | null
          mood?: string | null
          mood_color?: string | null
          mood_confidence?: number | null
          last_mood_update?: string | null
        }
      }
      diary_entries: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          encrypted_content: string
          entry_date: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          encrypted_content: string
          entry_date?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          encrypted_content?: string
          entry_date?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          created_at: string
          encrypted_content: string
          read_at: string | null
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          created_at?: string
          encrypted_content: string
          read_at?: string | null
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          created_at?: string
          encrypted_content?: string
          read_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
