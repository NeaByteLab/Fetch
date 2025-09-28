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

import {
  FetchError,
  type ForwarderConfig,
  type ForwarderEndpoint,
  type ForwarderResult,
  type ForwarderExecutor,
  type ForwarderCompletionCallback
} from '@interfaces/index'
import { errorMessages, forwarderDefaults } from '@constants/index'
import { RetryHandler } from '@core/index'
import { isValidURL, honorRetryAfterIfPresent } from '@utils/index'

/**
 * Forwarder handler for sending responses to multiple URLs.
 * @description Provides fire-and-forget response forwarding for logging and data replication.
 */
export class ForwarderHandler {
  /**
   * Validates forwarder configuration.
   * @description Ensures URLs are valid and configuration is complete.
   * @param config - Forwarder configuration to validate
   * @throws {FetchError} On invalid configuration
   */
  static validateForwarderConfig<T = unknown>(config: ForwarderConfig<T>): void {
    if (!config.forwarders?.length || !Array.isArray(config.forwarders)) {
      throw new FetchError(errorMessages.FORWARDER_ENDPOINTS_REQUIRED, undefined, undefined, '')
    }
    for (const forwarder of config.forwarders) {
      if (!isValidURL(forwarder.url)) {
        throw new FetchError(
          `Invalid forwarder endpoint URL: ${forwarder.url}`,
          undefined,
          undefined,
          forwarder.url
        )
      }
    }
  }

  /**
   * Forwards response to multiple URLs.
   * @description Sends response data to all configured URLs in parallel.
   * @param responseData - Response data to forward
   * @param config - Forwarder configuration
   * @param executeRequest - Function to execute individual forward requests
   * @returns Promise that resolves when all forwards are initiated (not completed)
   */
  static forwardResponse<T>(
    responseData: T,
    config: ForwarderConfig<T>,
    executeRequest: ForwarderExecutor
  ): Promise<void> {
    this.validateForwarderConfig(config)
    const forwardPromises: Array<Promise<ForwarderResult>> = config.forwarders.map(
      async (forwarder: ForwarderEndpoint<T>) => {
        try {
          const result: { success: true; data: unknown } | { success: false; error: unknown } =
            await this.executeForwarderWithRetries(forwarder, responseData, executeRequest)
          return {
            endpoint: forwarder.url,
            success: result.success,
            error: result.success ? undefined : result.error
          }
        } catch (error) {
          return {
            endpoint: forwarder.url,
            success: false,
            error
          }
        }
      }
    )
    Promise.allSettled(forwardPromises)
      .then((results: Array<PromiseSettledResult<ForwarderResult>>) => {
        this.logForwarderResults(results)
      })
      .catch((error: unknown) => {
        console.error('[x] Forwarder error logging failed:', error)
      })
    return Promise.resolve()
  }

  /**
   * Forwards response with detailed error handling.
   * @description Sends response data with comprehensive error tracking and optional callback.
   * @param responseData - Response data to forward
   * @param config - Forwarder configuration
   * @param executeRequest - Function to execute individual forward requests
   * @param onComplete - Optional callback for forward completion
   * @returns Promise that resolves when all forwards are initiated
   */
  static forwardResponseWithCallback<T>(
    responseData: T,
    config: ForwarderConfig<T>,
    executeRequest: ForwarderExecutor,
    onComplete?: ForwarderCompletionCallback
  ): Promise<void> {
    this.validateForwarderConfig(config)
    const forwardPromises: Array<Promise<ForwarderResult>> = config.forwarders.map(
      async (forwarder: ForwarderEndpoint<T>) => {
        try {
          const result: { success: true; data: unknown } | { success: false; error: unknown } =
            await this.executeForwarderWithRetries(forwarder, responseData, executeRequest)
          return {
            endpoint: forwarder.url,
            success: result.success,
            error: result.success ? undefined : result.error
          }
        } catch (error) {
          return {
            endpoint: forwarder.url,
            success: false,
            error
          }
        }
      }
    )
    void Promise.allSettled(forwardPromises).then(
      (settledResults: Array<PromiseSettledResult<ForwarderResult>>) => {
        const results: ForwarderResult[] = settledResults.map(
          (result: PromiseSettledResult<ForwarderResult>) =>
            result.status === 'fulfilled'
              ? result.value
              : {
                  endpoint: 'unknown',
                  success: false,
                  error: result.reason
                }
        )
        if (onComplete) {
          onComplete(results)
        } else {
          this.logForwarderResults(settledResults)
        }
      }
    )
    return Promise.resolve()
  }

