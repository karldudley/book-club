export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Views: Record<never, never>
    Functions: Record<never, never>
    CompositeTypes: Record<never, never>
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      clubs: {
        Row: {
          id: string
          name: string
          description: string | null
          admin_id: string
          invite_code: string
          rotation_rule: string
          schedule_weeks: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          admin_id: string
          invite_code: string
          rotation_rule?: string
          schedule_weeks?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          admin_id?: string
          invite_code?: string
          rotation_rule?: string
          schedule_weeks?: number
          created_at?: string
        }
        Relationships: []
      }
      club_members: {
        Row: {
          id: string
          club_id: string
          user_id: string
          joined_at: string
          turn_order: number | null
        }
        Insert: {
          id?: string
          club_id: string
          user_id: string
          joined_at?: string
          turn_order?: number | null
        }
        Update: {
          id?: string
          club_id?: string
          user_id?: string
          joined_at?: string
          turn_order?: number | null
        }
        Relationships: []
      }
      club_books: {
        Row: {
          id: string
          club_id: string
          google_books_id: string
          title: string
          author: string | null
          cover_url: string | null
          page_count: number | null
          picked_by: string | null
          status: 'suggested' | 'active' | 'completed'
          is_secret: boolean
          start_date: string | null
          deadline: string | null
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          google_books_id: string
          title: string
          author?: string | null
          cover_url?: string | null
          page_count?: number | null
          picked_by?: string | null
          status?: 'suggested' | 'active' | 'completed'
          is_secret?: boolean
          start_date?: string | null
          deadline?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          google_books_id?: string
          title?: string
          author?: string | null
          cover_url?: string | null
          page_count?: number | null
          picked_by?: string | null
          status?: 'suggested' | 'active' | 'completed'
          is_secret?: boolean
          start_date?: string | null
          deadline?: string | null
          created_at?: string
        }
        Relationships: []
      }
      club_events: {
        Row: {
          id: string
          club_id: string
          actor_id: string
          event_type: string
          book_id: string | null
          payload: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          actor_id: string
          event_type: string
          book_id?: string | null
          payload?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          actor_id?: string
          event_type?: string
          book_id?: string | null
          payload?: Record<string, unknown>
          created_at?: string
        }
        Relationships: []
      }
      book_ratings: {
        Row: {
          id: string
          book_id: string
          user_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          id?: string
          book_id: string
          user_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          user_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_book_progress: {
        Row: {
          id: string
          club_book_id: string
          user_id: string
          status: 'not_started' | 'reading' | 'completed'
          started_at: string | null
          completed_at: string | null
          rating: number | null
        }
        Insert: {
          id?: string
          club_book_id: string
          user_id: string
          status?: 'not_started' | 'reading' | 'completed'
          started_at?: string | null
          completed_at?: string | null
          rating?: number | null
        }
        Update: {
          id?: string
          club_book_id?: string
          user_id?: string
          status?: 'not_started' | 'reading' | 'completed'
          started_at?: string | null
          completed_at?: string | null
          rating?: number | null
        }
        Relationships: []
      }
    }
  }
}
