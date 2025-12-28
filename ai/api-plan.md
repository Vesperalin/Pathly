# REST API Plan for Pathly

This document outlines the RESTful API for the Pathly application, designed to support the features and requirements described in the Product Requirements Document (PRD) and based on the defined database schema.

## 1. Resources

The API is built around the following main resources, which correspond to the primary tables in the `pathly` database schema:

- **Profiles**: User-specific settings like language and theme. Corresponds to the `pathly.profiles` table.
- **Catalogs**: Collections of routes, both predefined (GOT badges) and user-created. Corresponds to the `pathly.catalogs` table.
- **Routes**: Detailed information about individual hiking trips. Corresponds to the `pathly.routes` table.
- **Mountain Groups**: A read-only list of official mountain groups. Corresponds to the `pathly.mountain_groups` table.
- **Analytics**: An internal resource for tracking key user events. Corresponds to the `pathly.analytics_events` table.

## 2. Endpoints

All endpoints are prefixed with `/api`.

---

### 2.1. Profiles

Resource for managing the current user's profile settings.

#### GET `/api/profiles/me`

- **Description**: Retrieve the profile of the currently authenticated user.
- **Response Payload (200 OK)**:
  ```json
  {
    "id": "uuid",
    "language": "pl" | "en",
    "theme": "light" | "dark" | "system",
    "created_at": "timestamptz"
  }
  ```
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: Profile not found for the user.

#### PATCH `/api/profiles/me`

- **Description**: Update the profile of the currently authenticated user.
- **Request Payload**:
  ```json
  {
    "language": "pl" | "en", // Optional
    "theme": "light" | "dark" | "system" // Optional
  }
  ```
- **Validation Rules**:
  - `language`: Must be one of `pl` or `en`.
  - `theme`: Must be one of `light`, `dark`, or `system`.
- **Response Payload (200 OK)**:
  ```json
  {
    "id": "uuid",
    "language": "pl" | "en",
    "theme": "light" | "dark" | "system",
    "created_at": "timestamptz"
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: Invalid payload data.
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: Profile not found for the user.

---

### 2.2. Catalogs

Resource for managing route catalogs.

#### GET `/api/catalogs`

- **Description**: Retrieve a list of all catalogs (predefined and user-created) for the authenticated user.
- **Query Parameters**:
  - `type`: (Optional) Filter by catalog type. `predefined` | `user`.
  - `page`: (Optional) Page number for pagination. Defaults to `1`.
  - `page_size`: (Optional) Number of items per page. Defaults to `10`.
  - `sort_by`: (Optional) Field to sort by. `name` | `created_at`. Defaults to `name`.
  - `order`: (Optional) Sort order. `asc` | `desc`. Defaults to `asc`.
- **Response Payload (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "string",
        "is_predefined": "boolean",
        "total_points": "number", // Calculated sum
        "created_at": "timestamptz",
        "updated_at": "timestamptz"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total": 15
    }
  }
  ```
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.

#### GET `/api/catalogs/{catalogId}`

- **Description**: Retrieve a single catalog by its ID, including the list of associated routes.
- **Query Parameters**:
  - `routes_page`: (Optional) Page number for the nested routes list. Defaults to `1`.
  - `routes_page_size`: (Optional) Number of routes per page. Defaults to `10`.
  - `routes_sort_by`: (Optional) Field to sort routes by. `name` | `route_date`. Defaults to `route_date`.
  - `routes_order`: (Optional) Sort order for routes. `asc` | `desc`. Defaults to `desc`.
- **Response Payload (200 OK)**:
  ```json
  {
    "id": "uuid",
    "name": "string",
    "is_predefined": "boolean",
    "total_points": "number", // Calculated sum
    "created_at": "timestamptz",
    "updated_at": "timestamptz",
    "routes": {
      "data": [
        {
          "id": "uuid",
          "name": "string",
          "route_date": "date",
          "got_points": "number" | null
        }
      ],
      "pagination": {
        "page": 1,
        "page_size": 10,
        "total": 25
      }
    }
  }
  ```
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.
  - `403 Forbidden`: User does not have access to this catalog.
  - `404 Not Found`: Catalog not found.

