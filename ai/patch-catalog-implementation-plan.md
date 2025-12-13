# API Endpoint Implementation Plan: PATCH /api/catalogs/{catalogId}

## 1. Endpoint Overview

This document outlines the implementation plan for the `PATCH /api/catalogs/{catalogId}` endpoint. Its purpose is to allow an authenticated user to update the name of a specific, user-created catalog. The endpoint will validate the incoming data and catalog ID, verify user ownership, ensure the catalog is not predefined, perform the update in the database, and return the updated catalog object.

## 2. Request Details

- **HTTP Method**: `PATCH`
- **URL Structure**: `/api/catalogs/{catalogId}`
- **URL Parameters**:
  - **Required**: `catalogId` (UUID) - The unique identifier of the catalog to be updated.
- **Request Body**: A JSON object conforming to the `UpdateCatalogCommand` type.

  ```json
  {
    "name": "string"
  }
  ```

- **Validation Rules**:
  - `name`: Required, non-empty string, maximum 255 characters.

## 3. Used Types

- **Request Body**: `UpdateCatalogCommand` from `src/types.ts`.
- **Response Payload**: A new DTO, `UpdatedCatalogDto`, will be implicitly used, representing the updated catalog.

  ```typescript
  // To be added or considered for src/types.ts
  export type UpdatedCatalogDto = Pick<Catalog, "id" | "name" | "is_predefined" | "created_at" | "updated_at">;
  ```

## 4. Response Details

- **Success Response (200 OK)**: On a successful update, the API will return the updated catalog's data.

  ```json
  {
    "id": "uuid",
    "name": "string",
    "is_predefined": false,
    "created_at": "timestamptz",
    "updated_at": "timestamptz"
  }
  ```

- **Error Responses**:
  - `400 Bad Request`: The request payload is invalid or the `catalogId` is not a valid UUID.
  - `401 Unauthorized`: The user is not authenticated.
  - `403 Forbidden`: The user attempts to update a catalog they do not own or a predefined catalog.
  - `404 Not Found`: The specified catalog does not exist.
  - `409 Conflict`: A catalog with the same name already exists for the user.
  - `500 Internal Server Error`: An unexpected server-side error occurred.

## 5. Data Flow

1.  A `PATCH` request is sent to `/api/catalogs/{catalogId}`.
2.  The Next.js Route Handler at `src/app/api/catalogs/[catalogId]/route.ts` processes the request.
3.  The `catalogId` is extracted from the URL parameters and validated to be a UUID. If invalid, a `400` error is returned.
4.  A Supabase server client is created.
5.  The handler authenticates the user by retrieving their session. If no user is found, a `401` error is returned.
6.  The request body is parsed and validated against a Zod schema to ensure the `name` field is a non-empty string with a maximum length of 255 characters. If validation fails, a `400` error is returned.
7.  The handler first queries the `pathly.catalogs` table to fetch the catalog by `id`.
8.  **Existence Check**: If the query returns no result, a `404 Not Found` error is returned.
9.  **Authorization Check**:
    - The `user_id` of the fetched catalog is compared against the authenticated user's ID. If they do not match, a `403 Forbidden` error is returned.
    - The `is_predefined` flag of the catalog is checked. If `true`, a `403 Forbidden` error is returned.
10. If authorization checks pass, an `update` query is executed on the `pathly.catalogs` table, setting the new `name` for the record matching the `catalogId`. The query uses `.select()` to return the updated record.
11. The database operation is monitored for errors. A unique constraint violation (`error.code === '23505'`) on the `(user_id, name)` index triggers a `409 Conflict` response. Any other database error results in a `500` response.
12. Upon successful update, the returned database record is formatted according to the `UpdatedCatalogDto` structure.
13. The DTO is returned to the client in a JSON response with a `200 OK` status code.

## 6. Security Considerations

- **Authentication**: The route is protected. The Supabase middleware and server client must verify a valid user session.
- **Authorization**: It is critical to verify ownership. The `user_id` from the database record must be matched against the session user's ID. This prevents one user from modifying another user's data. The logic must also deny updates to predefined catalogs.
- **Input Validation**: Both the `catalogId` URL parameter and the `name` in the request body will be strictly validated using Zod to prevent malformed data and ensure type safety. The Supabase client mitigates SQL injection risks.

## 7. Error Handling

| Status Code | Reason                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| `400`       | Request body or `catalogId` fails Zod validation.                      |
| `401`       | User session is missing, invalid, or expired.                          |
| `403`       | User does not own the catalog or the catalog is predefined.            |
| `404`       | No catalog found for the given `catalogId`.                            |
| `409`       | A catalog with the provided `name` already exists for this user.       |
| `500`       | An unexpected server error occurred (e.g., database connection issue). |

## 8. Performance Considerations

The operation involves an indexed `SELECT` query to fetch the catalog, followed by an indexed `UPDATE` query. The unique partial index on `(user_id, name)` ensures that conflict checks during the update are highly performant. This endpoint is not expected to be a performance bottleneck under normal load.

## 9. Implementation Steps

1.  **Create Route File**: Create the file `src/app/api/catalogs/[catalogId]/route.ts`.
2.  **Define Zod Schemas**: Inside the route file, define two Zod schemas: one for validating the request body (`name`) and one for the URL parameters (`catalogId`).

    ```typescript
    const updateCatalogParamsSchema = z.object({
      catalogId: z.string().uuid({ message: "Invalid catalog ID." }),
    });

    const updateCatalogBodySchema = z.object({
      name: z.string().min(1, "Name is required.").max(255),
    });
    ```

3.  **Implement PATCH Handler**: Create an async `PATCH` function that accepts `NextRequest` and a `params` object for the URL parameters.
4.  **Authenticate User**:
    - Initialize the Supabase server client.
    - Fetch the user from the session. If `user` is null, return a `NextResponse` with status `401`.
5.  **Validate URL and Body**:
    - Use `updateCatalogParamsSchema.safeParse()` to validate `params`.
    - Use `updateCatalogBodySchema.safeParse()` on the request's JSON body.
    - If either validation fails, return a `NextResponse` with the validation errors and a `400` status.
6.  **Fetch Catalog for Validation**:
    - Query the `catalogs` table using `select().eq('id', catalogId).single()`.
    - If the query returns an error or no data, return a `404 Not Found` response.
7.  **Authorize Action**:
    - Check if `catalog.user_id !== user.id`. If true, return `403`.
    - Check if `catalog.is_predefined`. If true, return `403`.
8.  **Update in Database**:
    - Call `supabase.from('catalogs').update({ name }).eq('id', catalogId).select().single()`.
    - Wrap the call to handle potential errors from the Supabase client.
9.  **Handle Database Errors**:
    - Check the `error` object returned from the update query.
    - If `error.code` is `23505` (unique_violation), return a `NextResponse` with a conflict message and status `409`.
    - For any other error, log it and return a generic server error with status `500`.
10. **Format and Return Response**:
    - If the update is successful, ensure the returned data object matches the `UpdatedCatalogDto` structure.
    - Return the DTO using `NextResponse.json()` with a `200` status.