  /**
   * Logs forwarder execution results.
   * @description Provides logging for forwarder success/failure monitoring.
   * @param results - Settled promise results from forwarder execution
   */
  private static logForwarderResults(results: Array<PromiseSettledResult<ForwarderResult>>): void {
    const successful: number = results.filter(
      (result: PromiseSettledResult<ForwarderResult>) =>
        result.status === 'fulfilled' && result.value.success
    ).length
    const failed: number = results.length - successful
    if (failed > 0) {
      console.warn(`[x] Forwarder: ${successful} successful, ${failed} failed`)
      results.forEach((result: PromiseSettledResult<ForwarderResult>) => {
        if (result.status === 'fulfilled' && !result.value.success) {
          console.warn(`[x] Forwarder failed for ${result.value.endpoint}:`, result.value.error)
        } else if (result.status === 'rejected') {
          console.warn('[x] Forwarder promise rejected:', result.reason)
        }
      })
    }
  }

  /**
   * Executes a single forwarder with retry logic.
   * @description Handles retries, timeouts, and error handling for individual forwarders.
   * @param forwarder - Forwarder endpoint configuration
   * @param responseData - Response data to forward
   * @param executeRequest - Function to execute individual forward requests
   * @returns Success result with data or error
   */
  private static async executeForwarderWithRetries<T>(
    forwarder: ForwarderEndpoint<T>,
    responseData: T,
    executeRequest: ForwarderExecutor
  ): Promise<{ success: true; data: unknown } | { success: false; error: unknown }> {
    const {
      retries = forwarderDefaults.RETRIES,
      timeout = forwarderDefaults.TIMEOUT_MS,
      url,
      method,
      headers,
      body: forwarderBody,
      sslPinning
    }: {
      retries?: number
      timeout?: number
      url: string
      method: string
      headers?: Record<string, string>
      body?:
        | ((originalResponse: T) => unknown)
        | Record<string, unknown>
        | string
        | number
        | boolean
        | null
      sslPinning?: string[]
    } = forwarder
    let body: unknown
    if (typeof forwarderBody === 'function') {
      body = (forwarderBody as (originalResponse: T) => unknown)(responseData)
    } else if (forwarderBody !== undefined) {
      body = forwarderBody
    } else {
      body = responseData
    }
    try {
      const result: unknown = await RetryHandler.executeWithRetries<unknown>(
        url,
        {
          retries,
          timeout,
          download: false
        },
        () => executeRequest(url, method, body, headers, sslPinning),
        honorRetryAfterIfPresent
      )
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error }
    }
  }

  /**
   * Creates forwarder configuration from simple URL array.
   * @description Helper to create forwarder config from URL list.
   * @param urls - Array of URLs to forward to
   * @param method - HTTP method for forwarding (default: POST)
   * @param headers - Optional headers for forwarded requests
   * @returns Forwarder configuration
   */
  static createConfig<T = unknown>(
    urls: string[],
    method: string = forwarderDefaults.METHOD,
    headers?: Record<string, string>,
    timeout?: number,
    retries?: number
  ): ForwarderConfig<T> {
    return {
      forwarders: urls.map((url: string) => ({
        method,
        url,
        ...headers ? { headers } : {},
        ...timeout !== undefined ? { timeout } : {},
        ...retries !== undefined ? { retries } : {}
      }))
    }
  }

  /**
   * Creates forwarder configuration from ForwarderEndpoint array.
   * @description Helper to create forwarder config from ForwarderEndpoint list.
   * @param forwarders - Array of ForwarderEndpoint configurations
   * @returns Forwarder configuration
   */
  static createConfigFromForwarders<T = unknown>(
    forwarders: ForwarderEndpoint<T>[]
  ): ForwarderConfig<T> {
    return {
      forwarders
    }
  }
}
