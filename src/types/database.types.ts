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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string | null
          sort_order: number
          tier: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug?: string | null
          sort_order?: number
          tier?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string | null
          sort_order?: number
          tier?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_percent: number
          id: string
          status: string
          store_id: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_percent: number
          id?: string
          status?: string
          store_id: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_percent?: number
          id?: string
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_trips: {
        Row: {
          assigned_at: string | null
          completed_at: string | null
          created_at: string | null
          driver_id: string | null
          id: string
          order_id: string | null
          status: string | null
        }
        Insert: {
          assigned_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          driver_id?: string | null
          id?: string
          order_id?: string | null
          status?: string | null
        }
        Update: {
          assigned_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          driver_id?: string | null
          id?: string
          order_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_trips_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_profiles: {
        Row: {
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          id: string
          status: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          id: string
          status?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          id?: string
          status?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_sales: {
        Row: {
          created_at: string
          end_time: string
          flash_price_usd: number
          id: string
          items_sold: number | null
          product_id: string
          start_time: string
          stock_limit: number
        }
        Insert: {
          created_at?: string
          end_time: string
          flash_price_usd: number
          id?: string
          items_sold?: number | null
          product_id: string
          start_time: string
          stock_limit: number
        }
        Update: {
          created_at?: string
          end_time?: string
          flash_price_usd?: number
          id?: string
          items_sold?: number | null
          product_id?: string
          start_time?: string
          stock_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "flash_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_banners: {
        Row: {
          click_action_route: string | null
          created_at: string
          id: string
          is_active: boolean | null
          media_url: string
          sort_order: number | null
          title: string
        }
        Insert: {
          click_action_route?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          media_url: string
          sort_order?: number | null
          title: string
        }
        Update: {
          click_action_route?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          media_url?: string
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      macro_demographics: {
        Row: {
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          id: string
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      merchant_applications: {
        Row: {
          created_at: string
          date_of_birth: string
          fulfillment_type: string
          full_name: string
          id: string
          operational_city: string
          product_focus: string
          store_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date_of_birth: string
          fulfillment_type: string
          full_name: string
          id?: string
          operational_city: string
          product_focus: string
          store_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string
          fulfillment_type?: string
          full_name?: string
          id?: string
          operational_city?: string
          product_focus?: string
          store_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          commune: string | null
          customer_id: string | null
          delivery_address: string | null
          delivery_fee: number
          delivery_type: string
          discount_amount_usd: number
          id: string
          local_updated_at: string
          nearest_landmark: string | null
          order_status: string
          payment_reference: string | null
          points_redeemed: number
          product_id: string
          quantity: number
          shipping_address: string | null
          timestamp: string
          total_cdf: number
          total_usd: number
          vendor_id: string | null
        }
        Insert: {
          commune?: string | null
          customer_id?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          delivery_type?: string
          discount_amount_usd?: number
          id: string
          local_updated_at?: string
          nearest_landmark?: string | null
          order_status?: string
          payment_reference?: string | null
          points_redeemed?: number
          product_id: string
          quantity?: number
          shipping_address?: string | null
          timestamp: string
          total_cdf: number
          total_usd: number
          vendor_id?: string | null
        }
        Update: {
          commune?: string | null
          customer_id?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          delivery_type?: string
          discount_amount_usd?: number
          id?: string
          local_updated_at?: string
          nearest_landmark?: string | null
          order_status?: string
          payment_reference?: string | null
          points_redeemed?: number
          product_id?: string
          quantity?: number
          shipping_address?: string | null
          timestamp?: string
          total_cdf?: number
          total_usd?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_categories: {
        Row: {
          id: string
          macro_id: string
          name: string
          sort_order: number
        }
        Insert: {
          id: string
          macro_id: string
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          macro_id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "parent_categories_macro_id_fkey"
            columns: ["macro_id"]
            isOneToOne: false
            referencedRelation: "macro_demographics"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount_cdf: number
          amount_usd: number
          api_reference: string | null
          created_at: string | null
          currency: string
          customer_id: string
          failure_reason: string | null
          id: string
          order_ids: string[]
          phone_number: string
          provider: string
          provider_reference: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount_cdf?: number
          amount_usd?: number
          api_reference?: string | null
          created_at?: string | null
          currency?: string
          customer_id: string
          failure_reason?: string | null
          id?: string
          order_ids?: string[]
          phone_number: string
          provider?: string
          provider_reference?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount_cdf?: number
          amount_usd?: number
          api_reference?: string | null
          created_at?: string | null
          currency?: string
          customer_id?: string
          failure_reason?: string | null
          id?: string
          order_ids?: string[]
          phone_number?: string
          provider?: string
          provider_reference?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          airtel_number: string | null
          commission_rate: number
          exchange_rate: number
          id: number
          mobile_money_active: number
          mpesa_number: string | null
          orange_number: string | null
        }
        Insert: {
          airtel_number?: string | null
          commission_rate?: number
          exchange_rate?: number
          id: number
          mobile_money_active?: number
          mpesa_number?: string | null
          orange_number?: string | null
        }
        Update: {
          airtel_number?: string | null
          commission_rate?: number
          exchange_rate?: number
          id?: number
          mobile_money_active?: number
          mpesa_number?: string | null
          orange_number?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          colors_json: Json | null
          compare_at_price: number | null
          delivery_fee_cdf: number | null
          delivery_fee_usd: number | null
          delivery_time: string | null
          desc_en: string | null
          desc_fr: string | null
          desc_sw: string | null
          description: string | null
          has_free_return: number | null
          id: string
          images_urls: Json
          is_trending: boolean
          local_updated_at: string
          material_info: string | null
          price_cdf: number
          price_usd: number
          security_specs: string | null
          sizes_json: Json | null
          status: string
          stock_count: number
          target_gender: string | null
          title: string
          title_en: string | null
          title_fr: string | null
          title_sw: string | null
          vendor_id: string
        }
        Insert: {
          category?: string | null
          colors_json?: Json | null
          compare_at_price?: number | null
          delivery_fee_cdf?: number | null
          delivery_fee_usd?: number | null
          delivery_time?: string | null
          desc_en?: string | null
          desc_fr?: string | null
          desc_sw?: string | null
          description?: string | null
          has_free_return?: number | null
          id: string
          images_urls: Json
          is_trending?: boolean
          local_updated_at?: string
          material_info?: string | null
          price_cdf: number
          price_usd: number
          security_specs?: string | null
          sizes_json?: Json | null
          status?: string
          stock_count?: number
          target_gender?: string | null
          title: string
          title_en?: string | null
          title_fr?: string | null
          title_sw?: string | null
          vendor_id: string
        }
        Update: {
          category?: string | null
          colors_json?: Json | null
          compare_at_price?: number | null
          delivery_fee_cdf?: number | null
          delivery_fee_usd?: number | null
          delivery_time?: string | null
          desc_en?: string | null
          desc_fr?: string | null
          desc_sw?: string | null
          description?: string | null
          has_free_return?: number | null
          id?: string
          images_urls?: Json
          is_trending?: boolean
          local_updated_at?: string
          material_info?: string | null
          price_cdf?: number
          price_usd?: number
          security_specs?: string | null
          sizes_json?: Json | null
          status?: string
          stock_count?: number
          target_gender?: string | null
          title?: string
          title_en?: string | null
          title_fr?: string | null
          title_sw?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          product_id: string
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          product_id: string
          rating: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          product_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_ledger: {
        Row: {
          commission_cdf: number
          commission_usd: number
          created_at: string | null
          gross_cdf: number
          gross_usd: number
          id: string
          net_cdf: number
          net_usd: number
          order_id: string | null
          status: string | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          commission_cdf?: number
          commission_usd?: number
          created_at?: string | null
          gross_cdf?: number
          gross_usd?: number
          id?: string
          net_cdf?: number
          net_usd?: number
          order_id?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          commission_cdf?: number
          commission_usd?: number
          created_at?: string | null
          gross_cdf?: number
          gross_usd?: number
          id?: string
          net_cdf?: number
          net_usd?: number
          order_id?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlement_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_ledger_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      store_favorites: {
        Row: {
          created_at: string
          id: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_favorites_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      store_follows: {
        Row: {
          customer_id: string
          followed_at: string
          id: string
          vendor_id: string
        }
        Insert: {
          customer_id: string
          followed_at?: string
          id?: string
          vendor_id: string
        }
        Update: {
          customer_id?: string
          followed_at?: string
          id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_follows_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_follows_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          city: string | null
          created_at: string
          description: string | null
          id: string
          is_archived: boolean
          momo_enabled: boolean
          store_logo_url: string | null
          store_name: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          momo_enabled?: boolean
          store_logo_url?: string | null
          store_name: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          momo_enabled?: boolean
          store_logo_url?: string | null
          store_name?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          id: string
          image_url: string | null
          name: string
          parent_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          image_url?: string | null
          name: string
          parent_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          created_at: string | null
          id: string
          sender_id: string
          sender_role: string
          text: string
          thread_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          sender_id: string
          sender_role?: string
          text: string
          thread_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          sender_id?: string
          sender_role?: string
          text?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "ticket_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_threads: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_threads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_coupon_usages: {
        Row: {
          coupon_id: string
          id: string
          used_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          used_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_coupon_usages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          email: string | null
          full_name: string | null
          gender_preference: string | null
          id: string
          local_updated_at: string
          phone: string | null
          physical_address: string | null
          points_balance: number | null
          role: string
          saved_coupons_count: number | null
          status: string
        }
        Insert: {
          email?: string | null
          full_name?: string | null
          gender_preference?: string | null
          id: string
          local_updated_at?: string
          phone?: string | null
          physical_address?: string | null
          points_balance?: number | null
          role: string
          saved_coupons_count?: number | null
          status?: string
        }
        Update: {
          email?: string | null
          full_name?: string | null
          gender_preference?: string | null
          id?: string
          local_updated_at?: string
          phone?: string | null
          physical_address?: string | null
          points_balance?: number | null
          role?: string
          saved_coupons_count?: number | null
          status?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          city: string | null
          created_at: string
          description: string | null
          id: string
          store_logo_url: string | null
          store_name: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          description?: string | null
          id: string
          store_logo_url?: string | null
          store_name: string
        }
        Update: {
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          store_logo_url?: string | null
          store_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_store: { Args: { p_store_id: string }; Returns: undefined }
      get_user_role: { Args: { user_id: string }; Returns: string }
      is_product_owner: {
        Args: { p_product_id: string; p_user_id: string }
        Returns: boolean
      }
      rpc_delete_user_account: { Args: never; Returns: undefined }
      rpc_process_checkout: {
        Args: {
          p_customer_id: string
          p_delivery_address: Json
          p_items: Json
          p_payment_method?: string
          p_points_redeemed?: number
          p_promo_code?: string
        }
        Returns: Json
      }
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