#### POST `/api/catalogs`

- **Description**: Create a new user-defined catalog.
- **Request Payload**:
  ```json
  {
    "name": "string"
  }
  ```
- **Validation Rules**:
  - `name`: Required. Must be a non-empty string, max 255 characters.
- **Response Payload (201 Created)**:
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
- **Error Codes**:
  - `400 Bad Request`: Invalid payload (e.g., name is missing or empty).
  - `401 Unauthorized`: User is not authenticated.
  - `409 Conflict`: A catalog with the same name already exists for the user.

#### PATCH `/api/catalogs/{catalogId}`

- **Description**: Update the name of a user-created catalog.
- **Request Payload**:
  ```json
  {
    "name": "string"
  }
  ```
- **Validation Rules**:
  - `name`: Required. Must be a non-empty string, max 255 characters.
- **Response Payload (200 OK)**:
  ```json
  {
    "id": "uuid",
    "name": "string",
    "is_predefined": false,
    "created_at": "timestamptz",
    "updated_at": "timestamptz"
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: Invalid payload.
  - `401 Unauthorized`: User is not authenticated.
  - `403 Forbidden`: User cannot update a predefined catalog or a catalog they don't own.
  - `404 Not Found`: Catalog not found.
  - `409 Conflict`: A catalog with the same name already exists for the user.

#### DELETE `/api/catalogs/{catalogId}`

- **Description**: Delete a user-created catalog. This action only removes the catalog, not the routes within it.
- **Success Code**: `204 No Content`.
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.
  - `403 Forbidden`: User cannot delete a predefined catalog or a catalog they don't own.
  - `404 Not Found`: Catalog not found.

---

### 2.3. Routes

Resource for managing hiking routes.

#### GET `/api/routes`

- **Description**: Retrieve a list of all routes for the authenticated user.
- **Query Parameters**:
  - `page`: (Optional) Page number for pagination. Defaults to `1`.
  - `page_size`: (Optional) Number of items per page. Defaults to `10`.
  - `sort_by`: (Optional) Field to sort by. `name` | `route_date`. Defaults to `route_date`.
  - `order`: (Optional) Sort order. `asc` | `desc`. Defaults to `desc`.
  - `search`: (Optional) Text to search for in the route `name`.
- **Response Payload (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "string",
        "route_date": "date",
        "got_points": "number" | null,
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
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.

#### POST `/api/routes/gpx-parse`

- **Description**: Upload and parse one or more GPX files to extract route metadata. This is a preliminary step before creating a route. The response data is used to pre-fill the route creation form.
- **Request Payload**: `multipart/form-data` with one or more files under the `gpxFiles` key.
- **Validation Rules**:
  - `gpxFiles`: Required. Must be one or more files with a `.gpx` extension and valid GPX structure.
- **Response Payload (200 OK)**:
  ```json
  {
    "route_date": "date", // Earliest date from all files
    "distance": "number", // Sum of distances
    "total_ascent": "number", // Sum of ascents
    "total_descent": "number", // Sum of descents
    "duration": "number" // Sum of durations in seconds
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: No files uploaded, invalid file format, or parsing error.
  - `401 Unauthorized`: User is not authenticated.

#### POST `/api/routes`

- **Description**: Create a new route. This endpoint should be called after parsing GPX files.
- **Request Payload**:
  ```json
  {
    "name": "string",
    "route_date": "date",
    "got_points": "number", // Optional. Required if route is in a predefined catalog.
    "distance": "number",
    "total_ascent": "number",
    "total_descent": "number",
    "duration": "number",
    "notes": "string", // Optional
    "mountain_group_ids": ["uuid", "uuid"], // Optional
    "catalog_ids": ["uuid", "uuid"] // Optional
  }
  ```
- **Validation Rules**:
  - `name`: Required. Must be a non-empty string, max 255 characters.
  - `route_date`: Required. Must be a valid date in `YYYY-MM-DD` format.
  - `got_points`: Optional. If provided, must be an integer greater than or equal to 0. Required if `catalog_ids` contains a predefined catalog.
  - `distance`: Required. Must be a number greater than or equal to 0, with a maximum of 5 digits before and 2 after the decimal point (e.g., `99999.99`).
  - `total_ascent`: Required. Must be a number greater than or equal to 0, with a maximum of 4 digits before and 2 after the decimal point (e.g., `9999.99`).
  - `total_descent`: Required. Must be a number greater than or equal to 0, with a maximum of 4 digits before and 2 after the decimal point (e.g., `9999.99`).
  - `duration`: Required. Must be an integer (representing seconds) greater than or equal to 0.
  - `notes`: Optional. If provided, must be a string.
  - `mountain_group_ids`: Optional. If provided, must be an array of valid UUIDs corresponding to existing mountain groups.
  - `catalog_ids`: Optional. If provided, must be an array of valid UUIDs corresponding to the user's existing catalogs.
- **Response Payload (201 Created)**: The full route object.
- **Error Codes**:
  - `400 Bad Request`: Invalid payload data.
  - `401 Unauthorized`: User is not authenticated.
  - `409 Conflict`: A route with the same name already exists for the user.

#### GET `/api/routes/{routeId}`

- **Description**: Retrieve a single route by its ID.
- **Response Payload (200 OK)**:
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
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.
  - `403 Forbidden`: User does not own this route.
  - `404 Not Found`: Route not found.

#### PATCH `/api/routes/{routeId}`

- **Description**: Update the details of an existing route. Note: GPX-derived data (`distance`, `ascent`, `descent`, `duration`) is not editable.
- **Request Payload**:
  ```json
  {
    "name": "string", // Optional
    "route_date": "date", // Optional
    "got_points": "number" | null, // Optional. Required if route is in a predefined catalog.
    "notes": "string", // Optional
    "mountain_group_ids": ["uuid"], // Optional, replaces existing
    "catalog_ids": ["uuid"] // Optional, replaces existing
  }
  ```
- **Validation Rules**:
  - `name`: Optional. If provided, must be a non-empty string, max 255 characters.
  - `route_date`: Optional. If provided, must be a valid date in `YYYY-MM-DD` format.
  - `got_points`: Optional. If provided, must be an integer greater than or equal to 0. Required if `catalog_ids` contains a predefined catalog.
  - `notes`: Optional. If provided, must be a string.
  - `mountain_group_ids`: Optional. If provided, must be an array of valid UUIDs corresponding to existing mountain groups.
  - `catalog_ids`: Optional. If provided, must be an array of valid UUIDs corresponding to the user's existing catalogs.
- **Response Payload (200 OK)**: The updated route object.
- **Error Codes**:
  - `400 Bad Request`: Invalid payload data.
  - `401 Unauthorized`: User is not authenticated.
  - `403 Forbidden`: User does not own this route.
  - `404 Not Found`: Route not found.
  - `409 Conflict`: A route with the new name already exists for the user.

#### DELETE `/api/routes/{routeId}`

- **Description**: Permanently delete a route.
- **Success Code**: `204 No Content`.
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.
  - `403 Forbidden`: User does not own this route.
  - `404 Not Found`: Route not found.

---

### 2.4. Mountain Groups

Read-only resource for listing available mountain groups.

#### GET `/api/mountain-groups`

- **Description**: Retrieve a list of all available mountain groups.
- **Response Payload (200 OK)**:
  ```json
  [
    {
      "id": "uuid",
      "name": "string",
      "symbol": "string"
    }
  ]
  ```
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.

---

### 2.5. Analytics

Internal resource for event tracking.
