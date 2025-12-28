# API Endpoint Implementation Plan: POST /api/catalogs

## 1. Endpoint Overview

This document outlines the implementation plan for the `POST /api/catalogs` endpoint. Its purpose is to allow an authenticated user to create a new, personalized catalog for organizing their hiking routes. The endpoint will validate the incoming data, insert a new record into the database, and return the newly created catalog object.

## 2. Request Details

- **HTTP Method**: `POST`
- **URL Structure**: `/api/catalogs`
- **Request Body**: The request body must be a JSON object conforming to the `CreateCatalogCommand` type.

  ```json
  {
    "name": "string"
  }
  ```

- **Parameters**:
  - **Required**: `name` (string, max 255 characters, non-empty)

## 3. Used Types

- **Request Body**: `CreateCatalogCommand` from `src/types.ts`
- **Response Payload**: `CatalogPreviewDto` from `src/types.ts`

## 4. Response Details

- **Success Response (201 Created)**: On successful creation, the API will return the new catalog's data.

  ```json
  {
    "id": "uuid",
    "name": "string",
    "is_predefined": false,
    "total_points": 0,
    "created_at": "timestamptz",
    "updated_at": "timestamptz"
  }
  ```

- **Error Responses**:
  - `400 Bad Request`: The request body is invalid or fails validation.
  - `401 Unauthorized`: The user is not authenticated.
  - `409 Conflict`: A catalog with the same name already exists for the user.
  - `500 Internal Server Error`: An unexpected server-side error occurred.

## 5. Data Flow

1. A `POST` request is sent to `/api/catalogs`.
2. The Next.js Route Handler at `src/app/api/catalogs/route.ts` processes the request.
3. A Supabase server client is created to interact with the database securely.
4. The handler authenticates the user by retrieving their session data. If no user is found, a `401` error is returned.
5. The request body is parsed and validated against a Zod schema to ensure the `name` field is a non-empty string with a maximum length of 255 characters. If validation fails, a `400` error is returned with details.
6. A new record is inserted into the `pathly.catalogs` table. The `name` is taken from the validated request body, and the `user_id` is sourced directly from the authenticated user's session data.
7. The database operation is monitored for errors. A unique constraint violation on the `(user_id, name)` index triggers a `409 Conflict` response. Any other database error results in a `500` response.
8. Upon successful insertion, the returned database record is formatted as a `CatalogPreviewDto` object, with `total_points` initialized to `0`.
9. The `CatalogPreviewDto` object is returned to the client with a `201 Created` status code.

## 6. Security Considerations

- **Authentication**: This is a protected route. The Supabase middleware must be configured to verify a valid user session before allowing access to the handler.
- **Authorization**: The `user_id` for the new catalog must be obtained from the server-side session object (`auth.uid()`). It must not be read from the request body or any other client-controlled source. This prevents a user from creating resources on behalf of others. Supabase RLS policies will provide an additional layer of protection at the database level.
- **Input Validation**: All incoming data will be strictly validated using Zod to prevent malformed data, oversized payloads, and other injection-style attacks. The use of the Supabase client library mitigates the risk of SQL injection.

## 7. Error Handling

| Status Code | Reason                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| `400`       | Request body is malformed or fails Zod validation.                     |
| `401`       | User session is missing, invalid, or expired.                          |
| `409`       | A catalog with the provided `name` already exists for this user.       |
| `500`       | An unexpected server error occurred (e.g., database connection issue). |

## 8. Performance Considerations

The operation consists of a single, indexed `INSERT` query. The unique partial index on `(user_id, name)` ensures that conflict checks are highly performant. Under typical load, this endpoint is not expected to be a performance bottleneck.

## 9. Implementation Steps

1.  **Create Route File**: Create the file `src/app/api/catalogs/route.ts`.
2.  **Define Zod Schema**: Inside the route file, define a Zod schema for the request body to validate the `name` property.
    ```typescript
    const createCatalogSchema = z.object({
      name: z.string().min(1, "Name is required.").max(255),
    });
    ```
3.  **Implement POST Handler**: Create an async `POST` function that accepts a `NextRequest`.
4.  **Authenticate User**:
    - Initialize the Supabase server client.
    - Fetch the user from the session. If `user` is null, return a `NextResponse` with status `401`.
5.  **Validate Request Body**:
    - Parse the JSON body from the request.
    - Use `createCatalogSchema.safeParse()` to validate the data.
    - If validation fails, return a `NextResponse` with the validation errors and a `400` status.
6.  **Insert into Database**:
    - Call `supabase.from('catalogs').insert(...)` with the `name` from the validated data and `user_id` from the session.
    - Use `.select()` to retrieve the newly created row in the same query.
    - Ensure the query is wrapped in a `try...catch` block or handles the returned error from the Supabase client.
7.  **Handle Database Errors**:
    - Check the `error` object returned from the Supabase client.
    - If `error.code` is `23505` (unique_violation), return a `NextResponse` with a conflict message and status `409`.
    - For any other error, log it and return a generic server error with status `500`.
8.  **Format and Return Response**:
    - If the insertion is successful, map the result to the `CatalogPreviewDto` structure.
    - Set `total_points` to `0` as this is a new catalog.
    - Return the DTO using `NextResponse.json()` with a `201` status.
