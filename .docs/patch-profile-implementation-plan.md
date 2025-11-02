# API Endpoint Implementation Plan: PATCH /api/profiles/me

## 1. Endpoint Overview

This document outlines the implementation plan for the `PATCH /api/profiles/me` endpoint. Its purpose is to allow an authenticated user to update their profile settings, specifically their preferred language and display theme. The endpoint will only modify the fields provided in the request body.

## 2. Request Details

- **HTTP Method**: `PATCH`
- **URL Structure**: `/api/profiles/me`
- **Parameters**:
  - **Required**: None.
  - **Optional**: The request body may contain `language` and/or `theme`.
- **Request Body**: A JSON object containing the fields to be updated.

  ```json
  {
    "language": "en",
    "theme": "dark"
  }
  ```

## 3. Used Types

The implementation will use existing types defined in `src/types.ts`:

- **`UpdateProfileCommand`**: This type will be used to validate the incoming request body.
  ```typescript
  // src/types.ts
  export type UpdateProfileCommand = Partial<Pick<Profile, "language" | "theme">>;
  ```
- **`ProfileDto`**: This type will be used to format the successful response payload, ensuring consistency with the `GET /api/profiles/me` endpoint.
  ```typescript
  // src/types.ts
  export type ProfileDto = Pick<Profile, "id" | "language" | "theme" | "created_at">;
  ```

## 4. Response Details

- **Success (200 OK)**: A JSON object containing the user's updated profile data.
  ```json
  {
    "id": "c3e4a4f8-3c3e-4b7d-8b5e-3c3e4b7d8b5e",
    "language": "en",
    "theme": "dark",
    "created_at": "2025-10-26T10:00:00.000Z"
  }
  ```
- **Error Responses**: See the Error Handling section for details on 400, 401, 404, and 500 responses.

## 5. Data Flow

1.  The client sends a `PATCH` request to `/api/profiles/me` with a JSON payload containing the fields to update.
2.  The API route handler at `src/app/api/profiles/me/route.ts` receives the request.
3.  The handler authenticates the user by creating a Supabase server client and calling `supabase.auth.getUser()`. If no user is found, it returns a `401 Unauthorized` response.
4.  The request body is parsed and validated against a Zod schema that enforces the `UpdateProfileCommand` type. If validation fails, a `400 Bad Request` response is returned with error details.
5.  If validation succeeds, the handler executes a Supabase query to update the `pathly.profiles` table: `supabase.from('profiles').update(validatedData).eq('id', user.id).select('id, language, theme, created_at').single()`.
6.  The `.select()` and `.single()` methods ensure that the updated record is returned in the same transaction.
7.  If the query result contains an error indicating no rows were found (`PGRST116`), it means the profile does not exist, and a `404 Not Found` response is sent.
8.  For any other database errors, a `500 Internal Server Error` response is sent, and the error is logged to the console.
9.  On a successful update, the returned data is sent as the payload in a `200 OK` response.

## 6. Security Considerations

- **Authentication**: The endpoint is protected and requires a valid user session. The handler will immediately reject requests without one.
- **Authorization**: The database update is strictly scoped to the authenticated user's ID (`WHERE id = user.id`), preventing any user from modifying another's profile.
- **Input Validation**: All incoming data is validated using a Zod schema to ensure that only permitted fields (`language`, `theme`) with allowed values (`pl`/`en`, `light`/`dark`/`system`) are processed. This mitigates risks of data corruption and injection attacks.

## 7. Error Handling

- **400 Bad Request**: Returned if the request body is malformed or fails validation (e.g., invalid `language` or `theme` values).
  ```json
  { "error": "Invalid request body.", "details": "[Zod error messages]" }
  ```
- **401 Unauthorized**: Returned if the user is not authenticated.
  ```json
  { "error": "User is not authenticated." }
  ```
- **404 Not Found**: Returned if the user is authenticated, but their profile does not exist in the database.
  ```json
  { "error": "Profile not found for the current user." }
  ```
- **500 Internal Server Error**: Returned for any unexpected server-side errors, such as a database connection failure.
  ```json
  { "error": "An internal server error occurred." }
  ```

## 8. Performance Considerations

- **Database Query**: The `UPDATE` operation targets a single row by its primary key (`id`), which is indexed and highly performant.
- **Payload Size**: The request and response payloads are small and consist of only a few fields, ensuring minimal network latency.
- **Bottlenecks**: No performance bottlenecks are anticipated for this endpoint.

## 9. Implementation Steps

1.  **Create API Route File**: If it doesn't already exist, create the file `src/app/api/profiles/me/route.ts`.
2.  **Define Validation Schema**: Inside the route file, define a Zod schema to validate the request body against the `UpdateProfileCommand` type.

    ```typescript
    import { z } from "zod";

    const updateProfileSchema = z.object({
      language: z.enum(["pl", "en"]).optional(),
      theme: z.enum(["light", "dark", "system"]).optional(),
    });
    ```

3.  **Implement PATCH Handler**:
    - Import `NextRequest`, `NextResponse` from `next/server` and `createClient` from `@/lib/supabase/server`.
    - Create an `async` function named `PATCH` that accepts a `NextRequest`.
    - Instantiate the Supabase client.
    - Authenticate the user and handle the unauthenticated case (401).
    - Parse the request body using `await request.json()`.
    - Validate the parsed body with `updateProfileSchema.safeParse()`. If it fails, return a 400 response with the error details.
    - If validation is successful, execute the Supabase update query, chaining `.select()` to retrieve the updated data.
    - Handle the query result: check for errors (404, 500) and return the data with a 200 OK status on success.
