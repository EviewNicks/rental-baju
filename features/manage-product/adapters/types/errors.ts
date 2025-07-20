/**
 * Adapter Error Types
 * Error handling types for the Data Access Layer
 */

import type { ApiError, HttpStatus } from './responses'

// Custom error classes for adapter layer
export class AdapterError extends Error {
  public readonly code: string
  public readonly statusCode: HttpStatus
  public readonly details?: Record<string, unknown>

  constructor(
    message: string,
    code: string = 'ADAPTER_ERROR',
    statusCode: HttpStatus = 500,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AdapterError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export class NetworkError extends AdapterError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 0 as HttpStatus)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends AdapterError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AdapterError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AdapterError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AdapterError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND_ERROR', 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AdapterError {
  constructor(message: string = 'Resource conflict') {
    super(message, 'CONFLICT_ERROR', 409)
    this.name = 'ConflictError'
  }
}

export class ServerError extends AdapterError {
  constructor(message: string = 'Internal server error') {
    super(message, 'SERVER_ERROR', 500)
    this.name = 'ServerError'
  }
}

// Error handling utilities
export function createErrorFromResponse(response: Response, apiError?: ApiError): AdapterError {
  const statusCode = response.status as HttpStatus

  if (apiError) {
    switch (apiError.code) {
      case 'VALIDATION_ERROR':
        return new ValidationError(apiError.message, apiError.details)
      case 'UNAUTHORIZED':
        return new AuthenticationError(apiError.message)
      case 'FORBIDDEN':
        return new AuthorizationError(apiError.message)
      case 'NOT_FOUND':
        return new NotFoundError(apiError.message)
      case 'CONFLICT':
        return new ConflictError(apiError.message)
      case 'SERVER_ERROR':
        return new ServerError(apiError.message)
      default:
        return new AdapterError(apiError.message, apiError.code, statusCode, apiError.details)
    }
  }

  // Fallback based on status code
  switch (statusCode) {
    case 400:
      return new ValidationError('Bad request')
    case 401:
      return new AuthenticationError()
    case 403:
      return new AuthorizationError()
    case 404:
      return new NotFoundError()
    case 409:
      return new ConflictError()
    case 500:
      return new ServerError()
    default:
      return new AdapterError(`HTTP ${statusCode}: ${response.statusText}`, 'HTTP_ERROR', statusCode)
  }
}

// Type guards
export function isAdapterError(error: unknown): error is AdapterError {
  return error instanceof AdapterError
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError
}

export function isConflictError(error: unknown): error is ConflictError {
  return error instanceof ConflictError
}

export function isServerError(error: unknown): error is ServerError {
  return error instanceof ServerError
}