/**
 * @license
 * Copyright 2025 NeaByteLab
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { FetchError } from '@interfaces/index'
import { errorMessages, misc } from '@constants/index'
import { parseErrorResponse } from '@utils/index'

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
  static async getErrorData(response: Response): Promise<unknown> {
    return parseErrorResponse(response)
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
