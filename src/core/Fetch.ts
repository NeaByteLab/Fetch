import {
  FetchError,
  type FetchOptions,
  type FetchRequestBody,
  type FetchResponse
} from '@interfaces/index'
import { contentTypes, defaults, errorMessages, headers, httpMethods } from '@constants/index'
import {
  buildUrl,
  buildRequestInit,
  handleDownload,
  StreamHandler,
  ErrorHandler
} from '@core/index'
import {
  createTimeoutController,
  cleanupController,
  waitForRetry,
  shouldRetry,
  parseResponseWithProgress,
  honorRetryAfterIfPresent
} from '@utils/index'

/**
 * HTTP client with retries, timeouts, streaming, and optional download support.
 * @description Provides static convenience methods for common HTTP verbs and a configurable request pipeline.
 */
export default class FetchClient {
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
  ): Promise<FetchResponse<T>> {
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
  ): Promise<FetchResponse<T>> {
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
  ): Promise<FetchResponse<T>> {
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
  ): Promise<FetchResponse<T>> {
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
  ): Promise<FetchResponse<T>> {
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
  ): Promise<FetchResponse<T>> {
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
  ): Promise<FetchResponse<T>> {
    return this.request<T>(httpMethods.OPTIONS, url, options)
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
  ): Promise<FetchResponse<T>> {
    if (typeof url !== 'string' || url.trim() === '') {
      throw new FetchError(errorMessages.URL_INVALID, undefined, undefined, url)
    }
    const config: typeof FetchClient.defaultConfig & {
      signal?: AbortSignal
      body?: FetchRequestBody
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
    const fullUrl: string = buildUrl(url, config.baseURL)
    let lastError: unknown = null
    for (let attempt: number = 0; attempt <= config.retries; attempt++) {
      const result: { success: true; data: T } | { success: false; error: unknown } =
        await this.executeRequest<T>(method, fullUrl, config)
      if (result.success) {
        return result.data
      }
      lastError = result.error
      if (shouldRetry(result.error, attempt, config.retries)) {
        const honored: boolean = await honorRetryAfterIfPresent(result.error)
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

  /**
   * Executes a single HTTP attempt.
   * @description Performs a single HTTP request with timeout, error handling, and response processing.
   * @param method - HTTP method
   * @param fullUrl - Fully built URL
   * @param config - Effective configuration
   * @returns Success flag with data or error
   */
  private static async executeRequest<T>(
    method: string,
    fullUrl: string,
    config: typeof FetchClient.defaultConfig & { signal?: AbortSignal; body?: FetchRequestBody }
  ): Promise<{ success: true; data: T } | { success: false; error: unknown }> {
    let controller: ReturnType<typeof createTimeoutController> | undefined
    try {
      if (!config.signal) {
        controller = createTimeoutController(config.timeout)
      }
      const fetchOptions: RequestInit = buildRequestInit(method, config, controller)
      const response: Response = await globalThis.fetch(fullUrl, fetchOptions)
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
        return { success: true, data: undefined as T }
      }
      type ParseConfig = {
        responseType: 'auto' | 'json' | 'text' | 'buffer' | 'blob'
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
      onProgress?: (percentage: number) => void
    }
  ): Promise<{ success: true; data: T }> {
    const downloadConfig: { filename?: string; onProgress?: (percentage: number) => void } = {}
    if (config.filename !== undefined) {
      downloadConfig.filename = config.filename
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
}
