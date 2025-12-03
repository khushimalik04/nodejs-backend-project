import { ErrorType } from '@/types/error';

/**
 * Custom Error Handler Class
 * Extends the native Error class to include additional properties
 * such as statusCode, errorType, and optional metadata.
 *
 * Provides factory methods for common error types.
 */
export default class ErrorHandler extends Error {
  public readonly statusCode: number;
  public readonly errorType: ErrorType;
  public readonly metadata?: Record<string, unknown>;

  /**
   * Custom Error Handler
   * @param message - Error message
   * @param statusCoErrorHandlerde - HTTP status code
   * @param errorType - Type of error
   * @param metadata - Optional additional data
   */
  constructor(
    message: string,
    statusCode = 500,
    errorType: ErrorType = ErrorType.INTERNAL_SERVER_ERROR,
    metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ErrorHandler';
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.metadata = metadata;
    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods for easy error creation

  /**
   * @param message - Error message
   * @param metadata - Optional additional data
   * @returns ErrorHandler instance for Validation Error
   */
  static ValidationError(message: string, metadata?: Record<string, unknown>) {
    return new ErrorHandler(message, 400, ErrorType.VALIDATION_ERROR, metadata);
  }

  /**
   * @param message - Error message
   * @returns ErrorHandler instance for Authentication Error
   */
  static AuthError(message: string) {
    return new ErrorHandler(message, 401, ErrorType.AUTH_ERROR);
  }

  /**
   * @param message - Error message
   * @returns ErrorHandler instance for Forbidden Error
   */
  static Forbidden(message: string) {
    return new ErrorHandler(message, 403, ErrorType.FORBIDDEN);
  }

  /**
   * @param message - Error message
   * @returns ErrorHandler instance for Not Found Error
   */
  static NotFound(message: string) {
    return new ErrorHandler(message, 404, ErrorType.NOT_FOUND);
  }

  /**
   * @param message - Error message
   * @returns ErrorHandler instance for Conflict Error
   */
  static Conflict(message: string) {
    return new ErrorHandler(message, 409, ErrorType.CONFLICT);
  }

  /**
   * @param message - Error message
   * @returns ErrorHandler instance for Internal Server Error
   */
  static InternalServerError(message: string, metadata?: Record<string, unknown>) {
    return new ErrorHandler(message, 500, ErrorType.INTERNAL_SERVER_ERROR, metadata);
  }

  static ServiceUnavailable(message: string, metadata?: Record<string, unknown>): ErrorHandler {
    return new ErrorHandler(message, 503, ErrorType.SERVICE_UNAVAILABLE, metadata);
  }

  /**
   * @param message - Error message
   * @returns ErrorHandler instance for Database Error
   */
  static DatabaseError(message: string, metadata?: Record<string, unknown>) {
    return new ErrorHandler(message, 500, ErrorType.DATABASE_ERROR, metadata);
  }

  /**
   * @param message - Error message
   * @returns ErrorHandler instance for Bad Request Error
   */
  static BadRequest(message: string) {
    return new ErrorHandler(message, 400, ErrorType.BAD_REQUEST);
  }
}
