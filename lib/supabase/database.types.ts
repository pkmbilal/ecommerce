export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          description_en: string | null;
          id: string;
          is_active: boolean;
          name_ar: string | null;
          name_en: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description_en?: string | null;
          id?: string;
          is_active?: boolean;
          name_ar?: string | null;
          name_en: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          phone: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          phone: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      customer_addresses: {
        Row: {
          city_region: string;
          created_at: string;
          delivery_address: string;
          id: string;
          is_default: boolean;
          label: string;
          notes: string | null;
          phone: string;
          profile_id: string;
          recipient_name: string;
          updated_at: string;
        };
        Insert: {
          city_region: string;
          created_at?: string;
          delivery_address: string;
          id?: string;
          is_default?: boolean;
          label: string;
          notes?: string | null;
          phone: string;
          profile_id: string;
          recipient_name: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customer_addresses"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "customer_addresses_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      idempotency_keys: {
        Row: {
          created_at: string;
          key: string;
          locked_at: string;
          order_id: string | null;
          request_hash: string | null;
          scope: string;
        };
        Insert: {
          created_at?: string;
          key: string;
          locked_at?: string;
          order_id?: string | null;
          request_hash?: string | null;
          scope: string;
        };
        Update: Partial<Database["public"]["Tables"]["idempotency_keys"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_items: {
        Row: {
          is_low_stock: boolean;
          low_stock_threshold: number;
          product_id: string;
          reserved_quantity: number;
          stock_on_hand: number;
          updated_at: string;
        };
        Insert: {
          is_low_stock?: never;
          low_stock_threshold?: number;
          product_id: string;
          reserved_quantity?: number;
          stock_on_hand?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "inventory_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_movements: {
        Row: {
          created_at: string;
          id: string;
          movement_type: Database["public"]["Enums"]["inventory_movement_type"];
          order_id: string | null;
          product_id: string;
          quantity_delta: number;
          reason: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          movement_type: Database["public"]["Enums"]["inventory_movement_type"];
          order_id?: string | null;
          product_id: string;
          quantity_delta: number;
          reason: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_movements"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "inventory_movements_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          line_subtotal_halalas: number;
          order_id: string;
          product_id: string | null;
          product_sku: string;
          product_slug: string;
          product_title_en: string;
          quantity: number;
          unit_price_halalas: number;
          vat_rate_bps: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          line_subtotal_halalas: number;
          order_id: string;
          product_id?: string | null;
          product_sku: string;
          product_slug: string;
          product_title_en: string;
          quantity: number;
          unit_price_halalas: number;
          vat_rate_bps?: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          cancelled_at: string | null;
          city_region: string;
          created_at: string;
          currency_code: string;
          customer_id: string | null;
          customer_name: string;
          customer_phone: string;
          delivered_at: string | null;
          delivery_address: string;
          id: string;
          notes: string | null;
          payment_method: string;
          profile_id: string | null;
          public_order_id: string;
          shipping_halalas: number;
          status: Database["public"]["Enums"]["order_status"];
          subtotal_halalas: number;
          total_halalas: number;
          updated_at: string;
          vat_halalas: number;
        };
        Insert: {
          cancelled_at?: string | null;
          city_region: string;
          created_at?: string;
          currency_code?: string;
          customer_id?: string | null;
          customer_name: string;
          customer_phone: string;
          delivered_at?: string | null;
          delivery_address: string;
          id?: string;
          notes?: string | null;
          payment_method?: string;
          profile_id?: string | null;
          public_order_id?: string;
          shipping_halalas?: number;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal_halalas: number;
          total_halalas: number;
          updated_at?: string;
          vat_halalas?: number;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          alt_ar: string | null;
          alt_en: string;
          created_at: string;
          id: string;
          is_primary: boolean;
          position: number;
          product_id: string;
          url: string;
        };
        Insert: {
          alt_ar?: string | null;
          alt_en: string;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          position?: number;
          product_id: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_favorites: {
        Row: {
          created_at: string;
          product_id: string;
          profile_id: string;
        };
        Insert: {
          created_at?: string;
          product_id: string;
          profile_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_favorites"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_favorites_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_favorites_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          badge: string | null;
          category_id: string | null;
          compare_at_price_halalas: number | null;
          created_at: string;
          description_en: string | null;
          id: string;
          is_active: boolean;
          is_featured: boolean;
          price_halalas: number;
          rating: number;
          review_count: number;
          sku: string;
          slug: string;
          title_ar: string | null;
          title_en: string;
          updated_at: string;
          vat_rate_bps: number;
        };
        Insert: {
          badge?: string | null;
          category_id?: string | null;
          compare_at_price_halalas?: number | null;
          created_at?: string;
          description_en?: string | null;
          id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          price_halalas: number;
          rating?: number;
          review_count?: number;
          sku: string;
          slug: string;
          title_ar?: string | null;
          title_en: string;
          updated_at?: string;
          vat_rate_bps?: number;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      adjust_product_inventory: {
        Args: {
          product_id_input: string;
          target_stock_on_hand: number;
          reason_input: string;
        };
        Returns: Json;
      };
      place_cod_order: {
        Args: {
          payload: Json;
        };
        Returns: Json;
      };
      transition_cod_order_status: {
        Args: {
          order_id_input: string;
          next_status: Database["public"]["Enums"]["order_status"];
        };
        Returns: Json;
      };
    };
    Enums: {
      app_role: "customer" | "admin";
      inventory_movement_type:
        | "seed"
        | "reservation"
        | "release"
        | "adjustment"
        | "sale";
      order_status:
        | "pending_confirmation"
        | "confirmed"
        | "out_for_delivery"
        | "delivered"
        | "cancelled";
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Update"];

export type Enums<EnumName extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][EnumName];
