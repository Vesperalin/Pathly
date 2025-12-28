# API Endpoint Implementation Plan: DELETE /api/routes/{routeId}

## 1. Endpoint Overview

This document outlines the implementation plan for the `DELETE /api/routes/{routeId}` endpoint. Its purpose is to allow an authenticated user to permanently delete one of their own routes from the database. The operation is idempotent; deleting a non-existent route or a route that has already been deleted will not result in an error, but rather the appropriate status code indicating the resource is not found.

## 2. Request Details

- **HTTP Method**: `DELETE`
- **URL Structure**: `/api/routes/[routeId]`
- **Parameters**:
  - **Required**: `routeId` (UUID string) - A path parameter specifying the unique identifier of the route to be deleted.
- **Request Body**: None.

## 3. Used Types

No DTOs or Command Models are required for this endpoint.

## 4. Response Details

- **Success**:
  - `204 No Content`: Returned when the route is successfully found and deleted.
- **Error**:
  - `400 Bad Request`: The provided `routeId` is not in a valid UUID format.
  - `401 Unauthorized`: The request was made without a valid user session.
  - `403 Forbidden`: The user is authenticated but does not have permission to delete the specified route (i.e., they are not the owner).
  - `404 Not Found`: No route exists with the specified `routeId`.
  - `500 Internal Server Error`: An unexpected error occurred on the server.

The error response body will be a JSON object:

```json
{
  "error": "Descriptive error message"
}
```

## 5. Data Flow

1.  A `DELETE` request is sent to `/api/routes/{routeId}`.
2.  The Next.js Route Handler at `src/app/api/routes/[routeId]/route.ts` is triggered.
3.  A Supabase server client is created.
4.  The handler retrieves the current user's session. If no session exists, it returns a `401` response.
5.  The `routeId` from the URL path is validated using a Zod schema to ensure it is a valid UUID. If validation fails, it returns a `400` response.
6.  The handler queries the `pathly.routes` table to select the route where `id` matches the provided `routeId`.
7.  **Existence Check**: If the query returns no result, the route does not exist, and the handler returns a `404` response.
8.  **Authorization Check**: If the route is found, the handler compares the `user_id` of the route with the ID of the authenticated user. If they do not match, the user is not the owner, and the handler returns a `403` response.
9.  **Deletion**: If the user is authorized, the handler executes a `DELETE` operation on the `pathly.routes` table for the given `routeId`. The `ON DELETE CASCADE` constraints on related tables (`route_catalogs`, `route_mountain_groups`) will handle the cleanup of associated records.
10. If the deletion is successful, the handler returns a `204 No Content` response.
11. If any database operation fails unexpectedly, the error is caught, logged, and a `500` response is returned.

## 6. Security Considerations

- **Authentication**: The route handler will use `createClient` from `@/lib/supabase/server` to ensure that a valid user session is present before proceeding.
- **Authorization**: Ownership will be strictly enforced by comparing the `user_id` on the `routes` table with the session user's ID. This server-side check prevents unauthorized data modification and is the primary line of defense, supplemented by database-level Row Level Security (RLS) policies.
- **Input Validation**: The `routeId` parameter will be validated as a UUID to prevent invalid data from being processed, protecting against potential query errors or injection attacks.

## 7. Performance Considerations

- The primary database operations (SELECT and DELETE) will use the `id` column, which is the primary key and therefore indexed. This ensures that the queries will be highly performant.
- Cascading deletes on related tables (`route_catalogs`, `route_mountain_groups`) are also efficient as they operate on foreign keys which should be indexed.

## 8. Implementation Steps

1.  **Create File**: Create a new file at `src/app/api/routes/[routeId]/route.ts`.
2.  **Implement DELETE Handler**: Define an async `DELETE` function that accepts `Request` and a context object `{ params: { routeId: string } }`.
3.  **Add Imports**: Import `NextResponse`, `createClient` from `@/lib/supabase/server`, and `zod`.
4.  **Create Validator**: Define a Zod schema to validate that `params.routeId` is a string in UUID format.
5.  **Instantiate Supabase Client**: Inside the handler, call `createClient()` to get a Supabase instance.
6.  **Check Authentication**: Retrieve the user from the Supabase client. If no user is found, return a `401 Unauthorized` response.
7.  **Validate Input**: Use the Zod schema to parse `params.routeId`. If it fails, return a `400 Bad Request` response.
8.  **Fetch Route for Verification**:
    - Perform a `SELECT` query on the `routes` table to fetch the route by its `id`.
    - Select only the `user_id` column for efficiency.
9.  **Handle Not Found**: If the query returns no data, return a `404 Not Found` response.
10. **Verify Ownership**: Compare the fetched `user_id` with the authenticated user's ID. If they don't match, return a `403 Forbidden` response.
11. **Execute Deletion**:
    - Perform a `DELETE` query on the `routes` table where `id` matches `routeId`.
    - Check the result for errors.
12. **Handle Server Errors**: Wrap the database logic in a `try...catch` block. In the `catch` block, log the error and return a `500 Internal Server Error` response.
13. **Return Success Response**: If the deletion is successful, return `NextResponse.json(null, { status: 204 })`.
