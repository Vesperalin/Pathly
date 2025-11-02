import { NextResponse } from "next/server";
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "./errors";

/**
 * Handles API errors consistently across all endpoints.
 * Maps custom error types to appropriate HTTP status codes and response formats.
 *
 * @param error - The error that occurred
 * @param defaultStatus - Default HTTP status code if error type is not recognized (default: 500)
 * @returns NextResponse with standardized error format
 */
export function handleApiError(error: unknown, defaultStatus = 500): NextResponse {
  let status = defaultStatus;
  let body: Record<string, unknown> = { error: "An unexpected server error occurred." };

  if (error instanceof ValidationError) {
    status = 400;
    body = { error: "Validation failed.", details: error.details || error.message };
  } else if (error instanceof NotFoundError) {
    status = 404;
    body = { error: "Not found.", message: error.message };
  } else if (error instanceof ForbiddenError) {
    status = 403;
    body = { error: "Forbidden.", message: error.message };
  } else if (error instanceof ConflictError) {
    status = 409;
    body = { error: "Conflict.", message: error.message };
  } else if (error instanceof UnauthorizedError) {
    status = 401;
    body = { error: "Unauthorized.", message: error.message };
  } else if (error instanceof Error) {
    body.message = error.message;
    console.error("API Error:", error); // Dev logging
  } else {
    console.error("Unknown API Error:", error); // Dev logging
  }

  return NextResponse.json(body, { status });
}
