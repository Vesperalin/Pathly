/**
 * Custom error classes for the application.
 * These errors can be thrown from service layers and caught in route handlers
 * to provide consistent error responses with appropriate HTTP status codes.
 */

/**
 * Base class for all application errors.
 * Extends the native Error class with additional context.
 */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Thrown when a requested resource is not found.
 * Maps to HTTP 404 Not Found.
 */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super(message);
  }
}

/**
 * Thrown when a user attempts an action they don't have permission for.
 * Maps to HTTP 403 Forbidden.
 */
export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
  }
}

/**
 * Thrown when a request conflicts with existing data (e.g., duplicate name).
 * Maps to HTTP 409 Conflict.
 */
export class ConflictError extends AppError {
  constructor(message = "The request conflicts with existing data.") {
    super(message);
  }
}

/**
 * Thrown when request validation fails or business rules are violated.
 * Maps to HTTP 400 Bad Request.
 */
export class ValidationError extends AppError {
  public details?: unknown;

  constructor(message = "Validation failed.", details?: unknown) {
    super(message);
    this.details = details;
  }
}

/**
 * Thrown when authentication is required but not provided.
 * Maps to HTTP 401 Unauthorized.
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Authentication is required.") {
    super(message);
  }
}
