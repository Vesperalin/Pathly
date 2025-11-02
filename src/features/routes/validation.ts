import { z } from "zod";

/**
 * Validation schema for GET /api/routes query parameters.
 * Enforces rules for pagination, filtering, and sorting.
 */
export const GetRoutesQuerySchema = z.object({
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
    .union([z.enum(["name", "route_date"]), z.null(), z.undefined()])
    .optional()
    .default("route_date")
    .transform((val) => (val === null || val === undefined ? "route_date" : val))
    .describe("Field to sort results by"),

  order: z
    .union([z.enum(["asc", "desc"]), z.null(), z.undefined()])
    .optional()
    .default("desc")
    .transform((val) => (val === null || val === undefined ? "desc" : val))
    .describe("Sort order direction"),

  search: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((val) => (val === null || val === undefined ? undefined : val))
    .describe("Search term to filter routes by name"),
});

export type GetRoutesQuery = z.infer<typeof GetRoutesQuerySchema>;

/**
 * Validation schema for route ID parameter.
 * Ensures the routeId is a valid UUID format.
 */
export const RouteIdParamSchema = z.object({
  routeId: z.string().uuid("Route ID must be a valid UUID"),
});

export type RouteIdParam = z.infer<typeof RouteIdParamSchema>;

/**
 * Validation schema for PATCH /api/routes/{routeId} request body.
 * All fields are optional, allowing partial updates.
 * Validates data types and formats for route updates.
 */
export const UpdateRouteCommandSchema = z
  .object({
    name: z.string().min(1, "Route name cannot be empty").optional(),
    route_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Route date must be in YYYY-MM-DD format")
      .optional(),
    got_points: z.number().min(0, "GOT points must be a non-negative number").nullable().optional(),
    notes: z.string().nullable().optional(),
    mountain_group_ids: z.array(z.string().uuid("Each mountain group ID must be a valid UUID")).optional(),
    catalog_ids: z.array(z.string().uuid("Each catalog ID must be a valid UUID")).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateRouteCommandValidated = z.infer<typeof UpdateRouteCommandSchema>;

/**
 * Validation schema for creating a new route.
 * Enforces all validation rules for route creation.
 */
export const CreateRouteCommandSchema = z.object({
  name: z.string().min(1, "Route name is required").max(255, "Route name must not exceed 255 characters"),
  route_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Route date must be in YYYY-MM-DD format"),
  distance: z.number().min(0, "Distance must be a non-negative number"),
  total_ascent: z.number().min(0, "Total ascent must be a non-negative number"),
  total_descent: z.number().min(0, "Total descent must be a non-negative number"),
  duration: z.number().int().min(0, "Duration must be a non-negative integer"),
  got_points: z.number().min(0, "GOT points must be a non-negative number").optional(),
  notes: z.string().optional(),
  mountain_group_ids: z.array(z.string().uuid("Each mountain group ID must be a valid UUID")).optional(),
  catalog_ids: z.array(z.string().uuid("Each catalog ID must be a valid UUID")).optional(),
});

export type CreateRouteCommand = z.infer<typeof CreateRouteCommandSchema>;
