import { FetchError, type TimeoutController } from '@interfaces/index'
import { misc, retryDelays } from '@constants/index'

/**
 * Creates an abort controller with an optional timeout.
 * @description If timeout is greater than zero, schedules an abort after the specified milliseconds.
 * @param timeout - Timeout in milliseconds before aborting. Use 0 to disable.
 * @returns Abort controller that may carry a timeout id.
 */
export function createTimeoutController(timeout: number): TimeoutController {
  const controller: TimeoutController = new AbortController() as TimeoutController
  if (timeout > 0) {
    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
      controller.abort()
    }, timeout)
    controller.timeoutId = timeoutId
  }
  return controller
}

/**
 * Cleans up a controller's pending timeout.
 * @description Clears the timeout on the provided controller if present.
 * @param controller - The controller whose timeout should be cleared.
 * @returns void
 */
export function cleanupController(controller: TimeoutController): void {
  if (controller.timeoutId) {
    clearTimeout(controller.timeoutId)
  }
}

/**
 * Waits using exponential backoff.
 * @description Delays the next retry using base delay multiplied by 2^attempt, capped at a maximum.
 * @param attempt - Zero-based retry attempt index.
 * @param baseDelay - Base delay in milliseconds. Defaults to an internal constant.
 * @returns Promise that resolves after the computed delay.
 */
export function waitForRetry(
  attempt: number,
  baseDelay: number = retryDelays.BASE_DELAY_MS
): Promise<void> {
  const rawDelay: number = Math.min(baseDelay * Math.pow(2, attempt), retryDelays.MAX_DELAY_MS)
  const jitterPercent: number = 0.25
  const lower: number = 1 - jitterPercent
  const upper: number = 1 + jitterPercent
  const jitter: number = lower + (upper - lower) * secureRandomFloat()
  const delay: number = Math.round(rawDelay * jitter)
  return new Promise<void>((resolve: () => void) => setTimeout(resolve, delay))
}

/**
 * Generates a random float between 0 and 1.
 * @description Uses crypto.getRandomValues if available, otherwise a fallback method.
 * @returns Random float value.
 */
function secureRandomFloat(): number {
  const cryptoMaybe: unknown = (globalThis as unknown as { crypto?: unknown }).crypto
  if (
    cryptoMaybe !== undefined &&
    typeof cryptoMaybe === 'object' &&
    typeof (cryptoMaybe as Crypto).getRandomValues === 'function'
  ) {
    const cryptoObj: Crypto = cryptoMaybe as Crypto
    const buf: Uint32Array = new Uint32Array(1)
    cryptoObj.getRandomValues(buf)
    const first: number = buf.at(0) ?? 0
    const value: number = first / 0xffffffff
    return Number.isFinite(value) ? value : 0.5
  }
  const now: number = Date.now()
  const hashed: number = (now ^ (now >>> 3)) & 0xffffffff
  return (hashed % 1000000) / 1000000
}

/**
 * Determines whether a request should be retried.
 * @description Stops retrying when attempts exceed the maximum, on abort errors, or on 4xx HTTP status codes.
 * @param error - The last error encountered.
 * @param attempt - Current attempt index.
 * @param maxRetries - Maximum number of retries allowed.
 * @returns True when another retry should be attempted.
 */
export function shouldRetry(error: unknown, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) {
    return false
  }
  const errorName: string | undefined = (error as { name?: string } | undefined)?.name
  if (
    (error instanceof Error && error.name === misc.ABORT_ERROR_NAME) ||
    errorName === misc.ABORT_ERROR_NAME
  ) {
    return false
  }
  if (
    error instanceof FetchError &&
    (error.data as { name?: string } | undefined)?.name === misc.ABORT_ERROR_NAME
  ) {
    return false
  }
  if (
    error instanceof FetchError &&
    error.status !== undefined &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return false
  }
  return true
}

/**
 * Creates a Headers object from a record.
 * @description Converts a simple key-value map into a Headers instance.
 * @param headers - Key-value pairs representing header names and values.
 * @returns Headers instance.
 */
export function createHeaders(headers: Record<string, string> = {}): Headers {
  return new Headers(headers)
}

/**
 * Re-exports authentication utilities.
 * @description Provides authentication helpers for Basic, Bearer, and API key auth.
 */
export * from '@utils/Auth'

/**
 * Re-exports parsing utilities.
 * @description Provides response parsing helpers from the parser module.
 */
export * from '@utils/Parser'

/**
 * Re-exports retry-after utilities.
 * @description Provides retry-after header parsing utilities.
 */
export * from '@utils/RetryAfter'

/**
 * Re-exports rate limiting utilities.
 * @description Provides rate limiting utilities for transfer speed control.
 */
export * from '@utils/RateLimiter'

/**
 * Re-exports URL validation utilities.
 * @description Provides URL validation utilities from the validator module.
 */
export * from '@utils/Validator'
