# API Endpoint Implementation Plan: PATCH /api/routes/{routeId}

## 1. Endpoint Overview

This endpoint updates the details of an existing route identified by `routeId`. It allows for partial modification of user-editable fields such as the route's name, date, points, and notes. It also enables replacing the route's associations with mountain groups and catalogs. GPX-derived data (`distance`, `ascent`, `descent`, `duration`) is immutable and cannot be altered through this endpoint. The user must be authenticated and must be the owner of the route to perform the update.

## 2. Request Details

- **HTTP Method**: `PATCH`
- **URL Structure**: `/api/routes/{routeId}`
- **Parameters**:
  - **Path (Required)**:
    - `routeId` (UUID): The unique identifier of the route to be updated.
- **Request Body**: `UpdateRouteCommand`

  ```json
  {
    "name": "string",
    "route_date": "string(YYYY-MM-DD)",
    "got_points": "number | null",
    "notes": "string | null",
    "mountain_group_ids": ["uuid"],
    "catalog_ids": ["uuid"]
  }
  ```

  - All fields in the request body are optional.

## 3. Used Types

- **Command Model (Request)**: `UpdateRouteCommand` from `src/types.ts` defines the structure of the request body.
  ```typescript
  export type UpdateRouteCommand = Partial<{
    name: string;
    route_date: string;
    got_points: number | null;
    notes: string | null;
    mountain_group_ids: string[];
    catalog_ids: string[];
  }>;
  ```
- **DTO (Response)**: `RouteDetailsDto` from `src/types.ts` will be used for the success response body, providing the fully updated route object.

## 4. Response Details

- **Success (200 OK)**:
  - Returns the updated route object as `RouteDetailsDto`.
- **Errors**:
  - `400 Bad Request`: The request payload is invalid or fails validation.
  - `401 Unauthorized`: The user is not authenticated.
  - `403 Forbidden`: The user is not the owner of the route.
  - `404 Not Found`: The route, or a referenced catalog/mountain group, does not exist.
  - `409 Conflict`: A route with the provided `name` already exists for the user.
  - `500 Internal Server Error`: A generic server error occurred.

## 5. Data Flow

1.  The Next.js route handler at `src/app/api/routes/[routeId]/route.ts` receives the `PATCH` request.
2.  It authenticates the user by creating a Supabase server client and retrieving the user session. If no session exists, it returns `401 Unauthorized`.
3.  The `routeId` is extracted from the URL parameters, and the request body is parsed.
4.  A Zod schema validates the request body's structure and types. If validation fails, it returns `400 Bad Request`.
5.  The handler invokes a service function, e.g., `RouteService.updateRoute(userId, routeId, validatedBody)`.
6.  **Inside the `RouteService`**:
    a. A database transaction is initiated to ensure atomicity.
    b. The service first queries for the route by `routeId`. If not found, it returns a `404 Not Found` error.
    c. It verifies that the `route.user_id` matches the authenticated user's ID. If not, it returns `403 Forbidden`.
    d. If `name` is being updated, it checks for potential duplicates for the same user to prevent violating the unique constraint, returning `409 Conflict` if one exists.
    e. It validates that all UUIDs in `mountain_group_ids` and `catalog_ids` exist and that the catalogs belong to the user.
    f. If `catalog_ids` contains a predefined catalog, it verifies that `got_points` is not null.
    g. The `routes` table is updated with the new, non-null values from the payload.
    h. If `mountain_group_ids` or `catalog_ids` are provided, the existing associations in the `route_mountain_groups` and `route_catalogs` join tables are deleted, and new records are inserted.
    i. The transaction is committed.
7.  Upon a successful update, the service fetches and returns the complete, updated route details.
8.  The route handler serializes this data into a `RouteDetailsDto` and sends it back to the client with a `200 OK` status.

## 6. Security Considerations

- **Authentication**: All requests must be authenticated via Supabase. The handler will immediately reject requests without a valid user session.
- **Authorization**: Ownership is strictly enforced. The service layer must verify that the `user_id` of the route being updated matches the ID of the authenticated user.
- **Input Validation**: A Zod schema will rigorously validate all incoming data to prevent malformed payloads and protect against injection-style attacks.
- **Data Sanctity**: The update logic will explicitly ignore any attempts to modify immutable, GPX-derived fields (`distance`, `total_ascent`, etc.).

## 7. Performance Considerations

- **Database Indexing**: The query to find the route by its primary key (`id`) is highly efficient. The unique index on `(user_id, name)` ensures that name conflict checks are also performant.
- **Transaction Management**: Using a database transaction for the update and association changes is crucial for data integrity but introduces a slight overhead. The transaction should be kept as short as possible.
- **Query Optimization**: When validating `catalog_ids` and `mountain_group_ids`, fetching all records in a single `SELECT ... WHERE id IN (...)` query is more efficient than querying them one by one.

## 8. Implementation Steps

1.  **Update Types**:
    - Verify that the `UpdateRouteCommand` type is correctly defined in `src/types.ts`.
2.  **Create Validator**:
    - Create a new file `src/features/routes/route.validators.ts`.
    - Define and export a Zod schema for `UpdateRouteCommand` to validate the request body.
3.  **Implement Route Handler**:
    - Create the file `src/app/api/routes/[routeId]/route.ts`.
    - Implement the `PATCH` function.
    - Add logic to create the Supabase server client and get the user. Handle unauthenticated users.
    - Parse and validate the request body using the Zod schema.
    - Call the route service with the necessary parameters.
    - Add a try-catch block to handle errors from the service layer and map them to appropriate HTTP responses.
4.  **Implement Service Logic**:
    - Create or update the `src/features/routes/route.service.ts` file.
    - Implement the `updateRoute` method, which will accept `userId`, `routeId`, and the validated command object.
    - Implement the database transaction logic using the Supabase client (`supabase.rpc('update_route_details', ...)` or a series of chained queries).
    - Add checks for route existence and ownership.
    - Add validation logic for `mountain_group_ids` and `catalog_ids`.
    - Handle the replacement of associations in the join tables (`route_mountain_groups`, `route_catalogs`).
    - Implement logic to catch specific database errors (e.g., unique constraint violation for `name`) and throw custom, typed errors that the handler can interpret.
5.  **Error Handling**:
    - Define custom error classes (e.g., `NotFoundError`, `ForbiddenError`, `ConflictError`) to be thrown from the service layer to allow for clean error handling in the route handler.
6.  **Testing**:
    - (Optional but recommended) Write integration tests to cover success cases, validation errors, authorization failures, and other error scenarios.
