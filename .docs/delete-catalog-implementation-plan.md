# API Endpoint Implementation Plan: DELETE /api/catalogs/{catalogId}

## 1. Endpoint Overview

This document outlines the implementation plan for the `DELETE /api/catalogs/{catalogId}` API endpoint. The purpose of this endpoint is to allow an authenticated user to delete one of their own, non-predefined catalogs. This operation removes the catalog record and its associations but does not delete any routes that were part of the catalog.

## 2. Request Details

- **HTTP Method**: `DELETE`
- **URL Structure**: `/api/catalogs/{catalogId}`
- **Parameters**:
  - **Required**: `catalogId` (string, UUID format) - The unique identifier of the catalog to be deleted, passed as a URL path parameter.
- **Request Body**: None.

## 3. Used Types

No DTOs or Command Models are required for this endpoint, as it does not involve a request or response body. The `catalogId` parameter from the URL will be handled as a string.

## 4. Response Details

- **Success Response**:
  - **Code**: `204 No Content`
  - **Body**: Empty.
- **Error Responses**:
  - **Code**: `400 Bad Request` - If the `catalogId` is not a valid UUID.
  - **Code**: `401 Unauthorized` - If the user is not authenticated.
  - **Code**: `403 Forbidden` - If the user attempts to delete a catalog they do not own or a predefined catalog.
  - **Code**: `404 Not Found` - If no catalog with the specified `catalogId` exists.
  - **Code**: `500 Internal Server Error` - For unexpected server-side errors.

## 5. Data Flow

1.  The client sends a `DELETE` request to `/api/catalogs/{catalogId}`.
2.  The Next.js route handler at `src/app/api/catalogs/[catalogId]/route.ts` is triggered.
3.  The handler first validates that the `catalogId` parameter is a valid UUID. If not, it returns a `400` error.
4.  A Supabase server client is created.
5.  The handler attempts to retrieve the current user's session. If no session exists, it returns a `401` error.
6.  The handler queries the `pathly.catalogs` table to fetch the catalog with the matching `id`. The query does not need to include the `user_id` at this stage to differentiate between `404` and `403` errors.
7.  If the query returns no result, the handler responds with `404 Not Found`.
8.  If a catalog is found, the handler performs authorization checks:
    a. It verifies that the `catalog.user_id` matches the authenticated user's ID.
    b. It checks if `catalog.is_predefined` is `true`.
    c. If either check fails, the handler returns a `403 Forbidden` error.
9.  If all validations and authorization checks pass, the handler executes a `DELETE` statement on the `pathly.catalogs` table for the specified `id`.
10. Upon successful deletion, the handler returns a `204 No Content` response.

## 6. Security Considerations

- **Authentication**: The endpoint must be protected. The `createClient` function from `@/lib/supabase/server` will be used to ensure a valid user session exists.
- **Authorization**: It is critical to enforce that users can only delete their own catalogs. This will be implemented through an explicit check in the route handler (`catalog.user_id === user.id`). This application-level check will be the primary defense, backed by a restrictive Row Level Security (RLS) policy in Supabase.
- **Business Logic**: The implementation must strictly enforce the rule that predefined catalogs (`is_predefined = true`) cannot be deleted.

## 7. Performance Considerations

The operation involves indexed lookups (`SELECT` and `DELETE` on a primary key), so it is expected to be highly performant. There are no significant performance bottlenecks anticipated for this endpoint.

## 8. Implementation Steps

1.  **Create Route Handler File**: Create a new file at `src/app/api/catalogs/[catalogId]/route.ts`.
2.  **Define DELETE Handler**: Implement and export an async function named `DELETE` that accepts `request: NextRequest` and `{ params }: { params: { catalogId: string } }` as arguments.
3.  **Validate Input**:
    - Import `z` from `zod`.
    - Create a Zod schema `z.string().uuid()` to validate the `catalogId`.
    - Use `.safeParse()` to validate `params.catalogId`. If validation fails, return a `400 Bad Request` response with an appropriate error message.
4.  **Authenticate User**:
    - Create an instance of the Supabase server client.
    - Fetch the current user from the session. If the user is not found, return a `401 Unauthorized` response.
5.  **Fetch Catalog**:
    - Query the `catalogs` table using the validated `catalogId` to retrieve a single record.
    - Use a `try...catch` block to handle potential database errors, returning a `500` status code if an error occurs.
6.  **Handle Not Found**: If no catalog is returned from the query, respond with `440 Not Found`.
7.  **Authorize Action**:
    - Check if the `user.id` from the session matches the `user_id` of the fetched catalog.
    - Check if the `is_predefined` property of the catalog is `false`.
    - If either of these checks fails, respond with `403 Forbidden`.
8.  **Delete Catalog**:
    - If authorization succeeds, execute a delete operation on the `catalogs` table where the `id` matches `catalogId`.
    - Check for errors during the deletion process and return `500` if any occur.
9.  **Return Success Response**: On successful deletion, return a new `NextResponse` with a `204` status code and an empty body.
