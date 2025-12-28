export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  pathly: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string;
          event_type: Database["pathly"]["Enums"]["analytics_event_type_enum"];
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: Database["pathly"]["Enums"]["analytics_event_type_enum"];
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: Database["pathly"]["Enums"]["analytics_event_type_enum"];
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      catalogs: {
        Row: {
          created_at: string;
          id: string;
          is_predefined: boolean;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_predefined?: boolean;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_predefined?: boolean;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      mountain_groups: {
        Row: {
          id: string;
          name: string;
          symbol: string;
        };
        Insert: {
          id?: string;
          name: string;
          symbol: string;
        };
        Update: {
          id?: string;
          name?: string;
          symbol?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          id: string;
          language: Database["pathly"]["Enums"]["language_enum"];
          theme: Database["pathly"]["Enums"]["theme_enum"];
        };
        Insert: {
          created_at?: string;
          id: string;
          language?: Database["pathly"]["Enums"]["language_enum"];
          theme?: Database["pathly"]["Enums"]["theme_enum"];
        };
        Update: {
          created_at?: string;
          id?: string;
          language?: Database["pathly"]["Enums"]["language_enum"];
          theme?: Database["pathly"]["Enums"]["theme_enum"];
        };
        Relationships: [];
      };
      route_catalogs: {
        Row: {
          catalog_id: string;
          created_at: string;
          route_id: string;
        };
        Insert: {
          catalog_id: string;
          created_at?: string;
          route_id: string;
        };
        Update: {
          catalog_id?: string;
          created_at?: string;
          route_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "route_catalogs_catalog_id_fkey";
            columns: ["catalog_id"];
            isOneToOne: false;
            referencedRelation: "catalogs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "route_catalogs_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
        ];
      };
      route_mountain_groups: {
        Row: {
          created_at: string;
          mountain_group_id: string;
          route_id: string;
        };
        Insert: {
          created_at?: string;
          mountain_group_id: string;
          route_id: string;
        };
        Update: {
          created_at?: string;
          mountain_group_id?: string;
          route_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "route_mountain_groups_mountain_group_id_fkey";
            columns: ["mountain_group_id"];
            isOneToOne: false;
            referencedRelation: "mountain_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "route_mountain_groups_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
        ];
      };
      routes: {
        Row: {
          created_at: string;
          distance: number;
          duration: number;
          got_points: number | null;
          id: string;
          name: string;
          notes: string | null;
          route_date: string;
          total_ascent: number;
          total_descent: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          distance: number;
          duration: number;
          got_points?: number | null;
          id?: string;
          name: string;
          notes?: string | null;
          route_date: string;
          total_ascent: number;
          total_descent: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          distance?: number;
          duration?: number;
          got_points?: number | null;
          id?: string;
          name?: string;
          notes?: string | null;
          route_date?: string;
          total_ascent?: number;
          total_descent?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      create_route_with_associations: {
        Args: {
          p_catalog_ids?: string[];
          p_distance: number;
          p_duration: number;
          p_got_points?: number;
          p_mountain_group_ids?: string[];
          p_name: string;
          p_notes?: string;
          p_route_date: string;
          p_total_ascent: number;
          p_total_descent: number;
          p_user_id: string;
        };
        Returns: Json;
      };
      get_catalog_details: {
        Args: {
          p_catalog_id: string;
          p_routes_order?: string;
          p_routes_page?: number;
          p_routes_page_size?: number;
          p_routes_sort_by?: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      get_user_catalogs: {
        Args: {
          p_order?: string;
          p_page?: number;
          p_page_size?: number;
          p_sort_by?: string;
          p_type?: string;
          p_user_id: string;
        };
        Returns: {
          created_at: string;
          id: string;
          is_predefined: boolean;
          name: string;
          total_count: number;
          total_points: number;
          updated_at: string;
        }[];
      };
      update_route_with_associations: {
        Args: {
          p_catalog_ids?: string[];
          p_got_points?: number;
          p_mountain_group_ids?: string[];
          p_name?: string;
          p_notes?: string;
          p_route_date?: string;
          p_route_id: string;
          p_update_catalog_ids?: boolean;
          p_update_got_points?: boolean;
          p_update_mountain_group_ids?: boolean;
          p_update_name?: boolean;
          p_update_notes?: boolean;
          p_update_route_date?: boolean;
          p_user_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      analytics_event_type_enum: "account_created" | "route_added" | "catalog_created" | "route_assigned_to_catalog";
      language_enum: "pl" | "en";
      theme_enum: "light" | "dark" | "system";
    };
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  pathly: {
    Enums: {
      analytics_event_type_enum: ["account_created", "route_added", "catalog_created", "route_assigned_to_catalog"],
      language_enum: ["pl", "en"],
      theme_enum: ["light", "dark", "system"],
    },
  },
  public: {
    Enums: {},
  },
} as const;
