/**
 * Adapter Layer Index
 * Centralized exports for all adapters in the Data Access Layer
 */

// Main adapters
export { productAdapter } from './productAdapter'
export { categoryAdapter } from './categoryAdapter' 
export { fileUploadAdapter } from './fileUploadAdapter'

// HTTP utilities
export { HttpClient, httpClient, createQueryString } from './base/http-client'

// Types
export type * from './types/requests'
export type * from './types/responses'
export type * from './types/errors'

// Error classes
export {
  AdapterError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ServerError,
  createErrorFromResponse,
  isAdapterError,
  isNetworkError,
  isValidationError,
  isAuthenticationError,
  isAuthorizationError,
  isNotFoundError,
  isConflictError,
  isServerError,
} from './types/errors'

// Re-export for convenience
import { productAdapter } from './productAdapter'
import { categoryAdapter } from './categoryAdapter'
import { fileUploadAdapter } from './fileUploadAdapter'

export const adapters = {
  product: productAdapter,
  category: categoryAdapter,
  fileUpload: fileUploadAdapter,
} as const

export default adapters