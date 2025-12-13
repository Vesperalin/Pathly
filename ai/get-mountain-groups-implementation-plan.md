# API Endpoint Implementation Plan: GET /api/mountain-groups

## 1. Endpoint Overview

This document outlines the implementation plan for the `GET /api/mountain-groups` endpoint. The purpose of this endpoint is to provide clients with a complete list of all available mountain groups stored in the database. Access to this endpoint is restricted to authenticated users only.

## 2. Request Details

- **HTTP Method**: `GET`
- **URL Structure**: `/api/mountain-groups`
- **Parameters**:
  - **Required**: None
  - **Optional**: None
- **Request Body**: None

## 3. Used Types

- **`MountainGroupDto`**: This DTO represents a single mountain group in the response. It is defined in `src/types.ts` and aligns with the `pathly.mountain_groups` table structure.
  ```typescript
  export type MountainGroupDto = {
    id: string; // uuid
    name: string;
    symbol: string;
  };
  ```

## 4. Response Details

- **Success (200 OK)**:
  - **Content-Type**: `application/json`
  - **Body**: An array of `MountainGroupDto` objects.
  ```json
  [
    {
      "id": "c4e0baf7-0a81-4b36-9f17-1b07a27073b8",
      "name": "Tatra Mountains",
      "symbol": "TAT"
    },
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "name": "Beskidy Mountains",
      "symbol": "BES"
    }
  ]
  ```
- **Error**:
  - `401 Unauthorized`: Returned if the request is made by an unauthenticated user.
  - `500 Internal Server Error`: Returned if an unexpected error occurs on the server, such as a database query failure.

## 5. Data Flow

1. A `GET` request is sent by the client to the `/api/mountain-groups` endpoint.
2. The Next.js API route handler at `src/app/api/mountain-groups/route.ts` processes the request.
3. A server-side Supabase client is instantiated using `createClient` from `@/lib/supabase/server`.
4. The handler checks for an active user session. If no session is found, it immediately returns a `401 Unauthorized` response.
5. If the user is authenticated, the handler executes a `SELECT` query on the `pathly.mountain_groups` table to retrieve all records.
6. The query result is then returned to the client as a JSON array with a `200 OK` status.

## 6. Security Considerations

- **Authentication**: The endpoint is protected. The handler must verify the user's authentication status using the Supabase server client by checking for a valid session from the request cookies.
- **Authorization (RLS)**: The Row Level Security (RLS) policy on the `pathly.mountain_groups` table must be configured to allow `SELECT` operations for any user with the `authenticated` role.

## 7. Error Handling

- A `try...catch` block will wrap the logic within the `GET` handler to manage unexpected errors.
- **Authentication Failure**: If `supabase.auth.getUser()` does not return a valid user, a `NextResponse` with status `401` and a JSON body `{"error": "Unauthorized"}` will be returned.
- **Database Failure**: If the Supabase query fails, the error will be logged via `console.error`, and a `NextResponse` with status `500` and a JSON body `{"error": "Internal Server Error"}` will be returned.

## 8. Performance Considerations

- The `mountain_groups` table contains a relatively small and static dataset, so a direct database query is efficient and no significant performance bottlenecks are anticipated.
- Caching is not required for the initial implementation but can be considered in the future if data volume or traffic increases significantly. Next.js's built-in fetch caching or other server-side caching mechanisms could be employed.

## 9. Implementation Steps

1.  **Verify Database Schema**: Confirm that the `pathly.mountain_groups` table exists and includes the `id (uuid)`, `name (text)`, and `symbol (text)` columns.
2.  **Configure RLS Policy**: Create or verify an RLS policy that grants `SELECT` access on `pathly.mountain_groups` to the `authenticated` role.
3.  **Create API Route File**: Create the file `src/app/api/mountain-groups/route.ts`.
4.  **Implement GET Handler**:
    - Define an async `GET` function that accepts a `Request` object.
    - Inside the function, create an instance of the Supabase client using `createClient()`.
    - Fetch the current user. If no user is found, return a `401` response.
    - Execute the query: `supabase.from('mountain_groups').select('*')`.
    - Check the query response for errors. If an error exists, log it and return a `500` response.
    - If the query is successful, return the data using `NextResponse.json()` with a `200` status.
5.  **Type Validation**: Ensure the returned data structure is consistent with the `MountainGroupDto` type defined in `src/types.ts`.
