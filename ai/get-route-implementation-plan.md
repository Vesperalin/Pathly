# API Endpoint Implementation Plan: GET /api/routes/{routeId}

## 1. Endpoint Overview

This document outlines the implementation plan for the `GET /api/routes/{routeId}` endpoint. Its purpose is to retrieve the detailed information of a single route owned by the authenticated user, including its associated mountain groups and catalogs.

## 2. Request Details

- **HTTP Method**: `GET`
- **URL Structure**: `/api/routes/[routeId]`
- **Parameters**:
  - **Required**: `routeId` (URL path parameter) - The unique identifier (UUID) of the route.
- **Request Body**: None.

## 3. Used Types

The endpoint will utilize the following pre-defined type for its response payload:

- **`RouteDetailsDto`** from `src/types.ts`: This type defines the structure of the returned route object.

  ```typescript
  export type RouteDetailsDto = Omit<Route, "user_id"> & {
    mountain_groups: Pick<MountainGroup, "id" | "name">[];
    catalogs: Pick<Catalog, "id" | "name">[];
  };
  ```

## 4. Response Details

- **Success (200 OK)**: Returns the `RouteDetailsDto` object.
  ```json
  {
    "id": "uuid",
    "name": "string",
    "route_date": "date",
    "got_points": "number",
    "distance": "number",
    "total_ascent": "number",
    "total_descent": "number",
    "duration": "number",
    "notes": "string",
    "created_at": "timestamptz",
    "updated_at": "timestamptz",
    "mountain_groups": [{ "id": "uuid", "name": "string" }],
    "catalogs": [{ "id": "uuid", "name": "string" }]
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: If `routeId` is not a valid UUID.
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If the route does not exist or does not belong to the user.
  - `500 Internal Server Error`: For unexpected server-side issues.

## 5. Data Flow

1.  The client sends a `GET` request to `/api/routes/{routeId}`.
2.  The Next.js Route Handler at `src/app/api/routes/[routeId]/route.ts` receives the request.
3.  The `routeId` from the URL is extracted and validated using a Zod schema to ensure it is a valid UUID. If not, a `400` error is returned.
4.  A Supabase server client is created using `createClient` from `@/lib/supabase/server`.
5.  The handler attempts to fetch the current user's session data. If no user is found, a `401` error is returned.
6.  A single database query is executed using the Supabase client to fetch the route. The query will:
    - Select all required fields from the `routes` table.
    - Perform joins to retrieve the related `name` and `id` from the `mountain_groups` and `catalogs` tables.
    - Include a `WHERE` clause to filter by both `routes.id` (matching `routeId`) and `routes.user_id` (matching the authenticated user's ID).
7.  If the query returns no data, it means the route either doesn't exist or doesn't belong to the user. In this case, a `404` error is returned.
8.  If the query is successful, the fetched data is mapped to the `RouteDetailsDto` structure.
9.  The `RouteDetailsDto` object is sent back to the client in a JSON response with a `200 OK` status.

## 6. Security Considerations

- **Authentication**: The endpoint will be protected. A check for an active user session will be the first step after input validation.
- **Authorization**: To prevent Insecure Direct Object Reference (IDOR) vulnerabilities, the core database query **must** include a `WHERE` condition that matches the `user_id` from the authenticated session. This ensures users can only access their own data. This will be complemented by enabling Row Level Security (RLS) on the `routes` table in Supabase.
- **Input Validation**: The `routeId` parameter will be strictly validated as a UUID to prevent malformed queries and potential injection vectors.

## 7. Performance Considerations

- **Database Query**: A single, efficient query will be used to fetch the route and its related data simultaneously, avoiding the N+1 problem. Supabase's nested select syntax (`routes(*, mountain_groups(*), catalogs(*))`) is ideal for this.
- **Indexing**: The query relies on the primary key (`id`) of the `routes` table and the foreign key (`user_id`), both of which are indexed by default, ensuring fast lookups.

## 8. Implementation Steps

1.  **File Creation**: Create a new route handler file at `src/app/api/routes/[routeId]/route.ts`.
2.  **Define Handler**: Implement an async `GET` function that accepts `Request` and a `params` object (`{ params: { routeId: string } }`).
3.  **Input Validation**:
    - Create a Zod schema: `const schema = z.object({ routeId: z.string().uuid() });`.
    - Parse and validate `params` using the schema. Return a `400` error in a `try-catch` block if validation fails.
4.  **Authentication**:
    - Create a Supabase server client instance.
    - Fetch the current user. If `user` is null, return a `401` response.
5.  **Data Fetching**:
    - Construct the Supabase query:
      ```javascript
      const { data: route, error } = await supabase
        .from("routes")
        .select(
          `
          *,
          mountain_groups (id, name),
          catalogs (id, name)
        `
        )
        .eq("id", routeId)
        .eq("user_id", user.id)
        .single();
      ```
    - The `.single()` method will handle the "not found" case by returning `null` data.
6.  **Error Handling**:
    - Check for a database `error` or if `route` is `null`. In either case, return a `404 Not Found` response. For other unexpected errors, return a `500` error and log the issue.
7.  **Response Formatting**:
    - Ensure the returned `route` object conforms to the `RouteDetailsDto` structure. The `user_id` should not be part of the final response payload.
    - Return the formatted data using `NextResponse.json(route, { status: 200 })`.
