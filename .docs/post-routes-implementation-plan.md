# API Endpoint Implementation Plan: Create Route

## 1. Endpoint Overview

This document outlines the implementation plan for the `POST /api/routes` endpoint. This endpoint allows authenticated users to create a new hiking route. The functionality includes validating input data, inserting the route into the database, and associating it with specified mountain groups and catalogs. This endpoint is typically used after a GPX file has been parsed to obtain route metrics.

## 2. Request Details

- **HTTP Method**: `POST`
- **URL Structure**: `/api/routes`
- **Required Parameters**:
  - `name` (string)
  - `route_date` (date string: `YYYY-MM-DD`)
  - `distance` (number)
  - `total_ascent` (number)
  - `total_descent` (number)
  - `duration` (integer)
- **Optional Parameters**:
  - `got_points` (number, required if linked to a predefined catalog)
  - `notes` (string)
  - `mountain_group_ids` (array of UUIDs)
  - `catalog_ids` (array of UUIDs)
- **Request Body**:

  ```json
  {
    "name": "string",
    "route_date": "date",
    "got_points": "number",
    "distance": "number",
    "total_ascent": "number",
    "total_descent": "number",
    "duration": "number",
    "notes": "string",
    "mountain_group_ids": ["uuid", "uuid"],
    "catalog_ids": ["uuid", "uuid"]
  }
  ```

## 3. Used Types

- **Request Command Model**: `CreateRouteCommand` from `src/types.ts` will be used to type the incoming request payload.
- **Response DTO**: `RouteDetailsDto` from `src/types.ts` will be used to structure the successful response payload.

## 4. Response Details

- **Success Response (201 Created)**: Returns the newly created route object, including details of associated mountain groups and catalogs.
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
- **Error Responses**:
  - `400 Bad Request`: Invalid or missing data in the request payload.
  - `401 Unauthorized`: User is not authenticated.
  - `409 Conflict`: A route with the same name already exists for the user.
  - `500 Internal Server Error`: An unexpected error occurred on the server.

## 5. Data Flow

1.  The client sends a `POST` request with the route data to `/api/routes`.
2.  The Next.js Route Handler (`src/app/api/routes/route.ts`) receives the request.
3.  The handler authenticates the user using the Supabase server client (`@/lib/supabase/server`).
4.  The request body is parsed and validated against a Zod schema based on the `CreateRouteCommand` type.
5.  If validation passes, the handler calls a `createRoute` function in a dedicated service module (`src/features/routes/route.service.ts`), passing the validated data and user ID.
6.  The `createRoute` service function initiates a database transaction to ensure atomicity.
7.  Inside the transaction, the service:
    a. Verifies that all `catalog_ids` exist and belong to the authenticated user.
    b. Verifies that all `mountain_group_ids` exist in the `mountain_groups` table.
    c. Checks if any provided catalogs are predefined (`is_predefined = true`). If so, it validates that `got_points` has been provided.
    d. Inserts a new record into the `pathly.routes` table.
    e. If `catalog_ids` are present, it inserts corresponding records into the `pathly.route_catalogs` join table.
    f. If `mountain_group_ids` are present, it inserts corresponding records into the `pathly.route_mountain_groups` join table.
8.  The service queries the database to retrieve the newly created route along with its associated catalogs and mountain groups.
9.  The transaction is committed.
10. The service returns the complete route data (`RouteDetailsDto`) to the handler.
11. The handler sends a `201 Created` response to the client with the route data in the response body.

## 6. Security Considerations

- **Authentication**: The endpoint will be protected. A `401 Unauthorized` response will be sent if the user is not authenticated. This will be handled by retrieving the user session from the Supabase client.
- **Authorization**: The service layer must verify that any `catalog_ids` provided in the payload belong to the authenticated user. This prevents a user from associating a route with another user's catalogs.
- **Input Validation**: All incoming data will be strictly validated using a Zod schema to prevent invalid data from being processed and stored. This mitigates risks such as injection attacks and ensures data integrity.
- **Error Handling**: The database's unique constraint `(user_id, name)` on the `routes` table will be handled gracefully. If a user tries to create a route with a name that already exists, the application will catch the database error and return a `409 Conflict` response.

## 7. Performance Considerations

- **Database Transactions**: All database write operations (inserts into `routes`, `route_catalogs`, `route_mountain_groups`) will be wrapped in a single transaction. This ensures data consistency and is more performant than executing multiple separate queries.
- **Indexing**: The query to check for an existing route name will be efficient due to the unique composite index on `(user_id, name)`. Foreign key indexes will ensure efficient joins when creating and retrieving associations.

## 8. Implementation Steps

1.  **Create Zod Schema**:
    - In a new file, `src/lib/validators/route.validator.ts`, define a Zod schema for `CreateRouteCommand`.
    - The schema must enforce all validation rules specified in the API documentation (e.g., types, lengths, ranges).

2.  **Create Route Service**:
    - Create a new file: `src/features/routes/route.service.ts`.
    - Implement a `createRoute(command: CreateRouteCommand, userId: string)` function.
    - This function will use the Supabase server client to execute a database transaction (`supabase.rpc('run_in_transaction', ...)` or similar pattern).
    - Inside the service function:
      - Validate the existence and ownership of `catalog_ids`.
      - Validate the existence of `mountain_group_ids`.
      - Handle the conditional requirement for `got_points` if a predefined catalog is used.
      - Insert the main route record.
      - Insert records into join tables (`route_catalogs`, `route_mountain_groups`).
      - After insertion, fetch and return the complete route details conforming to `RouteDetailsDto`.
      - Handle potential database errors (e.g., unique constraint violation for route name) and throw custom, typed errors.

3.  **Implement API Route Handler**:
    - Create the route handler file: `src/app/api/routes/route.ts`.
    - Implement the `POST` handler function.
    - Instantiate the Supabase server client to get the authenticated user. Return `401` if no user.
    - Use the Zod schema to parse and validate the request body. Return `400` on validation failure, including error details.
    - Call the `createRoute` function from the `route.service`.
    - Wrap the service call in a `try...catch` block to handle errors thrown by the service (e.g., conflict, validation failures) and map them to appropriate HTTP status codes (`409`, `400`).
    - On success, return a `201 Created` response with the data returned from the service.
    - Log any unexpected errors and return a `500 Internal Server Error`.
