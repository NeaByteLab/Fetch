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
  type AuthConfig,
  type FetchOptions,
  type FetchRequestBody,
  type FetchResponse,
  type FetchResponseType,
  type ForwarderConfig,
  type ForwarderEndpoint
} from '@interfaces/index'
import { contentTypes, defaults, errorMessages, headers, httpMethods } from '@constants/index'
import {
  BalancerHandler,
  buildRequestInit,
  buildUrl,
  ErrorHandler,
  ForwarderHandler,
  handleDownload,
  RetryHandler,
  StreamHandler
} from '@core/index'
import {
  ExtractSSL,
  cleanupController,
  createTimeoutController,
  createAuthHeaders,
  honorRetryAfterIfPresent,
  parseResponseWithProgress,
  CookieJar
} from '@utils/index'

/**
 * HTTP client with retries, timeouts, streaming, and optional download support.
 * @description Provides static convenience methods for common HTTP verbs and a configurable request pipeline.
 */
export default class FetchClient {
  /** Cookie jar for storing and managing cookies */
  private static readonly _cookieJar: CookieJar = new CookieJar()
  /** Default configuration for the FetchClient */
  private static readonly defaultConfig: {
    timeout: number
    retries: number
    headers: Record<string, string>
    baseURL: string
    stream: boolean
    download: boolean
    filename?: string
    responseType: 'auto' | 'json' | 'text' | 'buffer' | 'blob'
    onProgress?: (percentage: number) => void
    sslPinning?: string[]
  } = {
    timeout: defaults.TIMEOUT_MS,
    retries: defaults.RETRIES,
    headers: {
      'Content-Type': contentTypes.APPLICATION_JSON
    },
    baseURL: defaults.BASE_URL,
    stream: defaults.STREAM,
    download: defaults.DOWNLOAD,
    responseType: defaults.RESPONSE_TYPE
  }

  /**
   * Sends a GET request.
   * @description Makes a GET request to the specified URL with optional configuration.
   * @param url - Target URL or path
   * @param options - Request configuration
   * @returns Parsed response
   */
  static async get<T = unknown>(
    url: string,
    options: FetchOptions = {}
  ): Promise<FetchResponse<T> | FetchResponse<T[]>> {
    return this.request<T>(httpMethods.GET, url, options)
  }

  /**
   * Sends a POST request.
   * @description Makes a POST request with optional body to the specified URL.
   * @param url - Target URL or path
   * @param body - Optional request body
   * @param options - Request configuration
   * @returns Parsed response
   */
  static async post<T = unknown>(
    url: string,
    body?: FetchRequestBody,
    options: FetchOptions = {}
  ): Promise<FetchResponse<T> | FetchResponse<T[]>> {
    return this.request<T>(httpMethods.POST, url, this.createRequestOptions(options, body))
  }

  /**
   * Sends a PUT request.
   * @description Makes a PUT request with optional body to the specified URL.
   * @param url - Target URL or path
   * @param body - Optional request body
   * @param options - Request configuration
   * @returns Parsed response
   */
  static async put<T = unknown>(
    url: string,
    body?: FetchRequestBody,
    options: FetchOptions = {}
  ): Promise<FetchResponse<T> | FetchResponse<T[]>> {
    return this.request<T>(httpMethods.PUT, url, this.createRequestOptions(options, body))
  }

  /**
   * Sends a PATCH request.
   * @description Makes a PATCH request with optional body to the specified URL.
   * @param url - Target URL or path
   * @param body - Optional request body
   * @param options - Request configuration
   * @returns Parsed response
   */
  static async patch<T = unknown>(
    url: string,
    body?: FetchRequestBody,
    options: FetchOptions = {}
  ): Promise<FetchResponse<T> | FetchResponse<T[]>> {
    return this.request<T>(httpMethods.PATCH, url, this.createRequestOptions(options, body))
  }

  /**
   * Sends a DELETE request.
   * @description Makes a DELETE request to the specified URL.
   * @param url - Target URL or path
   * @param options - Request configuration
   * @returns Parsed response
   */
  static async delete<T = unknown>(
    url: string,
    options: FetchOptions = {}
  ): Promise<FetchResponse<T> | FetchResponse<T[]>> {
    return this.request<T>(httpMethods.DELETE, url, options)
  }

  /**
   * Sends a HEAD request.
   * @description Makes a HEAD request to the specified URL.
   * @param url - Target URL or path
   * @param options - Request configuration
   * @returns Parsed response
   */
  static async head<T = unknown>(
    url: string,
    options: FetchOptions = {}
  ): Promise<FetchResponse<T> | FetchResponse<T[]>> {
    return this.request<T>(httpMethods.HEAD, url, options)
  }

