// Supabase 클라이언트 설정
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://piwftspnolcvpytaqaeq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpd2Z0c3Bub2xjdnB5dGFxYWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3ODQzODMsImV4cCI6MjA2MjM2MDM4M30.79_5Nbygmj-lWnsG4Gq9E8hMk1it2UDz6IZ0vK9eAfc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 데이터베이스 타입 정의
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          password: string;
          role: 'admin' | 'trainer' | 'staff' | 'user' | 'client';
          department?: string;
          status?: string;
          phone?: string;
          position?: string;
          permissions?: any;
          profile_image?: string;
          last_login?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          password: string;
          role: 'admin' | 'trainer' | 'staff' | 'user' | 'client';
          department?: string;
          status?: string;
          phone?: string;
          position?: string;
          permissions?: any;
          profile_image?: string;
          last_login?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          password?: string;
          role?: 'admin' | 'trainer' | 'staff' | 'user' | 'client';
          department?: string;
          status?: string;
          phone?: string;
          position?: string;
          permissions?: any;
          profile_image?: string;
          last_login?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description?: string;
          status: 'pending' | 'in_progress' | 'completed';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          category?: string;
          assigned_to?: string;
          created_by?: string;
          due_date?: string;
          start_time?: string;
          end_time?: string;
          tags?: any;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          status?: 'pending' | 'in_progress' | 'completed';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          category?: string;
          assigned_to?: string;
          created_by?: string;
          due_date?: string;
          start_time?: string;
          end_time?: string;
          tags?: any;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          status?: 'pending' | 'in_progress' | 'completed';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          category?: string;
          assigned_to?: string;
          created_by?: string;
          due_date?: string;
          start_time?: string;
          end_time?: string;
          tags?: any;
        };
      };
      daily_reports: {
        Row: {
          id: string;
          author_id?: string;
          author_name: string;
          date: string;
          tasks?: any;
          issues?: string;
          tomorrow?: string;
          images?: any;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          author_id?: string;
          author_name: string;
          date: string;
          tasks?: any;
          issues?: string;
          tomorrow?: string;
          images?: any;
        };
        Update: {
          id?: string;
          author_id?: string;
          author_name?: string;
          date?: string;
          tasks?: any;
          issues?: string;
          tomorrow?: string;
          images?: any;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          author_id?: string;
          author_name: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          tags?: any;
          expiry_date?: string;
          is_pinned?: boolean;
          is_active?: boolean;
          target_roles?: any;
          read_by?: any;
          attachments?: any;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          author_id?: string;
          author_name: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          tags?: any;
          expiry_date?: string;
          is_pinned?: boolean;
          is_active?: boolean;
          target_roles?: any;
          read_by?: any;
          attachments?: any;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          author_id?: string;
          author_name?: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          tags?: any;
          expiry_date?: string;
          is_pinned?: boolean;
          is_active?: boolean;
          target_roles?: any;
          read_by?: any;
          attachments?: any;
        };
      };
      manuals: {
        Row: {
          id: string;
          title: string;
          content: string;
          category?: string;
          tags?: any;
          author_id?: string;
          author_name: string;
          view_count?: number;
          is_published?: boolean;
          version?: number;
          last_edited_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          category?: string;
          tags?: any;
          author_id?: string;
          author_name: string;
          view_count?: number;
          is_published?: boolean;
          version?: number;
          last_edited_by?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          category?: string;
          tags?: any;
          author_id?: string;
          author_name?: string;
          view_count?: number;
          is_published?: boolean;
          version?: number;
          last_edited_by?: string;
        };
      };
      sales_entries: {
        Row: {
          id: string;
          date: string;
          author_id?: string;
          author_name: string;
          revenue?: number;
          membership_sales?: number;
          pt_sales?: number;
          supply_sales?: number;
          vending_sales?: number;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          date: string;
          author_id?: string;
          author_name: string;
          revenue?: number;
          membership_sales?: number;
          pt_sales?: number;
          supply_sales?: number;
          vending_sales?: number;
          notes?: string;
        };
        Update: {
          id?: string;
          date?: string;
          author_id?: string;
          author_name?: string;
          revenue?: number;
          membership_sales?: number;
          pt_sales?: number;
          supply_sales?: number;
          vending_sales?: number;
          notes?: string;
        };
      };
      schedules: {
        Row: {
          id: string;
          client_name: string;
          client_id?: string;
          trainer_id: string;
          trainer_name: string;
          type: 'PT' | 'OT' | 'GROUP' | 'CONSULT';
          date: string;
          start_time: string;
          end_time: string;
          notes?: string;
          recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
          recurrence_end_date?: string;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          client_name: string;
          client_id?: string;
          trainer_id: string;
          trainer_name: string;
          type: 'PT' | 'OT' | 'GROUP' | 'CONSULT';
          date: string;
          start_time: string;
          end_time: string;
          notes?: string;
          recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
          recurrence_end_date?: string;
          is_completed?: boolean;
        };
        Update: {
          id?: string;
          client_name?: string;
          client_id?: string;
          trainer_id?: string;
          trainer_name?: string;
          type?: 'PT' | 'OT' | 'GROUP' | 'CONSULT';
          date?: string;
          start_time?: string;
          end_time?: string;
          notes?: string;
          recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
          recurrence_end_date?: string;
          is_completed?: boolean;
        };
      };
      reports: {
        Row: {
          id: string;
          title: string;
          content: string;
          type: 'daily' | 'weekly' | 'monthly' | 'performance' | 'incident' | 'custom';
          category: 'trainer' | 'facility' | 'client' | 'financial' | 'operational';
          status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';
          created_by: string;
          created_by_name: string;
          assigned_to?: string;
          assigned_to_name?: string;
          submitted_at?: string;
          reviewed_at?: string;
          reviewed_by?: string;
          reviewed_by_name?: string;
          metrics?: any;
          period_start?: string;
          period_end?: string;
          tags?: any;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          type: 'daily' | 'weekly' | 'monthly' | 'performance' | 'incident' | 'custom';
          category: 'trainer' | 'facility' | 'client' | 'financial' | 'operational';
          status?: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';
          created_by: string;
          created_by_name: string;
          assigned_to?: string;
          assigned_to_name?: string;
          submitted_at?: string;
          reviewed_at?: string;
          reviewed_by?: string;
          reviewed_by_name?: string;
          metrics?: any;
          period_start?: string;
          period_end?: string;
          tags?: any;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          type?: 'daily' | 'weekly' | 'monthly' | 'performance' | 'incident' | 'custom';
          category?: 'trainer' | 'facility' | 'client' | 'financial' | 'operational';
          status?: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';
          created_by?: string;
          created_by_name?: string;
          assigned_to?: string;
          assigned_to_name?: string;
          submitted_at?: string;
          reviewed_at?: string;
          reviewed_by?: string;
          reviewed_by_name?: string;
          metrics?: any;
          period_start?: string;
          period_end?: string;
          tags?: any;
        };
      };
      report_templates: {
        Row: {
          id: string;
          title: string;
          description: string;
          type: 'daily' | 'weekly' | 'monthly' | 'performance' | 'incident' | 'custom';
          category: 'trainer' | 'facility' | 'client' | 'financial' | 'operational';
          structure: any;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          type: 'daily' | 'weekly' | 'monthly' | 'performance' | 'incident' | 'custom';
          category: 'trainer' | 'facility' | 'client' | 'financial' | 'operational';
          structure: any;
          created_by: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          type?: 'daily' | 'weekly' | 'monthly' | 'performance' | 'incident' | 'custom';
          category?: 'trainer' | 'facility' | 'client' | 'financial' | 'operational';
          structure?: any;
          created_by?: string;
        };
      };
      report_comments: {
        Row: {
          id: string;
          report_id: string;
          content: string;
          created_by: string;
          created_by_name: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          content: string;
          created_by: string;
          created_by_name: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          content?: string;
          created_by?: string;
          created_by_name?: string;
        };
      };
      ot_members: {
        Row: {
          id: number;
          name: string;
          phone: string;
          email?: string;
          registered_at: string;
          status: 'pending' | 'assigned' | 'completed';
          preferred_days?: any;
          preferred_times?: any;
          notes?: string;
          ot_count: number;
          total_sessions?: number;
          assigned_staff_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: number;
          name: string;
          phone: string;
          email?: string;
          registered_at?: string;
          status?: 'pending' | 'assigned' | 'completed';
          preferred_days?: any;
          preferred_times?: any;
          notes?: string;
          ot_count: number;
          total_sessions?: number;
          assigned_staff_id?: string;
        };
        Update: {
          id?: number;
          name?: string;
          phone?: string;
          email?: string;
          registered_at?: string;
          status?: 'pending' | 'assigned' | 'completed';
          preferred_days?: any;
          preferred_times?: any;
          notes?: string;
          ot_count?: number;
          total_sessions?: number;
          assigned_staff_id?: string;
        };
      };
      ot_progress: {
        Row: {
          id: string;
          member_id: number;
          staff_id: number;
          total_sessions: number;
          completed_sessions: number;
          contact_made: boolean;
          contact_date?: string;
          contact_notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          member_id: number;
          staff_id: number;
          total_sessions: number;
          completed_sessions?: number;
          contact_made?: boolean;
          contact_date?: string;
          contact_notes?: string;
        };
        Update: {
          id?: string;
          member_id?: number;
          staff_id?: number;
          total_sessions?: number;
          completed_sessions?: number;
          contact_made?: boolean;
          contact_date?: string;
          contact_notes?: string;
        };
      };
      ot_sessions: {
        Row: {
          id: string;
          progress_id: string;
          date: string;
          time: string;
          completed: boolean;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          progress_id: string;
          date: string;
          time: string;
          completed?: boolean;
          notes?: string;
        };
        Update: {
          id?: string;
          progress_id?: string;
          date?: string;
          time?: string;
          completed?: boolean;
          notes?: string;
        };
      };
      handovers: {
        Row: {
          id: string;
          content: string;
          date: string;
          author_id?: string;
          author_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          content: string;
          date: string;
          author_id?: string;
          author_name: string;
        };
        Update: {
          id?: string;
          content?: string;
          date?: string;
          author_id?: string;
          author_name?: string;
        };
      };
      vending_machines: {
        Row: {
          id: number;
          name: string;
          location: string;
          status: 'active' | 'maintenance' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: number;
          name: string;
          location: string;
          status?: 'active' | 'maintenance' | 'inactive';
        };
        Update: {
          id?: number;
          name?: string;
          location?: string;
          status?: 'active' | 'maintenance' | 'inactive';
        };
      };
      vending_products: {
        Row: {
          id: number;
          name: string;
          price: number;
          cost: number;
          category: string;
          barcode?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: number;
          name: string;
          price: number;
          cost: number;
          category: string;
          barcode?: string;
        };
        Update: {
          id?: number;
          name?: string;
          price?: number;
          cost?: number;
          category?: string;
          barcode?: string;
        };
      };
      vending_inventory: {
        Row: {
          id: number;
          vending_id: number;
          product_id: number;
          current_stock: number;
          max_capacity: number;
          min_threshold: number;
          last_restocked?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: number;
          vending_id: number;
          product_id: number;
          current_stock: number;
          max_capacity: number;
          min_threshold: number;
          last_restocked?: string;
        };
        Update: {
          id?: number;
          vending_id?: number;
          product_id?: number;
          current_stock?: number;
          max_capacity?: number;
          min_threshold?: number;
          last_restocked?: string;
        };
      };
      vending_sales: {
        Row: {
          id: number;
          vending_id: number;
          product_id: number;
          quantity: number;
          total_amount: number;
          payment_method: 'cash' | 'card';
          timestamp: string;
          created_at?: string;
        };
        Insert: {
          id?: number;
          vending_id: number;
          product_id: number;
          quantity: number;
          total_amount: number;
          payment_method: 'cash' | 'card';
          timestamp: string;
        };
        Update: {
          id?: number;
          vending_id?: number;
          product_id?: number;
          quantity?: number;
          total_amount?: number;
          payment_method?: 'cash' | 'card';
          timestamp?: string;
        };
      };
      vending_transactions: {
        Row: {
          id: number;
          vending_id: number;
          type: '입금' | '출금' | '매출' | '보충';
          amount: number;
          date: string;
          note: string;
          vending_name?: string;
          product_name?: string;
          quantity?: number;
          created_at?: string;
        };
        Insert: {
          id?: number;
          vending_id: number;
          type: '입금' | '출금' | '매출' | '보충';
          amount: number;
          date: string;
          note: string;
          vending_name?: string;
          product_name?: string;
          quantity?: number;
        };
        Update: {
          id?: number;
          vending_id?: number;
          type?: '입금' | '출금' | '매출' | '보충';
          amount?: number;
          date?: string;
          note?: string;
          vending_name?: string;
          product_name?: string;
          quantity?: number;
        };
      };
      suggestions: {
        Row: {
          id: string;
          title: string;
          content: string;
          category?: 'facility' | 'service' | 'program' | 'other';
          author_id?: string;
          author_name: string;
          status?: 'pending' | 'in_review' | 'approved' | 'rejected' | 'implemented';
          priority?: 'low' | 'medium' | 'high';
          admin_response?: string;
          admin_response_by?: string;
          admin_response_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          category?: 'facility' | 'service' | 'program' | 'other';
          author_id?: string;
          author_name: string;
          status?: 'pending' | 'in_review' | 'approved' | 'rejected' | 'implemented';
          priority?: 'low' | 'medium' | 'high';
          admin_response?: string;
          admin_response_by?: string;
          admin_response_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          category?: 'facility' | 'service' | 'program' | 'other';
          author_id?: string;
          author_name?: string;
          status?: 'pending' | 'in_review' | 'approved' | 'rejected' | 'implemented';
          priority?: 'low' | 'medium' | 'high';
          admin_response?: string;
          admin_response_by?: string;
          admin_response_at?: string;
        };
      };
      task_comments: {
        Row: {
          id: string;
          task_id?: string;
          author_id?: string;
          author_name: string;
          content: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          task_id?: string;
          author_id?: string;
          author_name: string;
          content: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          author_id?: string;
          author_name?: string;
          content?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type?: 'info' | 'warning' | 'success' | 'error';
          title: string;
          message: string;
          is_read?: boolean;
          link?: string;
          related_id?: string;
          related_type?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: 'info' | 'warning' | 'success' | 'error';
          title: string;
          message: string;
          is_read?: boolean;
          link?: string;
          related_id?: string;
          related_type?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'info' | 'warning' | 'success' | 'error';
          title?: string;
          message?: string;
          is_read?: boolean;
          link?: string;
          related_id?: string;
          related_type?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
} 