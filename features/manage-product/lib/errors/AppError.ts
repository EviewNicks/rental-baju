/**
 * Custom Error Classes and Utilities
 * Provides structured error handling for the application
 */

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Base Application Error Class
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: ErrorCode
  public readonly isOperational: boolean
  public readonly details?: unknown

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    this.details = details

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Validation Error Class
 * Used for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validasi gagal', details?: unknown) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, true, details)
    Object.setPrototypeOf(this, ValidationError.prototype)
  }

  /**
   * Create ValidationError from Zod error
   */
  static fromZodError(zodError: Record<string, unknown>): ValidationError {
    const fieldErrors = (zodError.issues as Array<Record<string, unknown>>)?.map((issue: Record<string, unknown>) => ({
      field: (issue.path as string[]).join('.'),
      message: issue.message as string,
    })) || []

    return new ValidationError('Validasi gagal', fieldErrors)
  }
}

/**
 * Not Found Error Class
 * Used when resources are not found
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource tidak ditemukan', details?: unknown) {
    super(message, 404, ErrorCode.NOT_FOUND, true, details)
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }

  /**
   * Factory method for product not found
   */
  static product(id: string): NotFoundError {
    return new NotFoundError('Produk tidak ditemukan', {
      type: 'Product',
      id,
    })
  }

  /**
   * Factory method for category not found
   */
  static category(id: string): NotFoundError {
    return new NotFoundError('Kategori tidak ditemukan', {
      type: 'Category',
      id,
    })
  }
}

/**
 * Conflict Error Class
 * Used for business logic conflicts (e.g., unique constraints)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: unknown) {
    super(message, 409, ErrorCode.CONFLICT, true, details)
    Object.setPrototypeOf(this, ConflictError.prototype)
  }

  /**
   * Factory method for unique constraint violations
   */
  static uniqueConstraint(field: string, value: string): ConflictError {
    return new ConflictError(`Nilai ${field} "${value}" sudah digunakan`, {
      field,
      value,
    })
  }
}

/**
 * Database Error Class
 * Used for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: unknown) {
    super(message, 500, ErrorCode.DATABASE_ERROR, true, details)
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }

  /**
   * Create DatabaseError from Prisma error
   */
  static fromPrismaError(prismaError: Record<string, unknown>): DatabaseError {
    const { code, meta, message: originalMessage } = prismaError as { code: string; meta?: Record<string, unknown>; message: string }

    // Handle known Prisma error codes
    switch (code) {
      case 'P2002': {
        const fields = (meta?.target as string[]) || []
        return new DatabaseError(
          `Pelanggaran constraint unik pada field: ${fields.join(', ')}`,
          {
            prismaCode: code,
            fields,
            originalMessage,
          }
        )
      }
      case 'P2025':
        return new DatabaseError('Record tidak ditemukan untuk operasi ini', {
          prismaCode: code,
          originalMessage,
        })
      case 'P2003':
        return new DatabaseError('Pelanggaran constraint foreign key', {
          prismaCode: code,
          originalMessage,
        })
      default:
        return new DatabaseError('Kesalahan database', {
          prismaCode: code,
          originalMessage,
        })
    }
  }
}

/**
 * Error Response Interface
 */
export interface ErrorResponse {
  success: false
  error: {
    message: string
    code: ErrorCode
    statusCode: number
    details?: unknown
  }
  requestId?: string
}

/**
 * Format error for API response
 */
export function formatErrorResponse(
  error: Error,
  requestId?: string
): ErrorResponse {
  const isProduction = process.env.NODE_ENV === 'production'

  if (isAppError(error)) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: isProduction ? undefined : error.details,
      },
      ...(requestId && { requestId }),
    }
  }

  // Unknown error - don't expose details in production
  return {
    success: false,
    error: {
      message: isProduction ? 'Internal server error' : error.message,
      code: ErrorCode.INTERNAL_ERROR,
      statusCode: 500,
      details: undefined,
    },
    ...(requestId && { requestId }),
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}