  /**
   * Sends an OPTIONS request.
   * @description Makes an OPTIONS request to the specified URL.
   * @param url - Target URL or path
   * @param options - Request configuration
   * @returns Parsed response
   */
  static async options<T = unknown>(
    url: string,
    options: FetchOptions = {}
  ): Promise<FetchResponse<T> | FetchResponse<T[]>> {
    return this.request<T>(httpMethods.OPTIONS, url, options)
  }

  /**
   * Sends a TRACE request.
   * @description Makes a TRACE request to the specified URL.
   * @param url - Target URL or path
   * @param options - Request configuration
   * @returns Parsed response
   */
  static async trace<T = unknown>(
    url: string,
    options: FetchOptions = {}
  ): Promise<FetchResponse<T> | FetchResponse<T[]>> {
    return this.request<T>(httpMethods.TRACE, url, options)
  }

  /**
   * Creates request options with an optional body.
   * @description Merges base options with optional body for request configuration.
   * @param options - Base options
   * @param body - Optional body to include
   * @returns Merged options
   */
  private static createRequestOptions(
    options: FetchOptions,
    body?: FetchRequestBody
  ): FetchOptions {
    const bodyPart: Partial<Pick<FetchOptions, 'body'>> = body !== undefined ? { body } : {}
    return { ...options, ...bodyPart }
  }

  /**
   * Core request pipeline with validation, retries, and response parsing.
   * @description Handles the complete request lifecycle including validation, retries, and response parsing.
   * @param method - HTTP method
   * @param url - Target URL or path
   * @param options - Request configuration
   * @returns Parsed response
   * @throws {FetchError} On invalid input or when the request ultimately fails
   */
  private static async request<T = unknown>(
    method: string,
    url: string,
    options: FetchOptions = {}
  ): Promise<FetchResponse<T> | FetchResponse<T[]>> {
    if (typeof url !== 'string' || url.trim() === '') {
      throw new FetchError(errorMessages.URL_INVALID, undefined, undefined, url)
    }
    const config: typeof FetchClient.defaultConfig & {
      signal?: AbortSignal
      body?: FetchRequestBody
      auth?: AuthConfig
      balancer?: { endpoints: string[]; strategy: 'fastest' | 'parallel' }
      forwarder?: ForwarderEndpoint<T>[]
      sslPinning?: string[]
      maxRate?: number
      withCookies?: boolean
    } = {
      ...this.defaultConfig,
      ...options
    }
    if (config.retries < 0) {
      throw new FetchError(errorMessages.RETRIES_NON_NEGATIVE, undefined, undefined, url)
    }
    if (config.timeout < 0) {
      throw new FetchError(errorMessages.TIMEOUT_NON_NEGATIVE, undefined, undefined, url)
    }
    if (config.download && (config.filename === undefined || config.filename.trim() === '')) {
      throw new FetchError(errorMessages.FILENAME_REQUIRED, undefined, undefined, url)
    }
    if (config.balancer) {
      const response: FetchResponse<T> | FetchResponse<T[]> = await this.executeWithBalancer<T>(
        method,
        url,
        config as typeof config & {
          balancer: { endpoints: string[]; strategy: 'fastest' | 'parallel' }
          forwarder?: ForwarderEndpoint<T>[]
        }
      )
      if (config.forwarder && config.forwarder.length > 0) {
        ForwarderHandler.validateForwarderConfig({ forwarders: config.forwarder })
        await this.forwardResponse<T>(
          response as T,
          config as typeof config & {
            forwarder: ForwarderEndpoint<T>[]
          }
        )
      }
      return response
    }
    const fullUrl: string = buildUrl(url, config.baseURL)
    if (config.auth !== undefined) {
      const authHeaders: Record<string, string> = createAuthHeaders(config.auth)
      config.headers = { ...config.headers, ...authHeaders }
    }
    const response: FetchResponse<T> = await RetryHandler.executeWithRetries<T>(
      fullUrl,
      {
        retries: config.retries,
        timeout: config.timeout,
        download: config.download,
        ...config.filename !== undefined ? { filename: config.filename } : {}
      },
      () => this.executeRequest<T>(method, fullUrl, config),
      honorRetryAfterIfPresent
    )
    if (config.forwarder && config.forwarder.length > 0) {
      ForwarderHandler.validateForwarderConfig({ forwarders: config.forwarder })
      await this.forwardResponse<T>(
        response as T,
        config as typeof config & {
          forwarder: ForwarderEndpoint<T>[]
        }
      )
    }
    return response
  }

  /**
   * Gets the cookie jar instance for testing and inspection.
   * @description Provides access to the internal cookie jar for testing purposes.
   * @returns The cookie jar instance
   */
  static get cookieJar(): CookieJar {
    return this._cookieJar
  }

