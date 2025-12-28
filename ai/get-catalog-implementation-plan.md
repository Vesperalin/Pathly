# API Endpoint Implementation Plan: GET /api/catalogs/{catalogId}

## 1. Endpoint Overview

This document outlines the implementation plan for the `GET /api/catalogs/{catalogId}` endpoint. Its purpose is to retrieve the detailed information of a single catalog, including a calculated total of GOT points from all its associated routes, and a paginated list of those routes. The endpoint is designed for authenticated users to access their own catalog data securely.

## 2. Request Details

- **HTTP Method**: `GET`
- **URL Structure**: `/api/catalogs/{catalogId}`
- **Parameters**:
  - **Path (Required)**:
    - `catalogId` (uuid): The unique identifier for the catalog.
  - **Query (Optional)**:
    - `routes_page` (number): Page number for the nested routes list. Defaults to `1`.
    - `routes_page_size` (number): Number of routes per page. Defaults to `10`.
    - `routes_sort_by` (string): Field to sort routes by. Allowed values: `name`, `route_date`. Defaults to `route_date`.
    - `routes_order` (string): Sort order for routes. Allowed values: `asc`, `desc`. Defaults to `desc`.

## 3. Used Types

The implementation will use the following existing DTOs from `src/types.ts`:

- **`CatalogDetailsDto`**: The main response object containing catalog details and the paginated routes.
- **`RouteInCatalogDto`**: The DTO for individual routes within the nested list.
- **`PaginatedResponse<T>`**: The generic wrapper for paginated data.

## 4. Response Details

- **Success (200 OK)**:
  - Returns a `CatalogDetailsDto` object.
  ```json
  {
    "id": "uuid",
    "name": "string",
    "is_predefined": "boolean",
    "total_points": "number",
    "created_at": "timestamptz",
    "updated_at": "timestamptz",
    "routes": {
      "data": [
        {
          "id": "uuid",
          "name": "string",
          "route_date": "date",
          "got_points": "number | null"
        }
      ],
      "pagination": {
        "page": 1,
        "page_size": 10,
        "total": 25
      }
    }
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: Invalid format for `catalogId` or query parameters.
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: The specified catalog does not exist or the user does not have permission to view it.
  - `500 Internal Server Error`: An unexpected error occurred on the server.

## 5. Data Flow

1.  The Next.js App Router directs the incoming `GET` request to the route handler at `src/app/api/catalogs/[catalogId]/route.ts`.
2.  The handler parses and validates the `catalogId` from the path and the optional query parameters (`routes_page`, `routes_page_size`, etc.) using a predefined Zod schema.
3.  A Supabase server client is created to interact with the database securely within the server-side context.
4.  Two parallel database queries will be executed:
    a. **Catalog Details & Total Points Query**: A query to the `pathly.catalogs` table to fetch the catalog's primary details (`id`, `name`, `created_at`, etc.). This query will include a subquery or a join with `pathly.route_catalogs` and `pathly.routes` to calculate the `SUM(got_points)` for all routes linked to this catalog. The query will be filtered by `id` and the authenticated `user_id` (handled by RLS).
    b. **Paginated Routes Query**: A second query to fetch the associated routes. This query will join `pathly.routes` and `pathly.route_catalogs`, filter by `catalog_id`, and apply pagination (`offset`/`limit`), sorting (`order by`), based on the validated query parameters. It will also query the `COUNT` of total associated routes for pagination metadata.
5.  If the catalog query returns no data, the handler will immediately respond with a `404 Not Found` error.
6.  The results from both queries are combined and mapped to the `CatalogDetailsDto` structure.
7.  The handler returns the `CatalogDetailsDto` object as a JSON payload with a `200 OK` status code.

## 6. Security Considerations

- **Authentication**: All requests will be authenticated via the Next.js middleware, which verifies the user's session using Supabase. The server client in the route handler will ensure an authenticated user context.
- **Authorization**: Row Level Security (RLS) policies must be enabled and enforced on the `pathly.catalogs`, `pathly.routes`, and `pathly.route_catalogs` tables. This is the primary mechanism to ensure users can only access their own data, preventing unauthorized data exposure.
- **Input Validation**: All incoming parameters (`catalogId` and query params) will be rigorously validated using Zod to prevent common vulnerabilities like injection attacks and ensure data integrity.

## 7. Performance Considerations

- **Database Indexing**: Ensure that indexes are present on foreign keys (`route_catalogs.catalog_id`, `route_catalogs.route_id`) and on columns used for filtering and sorting (`catalogs.user_id`, `routes.route_date`, `routes.name`) to optimize query performance.
- **Efficient Aggregation**: Calculating `total_points` directly in the database using `SUM()` is significantly more efficient than fetching all routes and summing them in the application layer.
- **Pagination**: The mandatory pagination for the nested routes list is critical to prevent performance degradation when a catalog contains a large number of routes.

## 8. Implementation Steps

1.  **File Creation**: Create the new route handler file at `src/app/api/catalogs/[catalogId]/route.ts`.
2.  **Validation Schema**: In the route handler file, define a Zod schema to validate the optional query parameters (`routes_page`, `routes_page_size`, `routes_sort_by`, `routes_order`).
3.  **Implement GET Handler**:
    - Define an async `GET` function that accepts `Request` and a context object containing the `catalogId` parameter.
    - Parse and validate `catalogId` (ensure it's a UUID) and the query parameters using the Zod schema. Return a `400 Bad Request` response if validation fails.
4.  **Supabase Client**: Instantiate the Supabase server client: `const supabase = createClient();`.
5.  **Fetch Catalog and Points**:
    - Construct and execute a Supabase query to fetch the catalog by `id`.
    - Use a `.rpc()` call to a PostgreSQL function or a complex query with a sub-select to calculate the sum of `got_points`.
    - Example approach:
      ```typescript
      const { data: catalog, error } = await supabase
        .from("catalogs")
        .select(
          `
          *,
          routes(got_points)
        `
        )
        .eq("id", catalogId)
        .single();
      // Post-process to sum points
      ```
    - If `catalog` is null, return a `404 Not Found` response.
6.  **Fetch Paginated Routes**:
    - Calculate `offset` and `limit` from the validated page and page size parameters.
    - Construct and execute a Supabase query to get the list of routes associated with the `catalogId`, applying the calculated `offset`, `limit`, and sorting options.
    - Execute a separate `count` query to get the total number of associated routes for the pagination object.
7.  **Assemble Response DTO**:
    - Map the fetched catalog data, the calculated total points, the list of routes, and pagination details into a single `CatalogDetailsDto` object.
8.  **Error Handling**: Wrap the database logic in a `try...catch` block to handle unexpected server errors and return a `500 Internal Server Error` response.
9.  **Return Success Response**: Return the assembled DTO with a `200 OK` status using `NextResponse.json()`.
