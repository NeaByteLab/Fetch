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

/**
 * Retry-After header parsing utilities.
 * @description Parses Retry-After header values into milliseconds.
 */
export class RetryAfterParser {
  /**
   * Parses a Retry-After header value into milliseconds.
   * @description Converts Retry-After header (seconds or HTTP date) to delay in milliseconds.
   * @param retryAfter - Retry-After header value
   * @returns Delay in milliseconds, or null if parsing fails
   */
  static parseRetryAfterMs(retryAfter: string): number | null {
    const trimmed: string = retryAfter.trim()
    if (trimmed === '') {
      return null
    }
    const seconds: number = Number(trimmed)
    if (!Number.isNaN(seconds) && seconds >= 0) {
      return Math.floor(seconds * 1000)
    }
    try {
      const date: Date = new Date(trimmed)
      if (Number.isNaN(date.getTime())) {
        return null
      }
      const now: Date = new Date()
      const delayMs: number = date.getTime() - now.getTime()
      return delayMs > 0 ? delayMs : 0
    } catch {
      return null
    }
  }

  /**
   * Honors Retry-After header if present in the error response.
   * @description Checks for Retry-After header in error responses and waits accordingly.
   * @param error - Error that may contain retry-after information
   * @returns True if retry-after was honored, false otherwise
   */
  static async honorRetryAfterIfPresent(error: unknown): Promise<boolean> {
    const retryAfterHeader: string | undefined =
      error instanceof Error && 'retryAfter' in error
        ? (error as { retryAfter?: string }).retryAfter
        : undefined
    if (retryAfterHeader === undefined) {
      return false
    }
    const delayMs: number | null = this.parseRetryAfterMs(retryAfterHeader)
    if (delayMs === null) {
      return false
    }
    await new Promise<void>((resolve: () => void) => setTimeout(resolve, delayMs))
    return true
  }
}

/**
 * Honors Retry-After header if present in the error response.
 * @description Checks for Retry-After header in error responses and waits accordingly.
 * @param error - Error that may contain retry-after information
 * @returns True if retry-after was honored, false otherwise
 */
export async function honorRetryAfterIfPresent(error: unknown): Promise<boolean> {
  return RetryAfterParser.honorRetryAfterIfPresent(error)
}
