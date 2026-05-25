export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["admin_role"] | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          role?: Database["public"]["Enums"]["admin_role"] | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"] | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_avatar: string | null
          author_name: string | null
          author_role: string | null
          category: string | null
          content: string
          cover_image: string | null
          created_at: string | null
          excerpt: string | null
          featured: boolean | null
          featured_products: string[] | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          read_time: number | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_avatar?: string | null
          author_name?: string | null
          author_role?: string | null
          category?: string | null
          content: string
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured?: boolean | null
          featured_products?: string[] | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time?: number | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_avatar?: string | null
          author_name?: string | null
          author_role?: string | null
          category?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured?: boolean | null
          featured_products?: string[] | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time?: number | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string
          first_order_at: string | null
          id: string
          last_order_at: string | null
          name: string | null
          phone: string | null
          shipping_addresses: Json
          total_orders: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_order_at?: string | null
          id?: string
          last_order_at?: string | null
          name?: string | null
          phone?: string | null
          shipping_addresses?: Json
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_order_at?: string | null
          id?: string
          last_order_at?: string | null
          name?: string | null
          phone?: string | null
          shipping_addresses?: Json
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          items: Json
          order_source: string
          shipping_address: Json | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_session_id: string | null
          tags: Json
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json
          order_source?: string
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          tags?: Json
          total: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json
          order_source?: string
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          tags?: Json
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_cohorts: {
        Row: {
          cohort: string
          created_at: string
          created_by: string | null
          customer_id: string
        }
        Insert: {
          cohort: string
          created_at?: string
          created_by?: string | null
          customer_id: string
        }
        Update: {
          cohort?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_cohorts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: Database["public"]["Enums"]["product_category"]
          created_at: string | null
          description: string
          gender: Database["public"]["Enums"]["product_gender"] | null
          id: string
          image: string
          images: string[] | null
          in_stock: boolean | null
          is_active: boolean | null
          name: string
          price: number
          product_type: Database["public"]["Enums"]["product_type"]
          sale_price: number | null
          size: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          description: string
          gender?: Database["public"]["Enums"]["product_gender"] | null
          id?: string
          image: string
          images?: string[] | null
          in_stock?: boolean | null
          is_active?: boolean | null
          name: string
          price: number
          product_type: Database["public"]["Enums"]["product_type"]
          sale_price?: number | null
          size: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          description?: string
          gender?: Database["public"]["Enums"]["product_gender"] | null
          id?: string
          image?: string
          images?: string[] | null
          in_stock?: boolean | null
          is_active?: boolean | null
          name?: string
          price?: number
          product_type?: Database["public"]["Enums"]["product_type"]
          sale_price?: number | null
          size?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          contact_email: string
          contact_phone: string
          facebook_url: string
          free_shipping_threshold_cents: number
          id: number
          instagram_url: string
          returns_policy_summary: string
          seo_default_description: string
          seo_default_title: string
          shipping_policy_summary: string
          stripe_apple_pay_enabled: boolean
          stripe_google_pay_enabled: boolean
          stripe_payment_enabled: boolean
          updated_at: string
        }
        Insert: {
          contact_email?: string
          contact_phone?: string
          facebook_url?: string
          free_shipping_threshold_cents?: number
          id?: number
          instagram_url?: string
          returns_policy_summary?: string
          seo_default_description?: string
          seo_default_title?: string
          shipping_policy_summary?: string
          stripe_apple_pay_enabled?: boolean
          stripe_google_pay_enabled?: boolean
          stripe_payment_enabled?: boolean
          updated_at?: string
        }
        Update: {
          contact_email?: string
          contact_phone?: string
          facebook_url?: string
          free_shipping_threshold_cents?: number
          id?: number
          instagram_url?: string
          returns_policy_summary?: string
          seo_default_description?: string
          seo_default_title?: string
          shipping_policy_summary?: string
          stripe_apple_pay_enabled?: boolean
          stripe_google_pay_enabled?: boolean
          stripe_payment_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      gift_set_inventory: {
        Row: {
          id: string
          name: string
          stock_quantity: number
          price: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          stock_quantity?: number
          price: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          stock_quantity?: number
          price?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_visitors: {
        Row: {
          country: string | null
          created_at: string
          id: string
          ip_hash: string | null
          last_seen: string
          page: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          last_seen?: string
          page?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          last_seen?: string
          page?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      live_chat_sessions: {
        Row: {
          admin_id: string | null
          closed_at: string | null
          created_at: string
          id: string
          status: string
          updated_at: string
          visitor_id: string
          visitor_name: string | null
        }
        Insert: {
          admin_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          visitor_id: string
          visitor_name?: string | null
        }
        Update: {
          admin_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          visitor_id?: string
          visitor_name?: string | null
        }
        Relationships: []
      }
      live_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_type: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_type: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_type?: string
          session_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dashboard_metrics: {
        Args: {
          p_period?: string
        }
        Returns: Json
      }
      decrement_gift_set_stock: {
        Args: {
          p_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      admin_role: "admin" | "super_admin"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      product_category:
        | "men"
        | "women"
        | "niche"
        | "essence-oil"
        | "body-lotion"
        | "lattafa-original"
        | "al-haramain-originals"
        | "victorias-secret-originals"
      product_gender: "men" | "women" | "unisex"
      product_type: "perfume" | "essence-oil" | "body-lotion"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type Product = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];
export type AdminUser = Database['public']['Tables']['admin_users']['Row'];

export type ProductCategory = Database['public']['Enums']['product_category'];
export type ProductType = Database['public']['Enums']['product_type'];
export type ProductGender = Database['public']['Enums']['product_gender'];

export type ProductCategoryRow = Database['public']['Tables']['product_categories']['Row'];
export type ProductCategoryInsert = Database['public']['Tables']['product_categories']['Insert'];
export type ProductCategoryUpdate = Database['public']['Tables']['product_categories']['Update'];

export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderStatus = Database['public']['Enums']['order_status'];

export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type CustomerCohort = Database['public']['Tables']['customer_cohorts']['Row'];
export type StoreSettings = Database['public']['Tables']['store_settings']['Row'];

export type SiteVisitor = Database['public']['Tables']['site_visitors']['Row'];
export type LiveChatSession = Database['public']['Tables']['live_chat_sessions']['Row'];
export type LiveChatMessage = Database['public']['Tables']['live_chat_messages']['Row'];
