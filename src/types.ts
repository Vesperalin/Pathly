import type { Database } from "@/db/database.types";

// Base Entity Types
export type Profile = Database["pathly"]["Tables"]["profiles"]["Row"];
export type Catalog = Database["pathly"]["Tables"]["catalogs"]["Row"];
export type Route = Database["pathly"]["Tables"]["routes"]["Row"];
export type MountainGroup = Database["pathly"]["Tables"]["mountain_groups"]["Row"];

// Enums
export type Language = Database["pathly"]["Enums"]["language_enum"];
export type Theme = Database["pathly"]["Enums"]["theme_enum"];

// Generic API Types
export interface PaginationParams {
  page: number;
  page_size: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationParams;
}

// Profile DTOs and Commands
/**
 * DTO for a user's profile.
 * GET /api/profiles/me
 */
export type ProfileDto = Pick<Profile, "id" | "language" | "theme" | "created_at">;

/**
 * Command model for updating a user's profile.
 * PATCH /api/profiles/me
 */
export type UpdateProfileCommand = Partial<Pick<Profile, "language" | "theme">>;

// Catalog DTOs and Commands
/**
 * DTO for a catalog item in a list.
 * GET /api/catalogs
 */
export type CatalogPreviewDto = Pick<Catalog, "id" | "name" | "is_predefined" | "created_at" | "updated_at"> & {
  total_points: number;
};

/**
 * DTO for a paginated list of catalogs.
 * GET /api/catalogs
 */
export type PaginatedCatalogsDto = PaginatedResponse<CatalogPreviewDto>;

/**
 * DTO for a single catalog's details, including a paginated list of its routes.
 * GET /api/catalogs/{catalogId}
 */
export type CatalogDetailsDto = CatalogPreviewDto & {
  routes: PaginatedResponse<RouteInCatalogDto>;
};

/**
 * DTO for a route when nested inside a catalog's details.
 */
export type RouteInCatalogDto = Pick<Route, "id" | "name" | "route_date" | "got_points">;

/**
 * Command model for creating a new catalog.
 * POST /api/catalogs
 */
export type CreateCatalogCommand = Pick<Catalog, "name">;

/**
 * Command model for updating a catalog's name.
 * PATCH /api/catalogs/{catalogId}
 */
export type UpdateCatalogCommand = Pick<Catalog, "name">;

// Route DTOs and Commands
/**
 * DTO for a route item in a list.
 * GET /api/routes
 */
export type RoutePreviewDto = Pick<Route, "id" | "name" | "route_date" | "got_points" | "distance">;

/**
 * DTO for a paginated list of routes.
 * GET /api/routes
 */
export type PaginatedRoutesDto = PaginatedResponse<RoutePreviewDto>;

/**
 * DTO for the result of parsing a GPX file.
 * POST /api/routes/gpx-parse
 */
export type GpxParseResultDto = Pick<Route, "route_date" | "distance" | "total_ascent" | "total_descent" | "duration">;

/**
 * Command model for creating a new route.
 * POST /api/routes
 */
export type CreateRouteCommand = Pick<
  Route,
  "name" | "route_date" | "distance" | "total_ascent" | "total_descent" | "duration"
> &
  Partial<Pick<Route, "got_points" | "notes">> & {
    mountain_group_ids?: string[];
    catalog_ids?: string[];
  };

/**
 * DTO for a single route's details.
 * GET /api/routes/{routeId}
 */
export type RouteDetailsDto = Omit<Route, "user_id"> & {
  mountain_groups: Pick<MountainGroup, "id" | "name">[];
  catalogs: Pick<Catalog, "id" | "name">[];
};

/**
 * Command model for updating an existing route.
 * PATCH /api/routes/{routeId}
 */
export type UpdateRouteCommand = Partial<{
  name: string;
  route_date: string;
  got_points: number | null;
  notes: string | null;
  mountain_group_ids: string[];
  catalog_ids: string[];
}>;

// Mountain Group DTOs
/**
 * DTO for a mountain group item.
 * GET /api/mountain-groups
 */
export type MountainGroupDto = MountainGroup;
