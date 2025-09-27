/**
 * Rate limiter for controlling data transfer speed.
 * @description Implements a token bucket algorithm for precise rate limiting.
 */
export class RateLimiter {
  /** Start time of the rate limiter */
  private startTime: number = 0
  /** Transferred bytes of the rate limiter */
  private transferredBytes: number = 0
  /** Token bucket for rate limiting */
  private tokens: number = 0
  /** Maximum tokens in bucket */
  private maxTokens: number = 0
  /** Token refill rate per millisecond */
  private refillRate: number = 0

  /**
   * Creates a new rate limiter instance.
   * @description Initializes rate limiter with current timestamp.
   */
  constructor() {
    this.reset()
  }

  /**
   * Calculates delay needed to maintain target rate using token bucket.
   * @description Uses token bucket algorithm for more accurate rate limiting.
   * @param bytesToTransfer - Number of bytes being transferred
   * @param maxRateBps - Maximum rate in bytes per second
   * @returns Delay in milliseconds
   */
  calculateDelay(bytesToTransfer: number, maxRateBps: number): number {
    if (maxRateBps <= 0) {
      return 0
    }
    const now: number = Date.now()
    const elapsedMs: number = now - this.startTime
    if (this.maxTokens === 0) {
      this.maxTokens = Math.min(maxRateBps / 4, 256)
      this.tokens = this.maxTokens
      this.refillRate = maxRateBps / 1000
    }
    const tokensToAdd: number = elapsedMs * this.refillRate
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
    if (this.tokens >= bytesToTransfer) {
      this.tokens -= bytesToTransfer
      this.transferredBytes += bytesToTransfer
      return 0
    }
    const tokensNeeded: number = bytesToTransfer - this.tokens
    const delayMs: number = tokensNeeded / this.refillRate
    this.tokens = 0
    this.transferredBytes += bytesToTransfer
    return Math.min(delayMs, 2000)
  }

  /**
   * Resets the rate limiter state.
   * @description Clears transfer history and resets timer.
   */
  reset(): void {
    this.startTime = Date.now()
    this.transferredBytes = 0
    this.tokens = 0
    this.maxTokens = 0
    this.refillRate = 0
  }

  /**
   * Applies rate limiting by waiting if necessary.
   * @description Waits for the calculated delay to maintain rate limit.
   * @param bytesToTransfer - Number of bytes being transferred
   * @param maxRateBps - Maximum rate in bytes per second
   * @returns Promise that resolves after appropriate delay
   */
  async throttle(bytesToTransfer: number, maxRateBps: number): Promise<void> {
    const delayMs: number = this.calculateDelay(bytesToTransfer, maxRateBps)
    if (delayMs > 0) {
      await new Promise<void>((resolve: () => void) => setTimeout(resolve, delayMs))
    }
  }
}

/**
 * Creates a rate limiter instance.
 * @description Factory function for creating rate limiter instances.
 * @returns New RateLimiter instance
 */
export function createRateLimiter(): RateLimiter {
  return new RateLimiter()
}
