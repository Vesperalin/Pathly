# API Endpoint Implementation Plan: GET /api/profiles/me

## 1. Endpoint Overview

This document outlines the implementation plan for the `GET /api/profiles/me` endpoint. The purpose of this endpoint is to retrieve the profile information of the currently authenticated user, including their ID, language preference, display theme, and account creation date.

## 2. Request Details

- **HTTP Method**: `GET`
- **URL Structure**: `/api/profiles/me`
- **Parameters**:
  - **Required**: None.
  - **Optional**: None.
- **Request Body**: None.

## 3. Used Types

The implementation will use the `ProfileDto` type, which needs to be updated in `src/types.ts` to align with the API specification.

- **`src/types.ts`**:
  ```typescript
  /**
   * DTO for a user's profile.
   * GET /api/profiles/me
   */
  export type ProfileDto = Pick<Profile, "id" | "language" | "theme" | "created_at">;
  ```

## 4. Response Details

- **Success (200 OK)**: A JSON object containing the user's profile data.
  ```json
  {
    "id": "c3e4a4f8-3c3e-4b7d-8b5e-3c3e4b7d8b5e",
    "language": "pl",
    "theme": "system",
    "created_at": "2025-10-26T10:00:00.000Z"
  }
  ```
- **Error Responses**:
  - **401 Unauthorized**: If the user is not authenticated.
    ```json
    { "error": "User is not authenticated." }
    ```
  - **404 Not Found**: If the user is authenticated, but their profile does not exist.
    ```json
    { "error": "Profile not found for the current user." }
    ```
  - **500 Internal Server Error**: For any unexpected server-side errors.
    ```json
    { "error": "An internal server error occurred." }
    ```

## 5. Data Flow

1.  A client-side request is made to `GET /api/profiles/me`, including the authentication cookie managed by the browser.
2.  The Next.js API route handler at `src/app/api/profiles/me/route.ts` receives the request.
3.  Inside the handler, a Supabase server client is instantiated using `createClient` from `@/lib/supabase/server`.
4.  The handler authenticates the user by calling `supabase.auth.getUser()`.
5.  If no user session is found, the handler immediately returns a `401 Unauthorized` response.
6.  If a user is authenticated, the handler queries the `pathly.profiles` table for a single record where the `id` column matches the authenticated user's ID (`user.id`).
7.  If the query returns no data, a `404 Not Found` response is sent.
8.  If the query encounters a database error, a `500 Internal Server Error` response is sent.
9.  On a successful query, the data is formatted according to the `ProfileDto` and returned in a `200 OK` response.

## 6. Security Considerations

- **Authentication**: The endpoint is protected. All requests must be authenticated via a valid session token (handled by Supabase). The route handler will reject any request that does not have a valid user session.
- **Authorization**: The database query will be strictly scoped to the authenticated user's ID (`WHERE id = user.id`). This prevents any possibility of one user accessing another user's profile data through this endpoint.

## 7. Performance Considerations

- **Database Query**: The query will fetch a single row by its primary key (`id`). PostgreSQL is highly optimized for this type of lookup, and an index is automatically present on the `id` column.
- **Bottlenecks**: No performance bottlenecks are anticipated for this endpoint due to the simplicity and efficiency of the database operation.

## 8. Implementation Steps

1.  **Update Type Definition**: Modify the `ProfileDto` type in `src/types.ts` to include the `created_at` field as specified in section 3.
2.  **Create API Route File**: Create a new file: `src/app/api/profiles/me/route.ts`.
3.  **Implement Route Handler**: Implement the `GET` function in the new route file.
    - Import `NextResponse` from `next/server` and `createClient` from `@/lib/supabase/server`.
    - Instantiate the Supabase client.
    - Retrieve the user from the session. Return a 401 response if the user is not authenticated.
    - Perform the database query: `supabase.from('profiles').select('id, language, theme, created_at').eq('id', user.id).single()`.
    - Handle the query result:
      - If `error` is present, check its code. If it indicates no rows were found (`PGRST116`), return a 404 response. Otherwise, log the error and return a 500 response.
      - If `data` is returned, send it as the payload in a 200 OK response.