  /**
   * Processes Set-Cookie headers from response.
   * @description Handles multiple Set-Cookie headers with fallback.
   * @param response - Response containing Set-Cookie headers
   */
  private static processSetCookieHeaders(response: Response): void {
    const setCookieHeaders: string[] = response.headers.getSetCookie?.() ?? []
    if (setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((setCookieHeader: string) => {
        this._cookieJar.parseSetCookie(setCookieHeader)
      })
    } else {
      const setCookieHeader: string | null = response.headers.get('Set-Cookie')
      if (setCookieHeader !== null && setCookieHeader !== '') {
        this._cookieJar.parseSetCookie(setCookieHeader)
      }
    }
  }

  /**
   * Handles cookie configuration for browser environment.
   * @description Sets credentials to include for automatic cookie handling and processes Set-Cookie headers.
   * @param fetchOptions - Request options to modify
   * @param withCookies - Whether to enable cookies
   * @param response - Response to process for Set-Cookie headers
   */
  private static handleBrowserCookies(
    fetchOptions: RequestInit,
    withCookies: boolean,
    response?: Response
  ): void {
    if (withCookies === true && typeof globalThis.window !== 'undefined') {
      fetchOptions.credentials = 'include'
      if (response) {
        this.processSetCookieHeaders(response)
      }
    }
  }

  /**
   * Handles cookie configuration for Node.js environment.
   * @description Adds Cookie header and processes Set-Cookie response headers.
   * @param fetchOptions - Request options to modify
   * @param withCookies - Whether to enable cookies
   * @param response - Response to process for Set-Cookie headers
   */
  private static handleNodeCookies(
    fetchOptions: RequestInit,
    withCookies: boolean,
    response?: Response
  ): void {
    if (withCookies === true && typeof globalThis.window === 'undefined') {
      if (response) {
        this.processSetCookieHeaders(response)
      } else {
        const cookieHeader: string = this._cookieJar.getCookies()
        if (cookieHeader !== '') {
          fetchOptions.headers = { ...fetchOptions.headers, Cookie: cookieHeader }
        }
      }
    }
  }

  /**
   * Executes a single HTTP request attempt.
   * @description Performs a single HTTP request with timeout, error handling, and response processing.
   * @param method - HTTP method to use
   * @param fullUrl - Fully built URL for the request
   * @param config - Request configuration including cookies, SSL pinning, and other options
   * @returns Promise resolving to success with data or failure with error
   */
  private static async executeRequest<T>(
    method: string,
    fullUrl: string,
    config: typeof FetchClient.defaultConfig & {
      signal?: AbortSignal
      body?: FetchRequestBody
      sslPinning?: string[]
      maxRate?: number
      withCookies?: boolean
    }
  ): Promise<{ success: true; data: T } | { success: false; error: unknown }> {
    let controller: ReturnType<typeof createTimeoutController> | undefined
    try {
      if (!config.signal) {
        controller = createTimeoutController(config.timeout)
      }
      if (config.sslPinning && config.sslPinning.length > 0) {
        await ExtractSSL.validate(fullUrl, config.sslPinning)
      }
      const fetchOptions: RequestInit = buildRequestInit(
        method,
        config,
        controller,
        config.onProgress
      )
      this.handleBrowserCookies(fetchOptions, config.withCookies ?? false)
      this.handleNodeCookies(fetchOptions, config.withCookies ?? false)
      const response: Response = await globalThis.fetch(fullUrl, fetchOptions)
      this.handleBrowserCookies(fetchOptions, config.withCookies ?? false, response)
      this.handleNodeCookies(fetchOptions, config.withCookies ?? false, response)
      if (controller) {
        cleanupController(controller)
      }
      if (!response.ok) {
        const errorData: unknown = await ErrorHandler.getErrorData(response)
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
        throw err
      }
      if (config.stream) {
        const stream: AsyncIterable<T> = StreamHandler.createStreamIterator<T>(response, fullUrl)
        return { success: true, data: stream as T }
      }
      if (config.download) {
        return await this.handleDownloadResponse<T>(response, config)
      }
      if (method === httpMethods.HEAD || method === httpMethods.OPTIONS) {
        const headers: Record<string, string> = {}
        response.headers.forEach((value: string, key: string) => {
          headers[key] = value
        })
        return {
          success: true,
          data: {
            status: response.status,
            statusText: response.statusText,
            headers,
            url: response.url,
            ok: response.ok
          } as T
        }
      }
      type ParseConfig = {
        responseType: FetchResponseType
      } & Partial<{ onProgress: (percentage: number) => void }>
      const parseConfig: ParseConfig = { responseType: config.responseType }
      if (config.onProgress !== undefined) {
        parseConfig.onProgress = config.onProgress
      }
      const data: T = await parseResponseWithProgress<T>(response, parseConfig, fullUrl, method)
      return { success: true, data }
    } catch (error) {
      if (controller) {
        cleanupController(controller)
      }
      return ErrorHandler.normalizeExecuteError(error, fullUrl)
    }
  }

