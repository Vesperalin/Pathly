# API Endpoint Implementation Plan: GET /api/routes

## 1. Endpoint Overview

This document outlines the implementation plan for the `GET /api/routes` endpoint. Its purpose is to retrieve a paginated, filterable, and sortable list of routes belonging to the authenticated user. This endpoint is crucial for displaying the user's route history in the application.

## 2. Request Details

- **HTTP Method**: `GET`
- **URL Structure**: `/api/routes`
- **Query Parameters**:
  - **`page`** (optional): The page number for pagination.
    - Type: `number`
    - Default: `1`
  - **`page_size`** (optional): The number of items to return per page.
    - Type: `number`
    - Default: `10`
    - Constraint: Max `100`
  - **`sort_by`** (optional): The field to sort the results by.
    - Type: `string`
    - Enum: `name`, `route_date`
    - Default: `route_date`
  - **`order`** (optional): The sorting order.
    - Type: `string`
    - Enum: `asc`, `desc`
    - Default: `desc`
  - **`search`** (optional): A search term to filter routes by name.
    - Type: `string`
- **Request Body**: None.

## 3. Used Types

The implementation will use the following DTOs defined in `src/types.ts`:

- **`RoutePreviewDto`**: Represents the data for a single route in the response list.
  ```typescript
  export type RoutePreviewDto = Pick<Route, "id" | "name" | "route_date" | "got_points" | "distance">;
  ```
- **`PaginatedRoutesDto`**: Represents the shape of the entire JSON response, including pagination metadata.
  ```typescript
  export type PaginatedRoutesDto = PaginatedResponse<RoutePreviewDto>;
  ```

## 4. Response Details

- **Success (200 OK)**: Returns a `PaginatedRoutesDto` object.
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "string",
        "route_date": "date",
        "got_points": "number | null",
        "distance": "number"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total": 50
    }
  }
  ```
- **Error Responses**:
  - **`400 Bad Request`**: Returned if query parameters are invalid.
  - **`401 Unauthorized`**: Returned if the user is not authenticated.
  - **`500 Internal Server Error`**: Returned for unexpected server-side issues.

## 5. Data Flow

1. The client sends a `GET` request to `/api/routes` with optional query parameters.
2. The Next.js Route Handler at `src/app/api/routes/route.ts` receives the request.
3. A Supabase server client is created to interact with the database securely.
4. The handler checks for an active user session. If the user is not authenticated, it returns a `401 Unauthorized` error.
5. A `zod` schema is used to parse and validate the query parameters from the request URL. If validation fails, a `400 Bad Request` error is returned.
6. A Supabase query is built to fetch data from the `pathly.routes` table.
7. The query is dynamically modified based on the validated parameters:
   - The `SELECT` clause will only include fields required by `RoutePreviewDto`.
   - A `ilike` filter is applied to the `name` column if the `search` parameter is present.
   - The `order` modifier is applied based on `sort_by` and `order` parameters.
   - The `range` modifier is used for pagination based on `page` and `page_size`.
8. Two queries are executed: one to get the paginated list of routes and another to get the total count of routes matching the filters.
9. If any database error occurs, it is logged, and a `500 Internal Server Error` is returned.
10. The fetched data and pagination details are formatted into the `PaginatedRoutesDto` structure.
11. The final DTO is sent back to the client as a JSON response with a `200 OK` status.

## 6. Security Considerations

- **Authentication**: All requests will be authenticated using the Supabase server client, which validates the user's session from secure, HTTP-only cookies.
- **Authorization**: Row Level Security (RLS) is enabled on the `routes` table in Supabase. The policy `(auth.uid() = user_id)` ensures that users can only query their own route data.
- **Input Validation**: All query parameters will be strictly validated using `zod` to prevent invalid data from impacting the database query and to protect against potential DoS attacks by capping `page_size`.
- **Data Exposure**: The endpoint only returns a DTO (`RoutePreviewDto`), preventing the accidental leakage of sensitive or internal data like `user_id`.

## 7. Performance Considerations

- **Database Indexing**: To ensure fast query performance, the following indexes should be present on the `pathly.routes` table:
  - An index on `(user_id, route_date)` for default sorting and user-specific filtering.
  - An index on `(user_id, name)` to optimize search performance.
- **Pagination**: Database-level pagination (`.range()`) is used to avoid loading the entire dataset into memory, ensuring scalability.
- **Efficient Counting**: A separate `count` query is used to get the total number of records efficiently without retrieving the data itself.

## 8. Implementation Steps

1.  Create the route handler file at `src/app/api/routes/route.ts`.
2.  Inside the file, define a `zod` schema for validating the query parameters (`page`, `page_size`, `sort_by`, `order`, `search`). Include defaults and a `max` value for `page_size`.
3.  Implement the `GET` handler function.
4.  Instantiate the Supabase server client using `createClient()`.
5.  Fetch the current user from the session. If no user exists, return `NextResponse.json({ error: "Unauthorized" }, { status: 401 })`.
6.  Parse and validate the URL query parameters against the `zod` schema. If validation fails, return a `400` error with details from the schema.
7.  Construct the initial Supabase query using `supabase.from("routes").select("id, name, route_date, got_points, distance", { count: "exact" })`.
8.  Conditionally chain query modifiers based on validated parameters:
    - If `search` exists: `.ilike("name", \`%${search}%\`)`.
    - Set sorting: `.order(sortBy, { ascending: order === "asc" })`.
    - Set pagination: `.range(from, to)`.
9.  Execute the query and handle potential database errors by logging them and returning a `500` error.
10. Extract the `data` and `count` from the Supabase response.
11. Construct the `PaginatedRoutesDto` object with the fetched data and pagination metadata.
12. Return the final DTO using `NextResponse.json(paginatedResponse, { status: 200 })`.
