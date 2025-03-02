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
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          full_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          deadline: string | null
          category: string | null
          status: string
          created_at: string
          updated_at: string
          completion_percentage: number
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          deadline?: string | null
          category?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          completion_percentage?: number
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          deadline?: string | null
          category?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          completion_percentage?: number
        }
      }
      milestones: {
        Row: {
          id: string
          goal_id: string
          title: string
          description: string | null
          due_date: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          title: string
          description?: string | null
          due_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      vision_board_items: {
        Row: {
          id: string
          user_id: string
          image_url: string
          caption: string | null
          position_x: number
          position_y: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          caption?: string | null
          position_x: number
          position_y: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          caption?: string | null
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
        }
      }
      daily_quotes: {
        Row: {
          id: string
          user_id: string
          quote_text: string
          author: string | null
          generated_at: string
          shared_count: number
        }
        Insert: {
          id?: string
          user_id: string
          quote_text: string
          author?: string | null
          generated_at?: string
          shared_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          quote_text?: string
          author?: string | null
          generated_at?: string
          shared_count?: number
        }
      }
      chat_history: {
        Row: {
          id: string
          user_id: string
          message: string
          role: string
          created_at: string
          goal_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          role: string
          created_at?: string
          goal_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          role?: string
          created_at?: string
          goal_id?: string | null
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