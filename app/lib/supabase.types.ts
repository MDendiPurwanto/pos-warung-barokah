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
      products: {
        Row: {
          id: string;
          name: string;
          price: number;
          stock: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          stock: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          stock?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          date: string;
          customer_name: string;
          total: number;
          items: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          customer_name: string;
          total: number;
          items: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          customer_name?: string;
          total?: number;
          items?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      update_product_stock: {
        Args: {
          product_id: string;
          quantity_change: number;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
