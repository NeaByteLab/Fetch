import { FetchError } from '@interfaces/index'
import { errorMessages, misc } from '@constants/index'
import { isJsonContentType } from '@utils/index'

/**
 * Error handling utilities.
 * @description Manages error processing, normalization, and data extraction.
 */
export class ErrorHandler {
  /**
   * Normalizes execution errors, converting AbortError to FetchError.
   * @description Converts AbortError instances to FetchError for consistent error handling.
   * @param error - Original error
   * @param fullUrl - Request URL for error context
   * @returns Normalized error result
   */
  static normalizeExecuteError(
    error: unknown,
    fullUrl: string
  ): { success: false; error: unknown } {
    const name: string | undefined = (error as { name?: string } | undefined)?.name
    if (name === misc.ABORT_ERROR_NAME) {
      return {
        success: false,
        error: new FetchError(errorMessages.ABORTED, undefined, error, fullUrl)
      }
    }
    return { success: false, error }
  }

  /**
   * Extracts structured error data from a response.
   * @description Attempts to parse error response body as JSON or text based on content type.
   * @param response - Response to inspect
   * @param url - Request URL for context
   * @returns JSON or text when available; null on failure
   */
  static async getErrorData(response: Response, url: string): Promise<unknown> {
    try {
      const contentType: string | null = response.headers.get('Content-Type')
      if (contentType === null) {
        throw new FetchError(errorMessages.CONTENT_TYPE_NULL, undefined, undefined, url)
      }
      if (isJsonContentType(contentType)) {
        return await response.json()
      }
      return await response.text()
    } catch {
      return null
    }
  }

  /**
   * Creates an HTTP error from response.
   * @description Creates a FetchError with retry-after header if present.
   * @param response - HTTP response
   * @param fullUrl - Request URL
   * @param errorData - Parsed error data
   * @returns FetchError instance
   */
  static createHttpError(response: Response, fullUrl: string, errorData: unknown): FetchError {
    const retryAfter: string | null = response.headers.get('Retry-After')
    const err: FetchError = new FetchError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData,
      fullUrl
    )
    if (retryAfter !== null) {
      ;(err as unknown as { retryAfter?: string }).retryAfter = retryAfter
    }
    return err
  }
}
