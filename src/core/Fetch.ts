import type { FetchOptions, FetchRequestBody, FetchResponse } from '@interfaces/index'
import { FetchError } from '@interfaces/index'
import {
  createTimeoutController,
  cleanupController,
  waitForRetry,
  shouldRetry,
  parseResponseWithProgress,
  isJsonContentType
} from '@utils/index'
import { contentTypes, defaults, errorMessages, headers, httpMethods, misc } from '@constants/index'
import { buildUrl, buildRequestInit } from '@core/Builder'
import { handleDownload } from '@core/Blob'

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
        const honored: boolean = await this.honorRetryAfterIfPresent(result.error)
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
   * Honors Retry-After header if present in the error response.
   * @description Checks for Retry-After header in error responses and waits accordingly.
   * @param error - Error that may contain retry-after information
   * @returns True if retry-after was honored, false otherwise
   */
  private static async honorRetryAfterIfPresent(error: unknown): Promise<boolean> {
    const retryAfterHeader: string | undefined =
      error instanceof FetchError
        ? (error as unknown as { retryAfter?: string }).retryAfter
        : undefined
    if (retryAfterHeader === undefined) {
      return false
    }
    const delayMs: number | null = FetchClient.parseRetryAfterMs(retryAfterHeader)
    if (delayMs === null) {
      return false
    }
    await new Promise<void>((resolve: () => void) => setTimeout(resolve, delayMs))
    return true
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
        const errorData: unknown = await this.getErrorData(response, fullUrl)
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
        const stream: AsyncIterable<T> = this.createStreamIterator<T>(response, fullUrl)
        return { success: true, data: stream as T }
      }
      if (config.download) {
        const downloadConfig: { filename?: string; onProgress?: (percentage: number) => void } = {}
        if (config.filename !== undefined) {
          downloadConfig.filename = config.filename
        }
        if (config.onProgress !== undefined) {
          downloadConfig.onProgress = config.onProgress
        }
        await handleDownload(response, downloadConfig)
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
      return this.normalizeExecuteError(error, fullUrl)
    }
  }

  /**
   * Normalizes execution errors, converting AbortError to FetchError.
   * @description Converts AbortError instances to FetchError for consistent error handling.
   * @param error - Original error
   * @param fullUrl - Request URL for error context
   * @returns Normalized error result
   */
  private static normalizeExecuteError(
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
  private static async getErrorData(response: Response, url: string): Promise<unknown> {
    try {
      const contentType: string | null = response.headers.get(headers.CONTENT_TYPE)
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
   * Parses Retry-After header value to milliseconds.
   * @description Converts Retry-After header values (seconds or HTTP dates) to milliseconds.
   * @param retryAfter - Retry-After header value (seconds or HTTP date)
   * @returns Delay in milliseconds or null if invalid
   */
  private static parseRetryAfterMs(retryAfter: string): number | null {
    const seconds: number = Number(retryAfter)
    if (!Number.isNaN(seconds)) {
      return Math.max(0, Math.round(seconds * 1000))
    }
    const dateMs: number = Date.parse(retryAfter)
    if (!Number.isNaN(dateMs)) {
      const delta: number = dateMs - Date.now()
      return delta > 0 ? delta : 0
    }
    return null
  }

  /**
   * Creates an async iterator over a streaming response.
   * @description Creates an async iterator that yields typed chunks from a streaming response.
   * @param response - Source response
   * @param url - Request URL for error context
   * @returns Async iterable yielding typed chunks
   */
  private static createStreamIterator<T>(response: Response, url: string): AsyncIterable<T> {
    const bodyStream: ReadableStream<Uint8Array> | null = response.body
    if (!bodyStream) {
      throw new FetchError('Response body is null', undefined, null, url)
    }
    return {
      async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {
        const reader: ReadableStreamDefaultReader<Uint8Array> = bodyStream.getReader()
        try {
          const contentType: string | null = response.headers.get(headers.CONTENT_TYPE)
          const isJson: boolean = isJsonContentType(contentType)
          const isText: boolean = contentType?.startsWith(contentTypes.TEXT_PREFIX) === true
          if (isJson) {
            yield* FetchClient.iterateNdjson<T>(reader, url)
            return
          }
          if (isText) {
            yield* FetchClient.iterateText<T>(reader)
            return
          }
          yield* FetchClient.iterateBinary<T>(reader)
        } catch (error) {
          throw new FetchError(
            `${errorMessages.STREAM_PARSE_PREFIX}${error instanceof Error ? error.message : errorMessages.UNKNOWN_ERROR}`,
            undefined,
            error,
            url
          )
        } finally {
          reader.releaseLock()
        }
      }
    }
  }

  /**
   * Iterates text chunks from a ReadableStream.
   * @description Yields decoded text chunks from a ReadableStream using TextDecoder.
   * @param reader - Stream reader
   */
  private static async *iterateText<T>(
    reader: ReadableStreamDefaultReader<Uint8Array>
  ): AsyncGenerator<T, void, unknown> {
    const decoder: TextDecoder = new TextDecoder()
    while (true) {
      const { done, value }: { done: boolean; value: Uint8Array | undefined } = await reader.read()
      if (done) {
        break
      }
      if (value !== undefined) {
        const chunk: string = decoder.decode(value, { stream: true })
        if (chunk.length > 0) {
          yield chunk as unknown as T
        }
      }
    }
  }

  /**
   * Iterates NDJSON chunks, yielding parsed JSON objects per line.
   * @description Parses NDJSON stream line by line, yielding complete JSON objects.
   * @param reader - Stream reader
   * @param url - Request URL for error context
   */
  private static async *iterateNdjson<T>(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    url: string
  ): AsyncGenerator<T, void, unknown> {
    const decoder: TextDecoder = new TextDecoder()
    let buffer: string = ''
    while (true) {
      const chunk: string | null = await FetchClient.readDecodedChunk(reader, decoder)
      if (chunk === null) {
        break
      }
      buffer += chunk
      yield* FetchClient.yieldCompleteJsonLines<T>(
        buffer,
        (newBuffer: string) => {
          buffer = newBuffer
        },
        url
      )
    }
    const trimmed: string = buffer.trim()
    if (trimmed.length > 0) {
      yield* FetchClient.safeParseJsonLine<T>(trimmed, url)
    }
  }

  /**
   * Reads and decodes a single stream chunk.
   * @description Reads a chunk from the stream and decodes it to a string.
   * @param reader - Stream reader
   * @param decoder - Text decoder
   * @returns Decoded string or null when complete
   */
  private static async readDecodedChunk(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder
  ): Promise<string | null> {
    const { done, value }: { done: boolean; value: Uint8Array | undefined } = await reader.read()
    if (done) {
      return null
    }
    if (value === undefined) {
      return ''
    }
    return decoder.decode(value, { stream: true })
  }

  /**
   * Yields complete JSON lines from a buffer.
   * @description Processes buffer to yield complete JSON lines, updating buffer state.
   * @param buffer - Accumulated text buffer
   * @param setBuffer - Callback to update buffer after consumption
   * @param url - Request URL for error context
   */
  private static *yieldCompleteJsonLines<T>(
    buffer: string,
    setBuffer: (newBuffer: string) => void,
    url: string
  ): Generator<T, void, unknown> {
    let newlineIndex: number
    while ((newlineIndex = buffer.indexOf(misc.NEWLINE)) !== -1) {
      const line: string = buffer.slice(0, newlineIndex).trim()
      buffer = buffer.slice(newlineIndex + misc.NEWLINE.length)
      setBuffer(buffer)
      if (line.length === 0) {
        continue
      }
      yield* FetchClient.safeParseJsonLine<T>(line, url)
    }
  }

  /**
   * Safely parses a single JSON line.
   * @description Parses a JSON string with error handling, yielding the parsed object.
   * @param line - JSON line string
   * @param url - Request URL for error context
   * @returns Generator yielding the parsed value
   */
  private static *safeParseJsonLine<T>(line: string, url: string): Generator<T, void, unknown> {
    try {
      yield JSON.parse(line) as T
    } catch (error) {
      throw new FetchError(
        `${errorMessages.STREAM_PARSE_PREFIX}${error instanceof Error ? error.message : errorMessages.UNKNOWN_ERROR}`,
        undefined,
        error,
        url
      )
    }
  }

  /**
   * Iterates binary chunks from a ReadableStream.
   * @description Yields raw binary chunks from a ReadableStream as Uint8Array.
   * @param reader - Stream reader
   */
  private static async *iterateBinary<T>(
    reader: ReadableStreamDefaultReader<Uint8Array>
  ): AsyncGenerator<T, void, unknown> {
    while (true) {
      const { done, value }: { done: boolean; value: Uint8Array | undefined } = await reader.read()
      if (done) {
        break
      }
      if (value !== undefined) {
        yield value as unknown as T
      }
    }
  }
}
