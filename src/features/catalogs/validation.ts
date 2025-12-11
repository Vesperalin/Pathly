import { z } from "zod";

/**
 * Validation schema for GET /api/catalogs query parameters.
 * Enforces rules for pagination, filtering, and sorting.
 */
export const GetCatalogsQuerySchema = z.object({
  type: z
    .union([z.enum(["predefined", "user"]), z.null(), z.undefined()])
    .optional()
    .transform((val) => (val === null || val === undefined ? undefined : val))
    .describe("Filter catalogs by type"),

  page: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .default("1")
    .transform((val) => parseInt(val || "1", 10))
    .pipe(z.number().int().min(1))
    .describe("Page number for pagination, minimum 1"),

  page_size: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .default("10")
    .transform((val) => parseInt(val || "10", 10))
    .pipe(z.number().int().min(1).max(100))
    .describe("Items per page, between 1 and 100"),

  sort_by: z
    .union([z.enum(["name", "created_at"]), z.null(), z.undefined()])
    .optional()
    .default("name")
    .transform((val) => (val === null || val === undefined ? "name" : val))
    .describe("Field to sort results by"),

  order: z
    .union([z.enum(["asc", "desc"]), z.null(), z.undefined()])
    .optional()
    .default("asc")
    .transform((val) => (val === null || val === undefined ? "asc" : val))
    .describe("Sort order direction"),
});

export type GetCatalogsQuery = z.infer<typeof GetCatalogsQuerySchema>;

/**
 * Validation schema for GET /api/catalogs/{catalogId} query parameters.
 * Enforces rules for pagination and sorting of nested routes.
 */
export const GetCatalogDetailsQuerySchema = z.object({
  routes_page: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .default("1")
    .transform((val) => parseInt(val || "1", 10))
    .pipe(z.number().int().min(1))
    .describe("Page number for routes pagination, minimum 1"),

  routes_page_size: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .default("10")
    .transform((val) => parseInt(val || "10", 10))
    .pipe(z.number().int().min(1).max(100))
    .describe("Routes per page, between 1 and 100"),

  routes_sort_by: z
    .union([z.enum(["name", "route_date"]), z.null(), z.undefined()])
    .optional()
    .default("route_date")
    .transform((val) => (val === null || val === undefined ? "route_date" : val))
    .describe("Field to sort routes by"),

  routes_order: z
    .union([z.enum(["asc", "desc"]), z.null(), z.undefined()])
    .optional()
    .default("desc")
    .transform((val) => (val === null || val === undefined ? "desc" : val))
    .describe("Sort order for routes"),
});

export type GetCatalogDetailsQuery = z.infer<typeof GetCatalogDetailsQuerySchema>;

/**
 * Validation schema for GET /api/catalogs/{catalogId}/routes query parameters.
 * Mirrors the pagination behaviour for catalog routes.
 */
export const GetCatalogRoutesQuerySchema = z.object({
  page: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .default("1")
    .transform((val) => parseInt(val || "1", 10))
    .pipe(z.number().int().min(1)),
  page_size: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .default("10")
    .transform((val) => parseInt(val || "10", 10))
    .pipe(z.number().int().min(1).max(100)),
  sort_by: z
    .union([z.enum(["name", "route_date"]), z.null(), z.undefined()])
    .optional()
    .default("route_date")
    .transform((val) => (val === null || val === undefined ? "route_date" : val)),
  order: z
    .union([z.enum(["asc", "desc"]), z.null(), z.undefined()])
    .optional()
    .default("desc")
    .transform((val) => (val === null || val === undefined ? "desc" : val)),
});

export type GetCatalogRoutesQuery = z.infer<typeof GetCatalogRoutesQuerySchema>;

/**
 * Validation schema for creating a new catalog.
 * Ensures the name is a non-empty string with a maximum length of 255 characters.
 */
export const CreateCatalogCommandSchema = z.object({
  name: z.string().min(1, "Name is required.").max(255, "Name must not exceed 255 characters."),
});

export type CreateCatalogCommand = z.infer<typeof CreateCatalogCommandSchema>;

/**
 * Validation schema for updating a catalog's name.
 * Ensures the name is a non-empty string with a maximum length of 255 characters.
 */
export const UpdateCatalogCommandSchema = z.object({
  name: z.string().min(1, "Name is required.").max(255, "Name must not exceed 255 characters."),
});

export type UpdateCatalogCommand = z.infer<typeof UpdateCatalogCommandSchema>;

/**
 * Validation schema for catalog ID URL parameter.
 * Ensures the catalogId is a valid UUID format.
 */
export const CatalogIdParamSchema = z.object({
  catalogId: z.uuid("Invalid catalog ID."),
});

export type CatalogIdParam = z.infer<typeof CatalogIdParamSchema>;
