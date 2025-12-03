/**
 * Enumeration of various error types used in the application.
 *
 * This enum is used to categorize errors and provide more context
 * when handling exceptions.
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE_ERROR = 'DATABASE_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Response structure for API errors.
 * @interface ErrorResponse
 * @property {boolean} success - Indicates failure
 * @property {string} message - Error message
 * @property {ErrorType} type - Type of error
 * @property {string} [stack] - Stack trace (only in development)
 * @property {Object} [metadata] - Additional error metadata (only in development)
 * @property {string} [path] - Request path (only in development)
 * @property {string} [method] - HTTP method (only in development)
 */
export interface ErrorResponse {
  success: boolean;
  message: string;
  type: ErrorType;
  stack?: string;
  metadata?: Record<string, unknown>;
  path?: string;
  method?: string;
}