  /**
   * Handles download response processing.
   * @description Processes download configuration and returns download information.
   * @param response - The response to process
   * @param config - Download configuration
   * @returns Download information result
   */
  private static async handleDownloadResponse<T>(
    response: Response,
    config: typeof FetchClient.defaultConfig & {
      filename?: string
      maxRate?: number
      onProgress?: (percentage: number) => void
    }
  ): Promise<{ success: true; data: T }> {
    const downloadConfig: {
      filename?: string
      maxRate?: number
      onProgress?: (percentage: number) => void
    } = {}
    if (config.filename !== undefined) {
      downloadConfig.filename = config.filename
    }
    if (config.maxRate !== undefined) {
      downloadConfig.maxRate = config.maxRate
    }
    if (config.onProgress !== undefined) {
      downloadConfig.onProgress = config.onProgress
    }
    await handleDownload(response, downloadConfig)
    const contentLength: string | null = response.headers.get(headers.CONTENT_LENGTH)
    const contentType: string | null = response.headers.get(headers.CONTENT_TYPE)
    const downloadInfo: {
      filename: string
      size: number
      type: string
      status: number
      ok: boolean
    } = {
      filename: config.filename ?? 'download',
      size: contentLength !== null ? parseInt(contentLength, 10) : 0,
      type: contentType ?? 'application/octet-stream',
      status: response.status,
      ok: response.ok
    }
    return { success: true, data: downloadInfo as T }
  }

  /**
   * Executes request with load balancing.
   * @description Routes request across multiple endpoints using balancer configuration.
   * @param method - HTTP method
   * @param url - Request URL
   * @param config - Request configuration with balancer
   * @returns Load balanced response
   */
  private static async executeWithBalancer<T>(
    method: string,
    url: string,
    config: typeof FetchClient.defaultConfig & {
      signal?: AbortSignal
      body?: FetchRequestBody
      auth?: AuthConfig
      balancer: { endpoints: string[]; strategy: 'fastest' | 'parallel' }
      forwarder?: ForwarderEndpoint<T>[]
    }
  ): Promise<FetchResponse<T> | FetchResponse<T[]>> {
    const { balancer, ...baseConfig }: typeof config = config
    const response: FetchResponse<T> | FetchResponse<T[]> =
      await BalancerHandler.executeWithBalancer(
        url,
        balancer,
        async (
          fullUrl: string
        ): Promise<{ success: true; data: T } | { success: false; error: unknown }> => {
          try {
            const balancerConfig: typeof baseConfig = { ...baseConfig }
            if (balancerConfig.auth !== undefined) {
              const authHeaders: Record<string, string> = createAuthHeaders(balancerConfig.auth)
              balancerConfig.headers = { ...balancerConfig.headers, ...authHeaders }
            }
            const response: FetchResponse<T> = await RetryHandler.executeWithRetries<T>(
              fullUrl,
              {
                retries: baseConfig.retries,
                timeout: baseConfig.timeout,
                download: baseConfig.download,
                ...baseConfig.filename !== undefined ? { filename: baseConfig.filename } : {}
              },
              () => this.executeRequest<T>(method, fullUrl, balancerConfig),
              honorRetryAfterIfPresent
            )
            return { success: true, data: response as T }
          } catch (error) {
            return { success: false, error }
          }
        }
      )
    return response
  }

  /**
   * Forwards response to multiple endpoints.
   * @description Sends response data to all configured forwarder endpoints.
   * @param responseData - Response data to forward
   * @param config - Request configuration with forwarder
   */
  private static async forwardResponse<T>(
    responseData: T,
    config: typeof FetchClient.defaultConfig & {
      signal?: AbortSignal
      body?: FetchRequestBody
      forwarder: ForwarderEndpoint<T>[]
    }
  ): Promise<void> {
    const { forwarder, ...baseConfig }: typeof config = config
    const forwarderConfig: ForwarderConfig<T> =
      ForwarderHandler.createConfigFromForwarders(forwarder)
    await ForwarderHandler.forwardResponse(
      responseData,
      forwarderConfig,
      (
        endpoint: string,
        forwardMethod: string,
        body?: unknown,
        headers?: Record<string, string>,
        sslPinning?: string[]
      ) =>
        this.executeRequest(forwardMethod, endpoint, {
          ...baseConfig,
          body: body as FetchRequestBody,
          headers: headers ?? {},
          ...sslPinning ? { sslPinning } : {}
        })
    )
  }
}
