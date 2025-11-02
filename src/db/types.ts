/**
 * RPC return type for get_user_catalogs function.
 * This interface matches the JSON structure returned by the PostgreSQL function.
 */
export interface GetUserCatalogsResult {
  id: string;
  name: string;
  is_predefined: boolean;
  total_points: number;
  created_at: string;
  updated_at: string;
  total_count: number;
}

/**
 * RPC return type for get_catalog_details function.
 * This interface matches the JSON structure returned by the PostgreSQL function.
 */
export interface CatalogDetailsRpcResult {
  id: string;
  name: string;
  is_predefined: boolean;
  total_points: number;
  created_at: string;
  updated_at: string;
  routes: {
    data: {
      id: string;
      name: string;
      route_date: string;
      got_points: number | null;
    }[];
    pagination: {
      page: number;
      page_size: number;
      total: number;
    };
  };
}

/**
 * RPC return type for create_route_with_associations function.
 * This interface matches the JSON structure returned by the PostgreSQL function.
 */
export interface CreateRouteWithAssociationsResult {
  id: string;
  name: string;
  route_date: string;
  distance: number;
  total_ascent: number;
  total_descent: number;
  duration: number;
  got_points: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  mountain_groups: {
    id: string;
    name: string;
  }[];
  catalogs: {
    id: string;
    name: string;
  }[];
}
