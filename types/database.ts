export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          provider: string;
          provider_id: string | null;
          role: "customer" | "admin";
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          provider?: string;
          provider_id?: string | null;
          role?: "customer" | "admin";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          sub_brand: string;
          name: string;
          slug: string;
          category: string;
          hsn_code: string | null;
          image_urls: Json;
          is_active: boolean;
          is_featured: boolean | null;
          featured_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["products"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          discount_percent: number;
          stock: number;
          gst_percent: number;
          ean_code: string | null;
          shelf_life_days: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["product_variants"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["product_variants"]["Insert"]
        >;
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          order_status: string;
          total: number;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          address_id: string | null;
          created_at: string;
          id_search?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: string;
          order_status?: string;
          total: number;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          address_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          price_at_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity: number;
          price_at_order: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          variant_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          variant_id: string;
          quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          product_ids: string[];
          order_id: string | null;
          rating: number;
          comment: string | null;
          reviewer_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_ids?: string[];
          order_id?: string | null;
          rating: number;
          comment?: string | null;
          reviewer_name?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string | null;
          line1: string;
          city: string;
          state: string;
          pincode: string;
          phone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string | null;
          line1: string;
          city: string;
          state: string;
          pincode: string;
          phone: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
      };
    };
  };
}
