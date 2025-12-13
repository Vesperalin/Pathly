# API Endpoint Implementation Plan: `POST /api/routes/gpx-parse`

## 1. Endpoint Overview

This document outlines the implementation plan for the `POST /api/routes/gpx-parse` endpoint. Its purpose is to accept one or more GPX files, parse them to extract key route metrics, and return the aggregated data. This functionality allows users to pre-fill the route creation form by uploading their GPX tracks, streamlining the user experience. The endpoint does not create or modify any database records.

## 2. Request Details

- **HTTP Method**: `POST`
- **URL Structure**: `/api/routes/gpx-parse`
- **Request Payload**: `multipart/form-data`
- **Parameters**:
  - **Required**:
    - `gpxFiles`: A key in the form data containing one or more files. Each file must have a `.gpx` extension and contain valid GPX-formatted XML.

## 3. Used Types

- **Response DTO**: `GpxParseResultDto` from `src/types.ts`.
  ```typescript
  export type GpxParseResultDto = Pick<
    Route,
    "route_date" | "distance" | "total_ascent" | "total_descent" | "duration"
  >;
  ```

## 4. Response Details

- **Success (200 OK)**: Returns a JSON object containing the aggregated route data.
  ```json
  {
    "route_date": "date",
    "distance": "number",
    "total_ascent": "number",
    "total_descent": "number",
    "duration": "number"
  }
  ```
- **Error**: Returns a standard JSON error response with a descriptive message.

## 5. Data Flow

1.  A `POST` request with `multipart/form-data` is sent to `/api/routes/gpx-parse`.
2.  The Next.js Route Handler authenticates the user using the server-side Supabase client.
3.  The handler validates the presence and basic type (`.gpx` extension) of the uploaded files.
4.  If validation passes, the files are passed to a dedicated `GpxParsingService`.
5.  The `GpxParsingService` uses a third-party library (e.g., `gpx-parse`) to process each file in memory.
6.  For each file, it extracts distance, ascent, descent, duration, and trackpoint dates.
7.  The service aggregates the results: sums numerical values and finds the earliest start date.
8.  The aggregated `GpxParseResultDto` is returned to the route handler.
9.  The route handler serializes the DTO into a JSON response and sends it back to the client with a `200 OK` status.

## 6. Security Considerations

- **Authentication**: The route handler must verify that the user is authenticated by checking for a valid session with `createClient` from `@/lib/supabase/server`. Unauthorized requests will be rejected with a `401` status.
- **Input Validation**: Strict validation of the file count and extension (`.gpx`) is required to prevent processing of unintended files. The core content validation will be handled by the XML parser.
- **Denial of Service (DoS)**: Next.js has a built-in request body size limit that mitigates the risk of excessively large file uploads. The chosen GPX parsing library should be vetted for security against XML-based attacks (e.g., XML bombs).
- **Rate Limiting**: To prevent abuse, consider implementing rate limiting on this endpoint in the future if it becomes a target.

## 7. Error Handling

The endpoint will handle errors gracefully and return informative status codes and messages.

- **400 Bad Request**:
  - If the `gpxFiles` key is missing or no files are provided.
  - If any file does not have a `.gpx` extension.
  - If any file contains malformed GPX/XML data and fails to parse.
- **401 Unauthorized**: If the user's session is invalid or missing.
- **500 Internal Server Error**: For any unexpected server-side exceptions during file processing. These errors should be logged using `console.error`.

## 8. Performance Considerations

- **Parsing Library**: The choice of GPX parsing library can impact performance. Select a library that is both efficient and secure.
- **File Size**: The endpoint processes files in memory. While Next.js limits request size, performance may degrade with a large number of files or very large individual files. The processing is synchronous and will block the response until all files are parsed.

## 9. Implementation Steps

1.  **Create Service Directory**: Create a new directory structure `src/features/gpx/services/`.
2.  **Install GPX Parser**: Choose and install a suitable GPX parsing library from npm (e.g., `npm install gpx-parse`).
3.  **Implement `GpxParsingService`**:
    - Create `src/features/gpx/services/gpx-parsing.service.ts`.
    - Define a class or set of functions to handle the parsing logic.
    - Implement the `parseAndAggregate(files: File[]): Promise<GpxParseResultDto>` method.
    - Inside the method, iterate through the files, parse them, handle potential parsing errors, and aggregate the results.
4.  **Create API Route Handler**:
    - Create a new route handler file at `src/app/api/routes/gpx-parse/route.ts`.
    - Implement the `POST` handler function.
5.  **Implement Validation and Auth in Handler**:
    - Add user authentication using the Supabase server client.
    - Extract the files from the `FormData`.
    - Perform validation checks for file presence and `.gpx` extension.
6.  **Integrate Service**:
    - In the route handler, instantiate and call the `GpxParsingService` with the validated files.
    - Wrap the service call in a `try...catch` block to handle both parsing errors (for `400` responses) and unexpected errors (for `500` responses).
7.  **Return Response**:
    - On success, return the `GpxParseResultDto` from the service with a `200 OK` status.
    - On failure, return the appropriate error response with a clear message.
