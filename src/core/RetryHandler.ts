import { FetchError, type FetchResponse } from '@interfaces/index'
import { errorMessages } from '@constants/index'
import { shouldRetry, waitForRetry } from '@utils/index'

/**
 * Retry handling utilities.
 * @description Manages request retries with exponential backoff and retry-after headers.
 */
export class RetryHandler {
  /**
   * Executes a request with retry logic.
   * @description Handles retries, retry-after headers, and exponential backoff.
   * @param fullUrl - Fully built URL
   * @param config - Request configuration
   * @param executeRequest - Function to execute the actual request
   * @param honorRetryAfter - Function to honor retry-after headers
   * @returns Parsed response
   * @throws {FetchError} On final failure after all retries
   */
  static async executeWithRetries<T>(
    fullUrl: string,
    config: {
      retries: number
      timeout: number
      download: boolean
      filename?: string
    },
    executeRequest: () => Promise<{ success: true; data: T } | { success: false; error: unknown }>,
    honorRetryAfter: (error: unknown) => Promise<boolean>
  ): Promise<FetchResponse<T>> {
    let lastError: unknown = null
    for (let attempt: number = 0; attempt <= config.retries; attempt++) {
      const result: { success: true; data: T } | { success: false; error: unknown } =
        await executeRequest()
      if (result.success) {
        return result.data
      }
      lastError = result.error
      if (shouldRetry(result.error, attempt, config.retries)) {
        const honored: boolean = await honorRetryAfter(result.error)
        if (honored) {
          continue
        }
        await waitForRetry(attempt)
        continue
      }
      break
    }
    if (lastError instanceof FetchError) {
      throw lastError
    }
    throw new FetchError(
      lastError instanceof Error ? lastError.message : errorMessages.UNKNOWN_ERROR,
      undefined,
      lastError,
      fullUrl
    )
  }
}
