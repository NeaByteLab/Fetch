import {
  FetchError,
  type FetchResponse,
  type BalancerConfig,
  type BalancerResult,
  type BalancerExecutor
} from '@interfaces/index'
import { errorMessages } from '@constants/index'
import { isValidURL } from '@utils/index'

/**
 * Load balancer handler for distributing requests across multiple endpoints.
 * @description Provides load balancing strategies for improved reliability and performance.
 */
export class BalancerHandler {
  /**
   * Validates balancer configuration.
   * @description Ensures endpoints are valid URLs and configuration is complete.
   * @param config - Balancer configuration to validate
   * @throws {FetchError} On invalid configuration
   */
  static validateBalancerConfig(config: BalancerConfig): void {
    if (!config.endpoints?.length || !Array.isArray(config.endpoints)) {
      throw new FetchError(errorMessages.BALANCER_ENDPOINTS_REQUIRED, undefined, undefined, '')
    }
    if (!config.strategy || !['fastest', 'parallel'].includes(config.strategy)) {
      throw new FetchError(errorMessages.BALANCER_STRATEGY_INVALID, undefined, undefined, '')
    }
    for (const endpoint of config.endpoints) {
      if (!isValidURL(endpoint)) {
        throw new FetchError(`Invalid endpoint URL: ${endpoint}`, undefined, undefined, endpoint)
      }
    }
  }

  /**
   * Executes request with load balancing.
   * @description Routes request across multiple endpoints based on strategy.
   * @param method - HTTP method
   * @param url - Request URL (relative to endpoints)
   * @param config - Balancer configuration
   * @param executeRequest - Function to execute individual requests
   * @returns Load balanced response
   * @throws {FetchError} On configuration error or all endpoints failing
   */
  static async executeWithBalancer<T>(
    method: string,
    url: string,
    config: BalancerConfig,
    executeRequest: BalancerExecutor<T>
  ): Promise<FetchResponse<T> | FetchResponse<T[]>> {
    this.validateBalancerConfig(config)
    if (config.strategy === 'fastest') {
      return this.executeFastestStrategy(method, url, config, executeRequest)
    }
    return this.executeParallelStrategy(method, url, config, executeRequest)
  }

  /**
   * Executes fastest strategy - sequential requests, return first successful.
   * @description Tries endpoints sequentially until one succeeds.
   * @param method - HTTP method
   * @param url - Request URL
   * @param config - Balancer configuration
   * @param executeRequest - Function to execute individual requests
   * @returns First successful response
   * @throws {FetchError} If all endpoints fail
   */
  private static async executeFastestStrategy<T>(
    _method: string,
    url: string,
    config: BalancerConfig,
    executeRequest: BalancerExecutor<T>
  ): Promise<FetchResponse<T>> {
    const errors: Array<{ endpoint: string; error: unknown }> = []
    for (const endpoint of config.endpoints) {
      const fullUrl: string = this.buildFullUrl(endpoint, url)
      const result: { success: true; data: T } | { success: false; error: unknown } =
        await executeRequest(fullUrl)
      if (result.success) {
        return result.data
      }
      errors.push({ endpoint, error: result.error })
    }
    const lastError: { endpoint: string; error: unknown } | undefined = errors[errors.length - 1]
    if (lastError?.error instanceof FetchError) {
      throw lastError.error
    }
    throw new FetchError(
      `All ${config.endpoints.length} endpoints failed`,
      undefined,
      errors,
      config.endpoints[0]
    )
  }

  /**
   * Executes parallel strategy - all requests simultaneously, return all responses.
   * @description Sends requests to all endpoints in parallel and returns all responses.
   * @param method - HTTP method
   * @param url - Request URL
   * @param config - Balancer configuration
   * @param executeRequest - Function to execute individual requests
   * @returns Array of all successful responses
   * @throws {FetchError} If all endpoints fail
   */
  private static async executeParallelStrategy<T>(
    _method: string,
    url: string,
    config: BalancerConfig,
    executeRequest: BalancerExecutor<T>
  ): Promise<FetchResponse<T[]>> {
    const promises: Array<Promise<BalancerResult<T>>> = config.endpoints.map(
      async (endpoint: string): Promise<BalancerResult<T>> => {
        const fullUrl: string = this.buildFullUrl(endpoint, url)
        const result: { success: true; data: T } | { success: false; error: unknown } =
          await executeRequest(fullUrl)
        if (result.success) {
          return { success: true, data: result.data, endpoint }
        }
        return { success: false, error: result.error, endpoint }
      }
    )
    const results: BalancerResult<T>[] = await Promise.allSettled(promises).then(
      (settledResults: Array<PromiseSettledResult<BalancerResult<T>>>) =>
        settledResults.map((result: PromiseSettledResult<BalancerResult<T>>) =>
          result.status === 'fulfilled'
            ? result.value
            : { success: false, error: result.reason as unknown, endpoint: 'unknown' }
        )
    )
    const successfulResults: Array<{ success: true; data: T; endpoint: string }> = results.filter(
      (result: BalancerResult<T>): result is { success: true; data: T; endpoint: string } =>
        result.success
    )
    if (successfulResults.length === 0) {
      const errors: Array<{ endpoint: string; error: unknown }> = results
        .filter(
          (
            result: BalancerResult<T>
          ): result is { success: false; error: unknown; endpoint: string } => !result.success
        )
        .map((result: { success: false; error: unknown; endpoint: string }) => ({
          endpoint: result.endpoint,
          error: result.error
        }))
      throw new FetchError(
        `All ${config.endpoints.length} endpoints failed`,
        undefined,
        errors,
        config.endpoints[0]
      )
    }
    const data: T[] = successfulResults.map(
      (result: { success: true; data: T; endpoint: string }) => result.data
    )
    return data as FetchResponse<T[]>
  }

  /**
   * Builds full URL from endpoint and relative path.
   * @description Combines endpoint base URL with relative path.
   * @param endpoint - Base endpoint URL
   * @param url - Relative URL path
   * @returns Full URL
   */
  private static buildFullUrl(endpoint: string, url: string): string {
    const baseUrl: string = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint
    if (!url || url.trim() === '') {
      return baseUrl
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    const path: string = url.startsWith('/') ? url : `/${url}`
    return `${baseUrl}${path}`
  }
}
