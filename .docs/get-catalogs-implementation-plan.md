# API Endpoint Implementation Plan: GET /api/catalogs

## 1. Endpoint Overview

This endpoint retrieves a paginated list of all catalogs associated with the authenticated user. It supports filtering by type (`predefined` or `user`), sorting by name or creation date, and pagination. A key feature is the real-time calculation of the total `got_points` for each catalog by summing points from all its associated routes.

## 2. Request Details

- **HTTP Method**: `GET`
- **URL Structure**: `/api/catalogs`
- **Query Parameters**:
  - **Optional**:
    - `type: 'predefined' | 'user'`: Filters catalogs by their type.
    - `page: number`: The page number for pagination. Defaults to `1`.
    - `page_size: number`: The number of items per page. Defaults to `10`, max `100`.
    - `sort_by: 'name' | 'created_at'`: The field to sort the results by. Defaults to `name`.
    - `order: 'asc' | 'desc'`: The sorting order. Defaults to `asc`.

## 3. Used Types

The implementation will use the following DTOs defined in `src/types.ts`:

- `CatalogPreviewDto`: Represents a single catalog item in the response list.
- `PaginatedCatalogsDto`: Represents the entire response structure, including the data array and pagination metadata.

## 4. Response Details

- **Success (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "string",
        "is_predefined": "boolean",
        "total_points": "number",
        "created_at": "timestamptz",
        "updated_at": "timestamptz"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total": 15
    }
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: Invalid query parameters.
  - `401 Unauthorized`: User is not authenticated.
  - `500 Internal Server Error`: Unexpected server-side error.

## 5. Data Flow

1. The API route handler at `src/app/api/catalogs/route.ts` receives a `GET` request.
2. It parses the request's URL to extract query parameters.
3. The query parameters are validated against a Zod schema. If validation fails, a `400` error is returned.
4. A Supabase server client is created to identify the authenticated user. If no user is found, a `401` error is returned.
5. The handler calls a dedicated service function, `CatalogService.getCatalogs()`, passing the user's ID and validated query parameters.
6. The service layer constructs and executes a query using Supabase's `rpc()` method to call a custom PostgreSQL function (`get_user_catalogs`).
7. This database function efficiently fetches the user's catalogs, calculates the `total_points` by joining with routes, and applies the specified filtering, sorting, and pagination.
8. The service layer receives the data from the database and maps it to the `PaginatedCatalogsDto`.
9. The API route handler sends the DTO back to the client as a JSON response with a `200 OK` status.

## 6. Security Considerations

- **Authentication**: All requests will be authenticated using the Supabase client for server-side components. An error is returned if the user session is not found.
- **Authorization**: Data access is restricted by a PostgreSQL function that scopes queries to the `user_id` of the authenticated user, preventing users from accessing other users' data. This is the primary RLS enforcement mechanism for this query.
- **Input Validation**: All query parameters are strictly validated using Zod to prevent invalid inputs from affecting the database query and to protect against parameter tampering.
- **Pagination Limits**: `page_size` will be capped at a maximum of `100` to prevent performance degradation from overly large requests.

## 7. Performance Considerations

- **Point Calculation**: The `total_points` for each catalog will be calculated directly within the database using a `SUM` aggregation and `JOIN`s. This avoids the N+1 problem that would arise from fetching routes for each catalog separately in the application layer.
- **Database Function**: A custom PostgreSQL function will be created to encapsulate the complex query logic. This is more efficient than building the query with multiple steps in the application layer, as it reduces round-trips to the database.
- **Indexing**: The `catalogs` table should have indexes on `user_id`, `name`, and `created_at` to ensure efficient filtering and sorting. Foreign key indexes on relationship tables are also critical.

## 8. Implementation Steps

1.  **Database Migration**:
    - Create a new migration file in `supabase/migrations/`.
    - Define a new PostgreSQL function `get_user_catalogs(p_user_id uuid, ...)` that:
      - Accepts parameters for user ID, filtering, sorting, and pagination.
      - Joins `catalogs`, `route_catalogs`, and `routes` tables.
      - Groups by catalog ID to `SUM(routes.got_points)`.
      - Returns a `SETOF record` containing the paginated catalog list and a `total_count` for pagination metadata.

2.  **Validation Schema**:
    - Create `src/features/catalogs/validation.ts`.
    - Define a Zod schema `GetCatalogsQuerySchema` to validate the optional query parameters (`type`, `page`, `page_size`, `sort_by`, `order`).

3.  **Catalog Service**:
    - Create `src/features/catalogs/catalog.service.ts`.
    - Implement an async function `getCatalogs(supabase, userId, params)` which:
      - Takes the Supabase client instance, user ID, and validated query parameters as arguments.
      - Calls the `get_user_catalogs` PostgreSQL function via `supabase.rpc()`.
      - Handles the response from the RPC, maps the data to `CatalogPreviewDto`, and constructs the `PaginatedCatalogsDto` object.
      - Throws an error if the RPC call fails.

4.  **API Route Handler**:
    - Implement the `GET` function in `src/app/api/catalogs/route.ts`.
    - Use `createClient` from `@/lib/supabase/server`.
    - Authenticate the user; return `401` if not found.
    - Parse and validate query parameters using `GetCatalogsQuerySchema`; return `400` on failure.
    - Call the `getCatalogs` service function, wrapping it in a try-catch block to handle potential errors and return `500`.
    - On success, return the `PaginatedCatalogsDto` with a `200` status code.
