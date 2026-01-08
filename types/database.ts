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
      }
      club_books: {
        Row: {
          id: string
          club_id: string
          google_books_id: string
          title: string
          author: string | null
          cover_url: string | null
          picked_by: string | null
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
          picked_by?: string | null
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
          picked_by?: string | null
          start_date?: string | null
          deadline?: string | null
          created_at?: string
        }
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
      }
    }
  }
}
