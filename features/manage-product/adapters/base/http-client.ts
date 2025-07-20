/**
 * HTTP Client Base Utility
 * Shared HTTP functionality for all adapters
 */

import type { ApiError } from '../types/responses'
import { createErrorFromResponse } from '../types/errors'

// Request options interface
export interface RequestOptions extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
}

// Response wrapper interface
export interface HttpResponse<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Headers
}

// Default options
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const DEFAULT_RETRIES = 3
const DEFAULT_RETRY_DELAY = 1000 // 1 second

export class HttpClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(baseUrl: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    }
  }

  /**
   * Generic request method with error handling and retry logic
   */
  async request<T = unknown>(url: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    const {
      timeout = DEFAULT_TIMEOUT,
      retries = DEFAULT_RETRIES,
      retryDelay = DEFAULT_RETRY_DELAY,
      headers = {},
      ...restOptions
    } = options

    const fullUrl = this.baseUrl + url
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    }

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const requestOptions: RequestInit = {
      ...restOptions,
      headers: requestHeaders,
      signal: controller.signal,
    }

    let lastError: Error
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(fullUrl, requestOptions)
        clearTimeout(timeoutId)

        // Handle non-2xx responses
        if (!response.ok) {
          await this.handleErrorResponse(response)
        }

        const data = await this.parseResponse<T>(response)
        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        }
      } catch (error) {
        lastError = error as Error
        clearTimeout(timeoutId)

        // Don't retry on certain errors
        if (this.shouldNotRetry(error as Error)) {
          throw error
        }

        // If this is the last attempt, throw the error
        if (attempt === retries) {
          break
        }

        // Wait before retrying
        await this.delay(retryDelay * Math.pow(2, attempt)) // Exponential backoff
      }
    }

    throw lastError!
  }

  /**
   * GET request
   */
  async get<T = unknown>(url: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    options: RequestOptions = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: this.prepareBody(data, options.headers),
    })
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    options: RequestOptions = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: this.prepareBody(data, options.headers),
    })
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(url: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' })
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let apiError: ApiError | undefined

    try {
      const errorData = await response.json()
      if (errorData.error) {
        apiError = errorData.error
      }
    } catch {
      // Ignore JSON parsing errors
    }

    throw createErrorFromResponse(response, apiError)
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      return response.json()
    }

    if (contentType?.includes('text/')) {
      return response.text() as unknown as T
    }

    // For binary data or no content
    if (response.status === 204) {
      return undefined as unknown as T
    }

    return response.blob() as unknown as T
  }

  /**
   * Prepare request body based on data type and headers
   */
  private prepareBody(data: unknown, headers: HeadersInit = {}): BodyInit | undefined {
    if (!data) return undefined

    // If it's FormData, let fetch handle it
    if (data instanceof FormData) {
      // Remove Content-Type header for FormData to let browser set it with boundary
      if (headers && typeof headers === 'object' && 'Content-Type' in headers) {
        delete (headers as Record<string, string>)['Content-Type']
      }
      return data
    }

    // If it's a Blob or File
    if (data instanceof Blob || data instanceof File) {
      return data
    }

    // If it's a string
    if (typeof data === 'string') {
      return data
    }

    // Default: JSON stringify
    return JSON.stringify(data)
  }

  /**
   * Check if error should not be retried
   */
  private shouldNotRetry(error: Error): boolean {
    // Don't retry validation errors, auth errors, not found, etc.
    if (error.name === 'ValidationError') return true
    if (error.name === 'AuthenticationError') return true
    if (error.name === 'AuthorizationError') return true
    if (error.name === 'NotFoundError') return true
    if (error.name === 'ConflictError') return true

    // Don't retry aborted requests
    if (error.name === 'AbortError') return true

    return false
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Create a default HTTP client instance
export const httpClient = new HttpClient()

// Utility function to create query string
export function createQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })

  return searchParams.toString()
}
