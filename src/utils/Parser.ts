import { contentTypes, httpMethods, headers, errorMessages, misc } from '@constants/index'
import { FetchError } from '@interfaces/index'

/**
 * Attempts to parse JSON with fallback to text.
 * @description Tries to parse response as JSON, falls back to text on failure.
 * @param response - Response to parse
 * @returns Parsed data
 */
async function parseJsonWithFallback<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T
  } catch (jsonError) {
    try {
      const text: string = await response.text()
      console.warn(
        'Failed to parse JSON, falling back to text:',
        jsonError instanceof Error ? jsonError.message : errorMessages.UNKNOWN_ERROR
      )
      return text as T
    } catch (textError) {
      console.warn('Failed to parse response as JSON or text:', {
        jsonError: jsonError instanceof Error ? jsonError.message : errorMessages.UNKNOWN_ERROR,
        textError: textError instanceof Error ? textError.message : errorMessages.UNKNOWN_ERROR
      })
      return undefined as T
    }
  }
}

/**
 * Parses a response by inspecting its content type.
 * @description Returns JSON, text, or ArrayBuffer based on the `Content-Type` header.
 * @param response - The response to parse
 * @param url - Optional request URL for contextual error messages
 * @returns Parsed response data
 */
export async function parseResponse<T>(response: Response): Promise<T> {
  const contentType: string | null = response.headers.get(headers.CONTENT_TYPE)
  if (contentType === null) {
    try {
      return (await response.text()) as T
    } catch {
      const arrayBuffer: ArrayBuffer = await response.arrayBuffer()
      return Object.assign(arrayBuffer, { length: arrayBuffer.byteLength }) as T
    }
  }
  if (contentType.includes(contentTypes.APPLICATION_JSON)) {
    return (await response.json()) as T
  }
  if (contentType.includes(contentTypes.TEXT_PREFIX)) {
    return (await response.text()) as T
  }
  const arrayBuffer: ArrayBuffer = await response.arrayBuffer()
  return Object.assign(arrayBuffer, { length: arrayBuffer.byteLength }) as T
}

/**
 * Checks if a content type represents JSON.
 * @description Looks for a JSON content type prefix.
 * @param contentType - Content type header value
 * @returns True if JSON content type
 */
export function isJsonContentType(contentType: string | null): boolean {
  return contentType?.includes(contentTypes.APPLICATION_JSON) === true
}

/**
 * Checks if a content type represents text.
 * @description Looks for a text content type prefix.
 * @param contentType - Content type header value
 * @returns True if text content type
 */
export function isTextContentType(contentType: string | null): boolean {
  return contentType?.includes(contentTypes.TEXT_PREFIX) === true
}

/**
 * Parses a response using its content type and method.
 * @description Returns undefined for methods without bodies, otherwise parses JSON, text, or ArrayBuffer.
 * @param response - The response to parse
 * @param contentType - Content type header value
 * @param method - Optional HTTP method
 * @returns Parsed response data
 */
export async function parseByContentType<T>(
  response: Response,
  contentType: string | null,
  method?: string
): Promise<T> {
  if (method === httpMethods.HEAD) {
    return undefined as T
  }
  if (isJsonContentType(contentType)) {
    return parseJsonWithFallback<T>(response)
  }
  if (isTextContentType(contentType)) {
    return (await response.text()) as T
  }
  const buffer: ArrayBuffer = await response.arrayBuffer()
  return Object.assign(buffer, { length: buffer.byteLength }) as T
}

/**
 * Parses a response based on an explicit response type or content negotiation.
 * @description Honors a requested response type when provided, otherwise infers from content type and method.
 * @param response - The response to parse
 * @param config - Parsing configuration containing the response type
 * @param method - Optional HTTP method
 * @returns Parsed response data
 */
export async function parseResponseByType<T>(
  response: Response,
  config: {
    responseType: 'auto' | 'json' | 'text' | 'buffer' | 'blob'
  },
  method?: string
): Promise<T> {
  const contentType: string | null = response.headers.get(headers.CONTENT_TYPE)
  if (method === httpMethods.HEAD) {
    return undefined as T
  }
  if (config.responseType !== 'auto') {
    switch (config.responseType) {
      case 'json':
        return parseJsonWithFallback<T>(response)
      case 'text':
        return (await response.text()) as T
      case 'buffer': {
        const buffer: ArrayBuffer = await response.arrayBuffer()
        return Object.assign(buffer, { length: buffer.byteLength }) as T
      }
      case 'blob':
        return (await response.blob()) as T
      default:
        return parseResponse<T>(response)
    }
  }
  return parseByContentType<T>(response, contentType, method)
}

/**
 * Parses a response while tracking download progress.
 * @description Aggregates streamed chunks, reports progress when total size is known, and then parses the rebuilt response.
 * @param response - The response to parse with progress
 * @param config - Optional progress callback configuration
 * @param url - Request URL used for subsequent parsing
 * @param method - Optional HTTP method
 * @returns Parsed response data
 */
export async function parseResponseWithProgressTracking<T>(
  response: Response,
  config: {
    onProgress?: (percentage: number) => void
  },
  url: string,
  method?: string
): Promise<T> {
  const contentLength: string | null = response.headers.get(headers.CONTENT_LENGTH)
  const total: number =
    contentLength !== null
      ? ((): number => {
          const parsed: number = parseInt(contentLength, 10)
          return Number.isNaN(parsed) ? 0 : parsed
        })()
      : 0
  if (response.body === null) {
    return parseResponseByType<T>(response, { responseType: 'auto' }, method)
  }
  const reader: ReadableStreamDefaultReader<Uint8Array> = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received: number = 0
  try {
    while (true) {
      const { done, value }: { done: boolean; value: Uint8Array | undefined } = await reader.read()
      if (done) {
        break
      }
      if (value !== undefined) {
        chunks.push(value)
        received += value.length
      }
      if (received > misc.MAX_NDJSON_BUFFER_BYTES) {
        throw new FetchError(errorMessages.RESPONSE_TOO_LARGE, undefined, undefined, url)
      }
      if (total > 0 && config.onProgress !== undefined) {
        const percentage: number = Math.round((received / total) * 100)
        config.onProgress(percentage)
      }
    }
    if (chunks.length === 0) {
      return await parseResponseByType<T>(response, { responseType: 'auto' }, method)
    }
    const buffer: ArrayBuffer = new ArrayBuffer(received)
    const allChunks: Uint8Array = new Uint8Array(buffer)
    let position: number = 0
    for (const chunk of chunks) {
      allChunks.set(chunk, position)
      position += chunk.length
    }
    const blob: Blob = new Blob([buffer], {
      type: response.headers.get(headers.CONTENT_TYPE) ?? contentTypes.APPLICATION_OCTET_STREAM
    })
    const newResponse: Response = new Response(blob, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    })
    return await parseResponseByType<T>(newResponse, { responseType: 'auto' }, method)
  } finally {
    reader.releaseLock()
  }
}

/**
 * Parses a response, optionally reporting progress.
 * @description Uses progress tracking when a callback is provided, otherwise parses based on the requested response type.
 * @param response - The response to parse
 * @param config - Response type and optional progress callback
 * @param url - Request URL for parsing context
 * @param method - Optional HTTP method
 * @returns Parsed response data
 */
export async function parseResponseWithProgress<T>(
  response: Response,
  config: {
    responseType: 'auto' | 'json' | 'text' | 'buffer' | 'blob'
    onProgress?: (percentage: number) => void
  },
  url: string,
  method?: string
): Promise<T> {
  if (config.onProgress) {
    return parseResponseWithProgressTracking<T>(
      response,
      { onProgress: config.onProgress },
      url,
      method
    )
  }
  return parseResponseByType<T>(response, { responseType: config.responseType }, method)
}

/**
 * Parses an error response for better error handling.
 * @description Attempts to parse error response as JSON or text for detailed error information.
 * @param response - The error response to parse
 * @param url - Request URL for error context
 * @returns Parsed error data or null if parsing fails
 */
export async function parseErrorResponse(response: Response): Promise<unknown> {
  try {
    const contentType: string | null = response.headers.get(headers.CONTENT_TYPE)
    if (contentType === null) {
      return null
    }
    if (isJsonContentType(contentType)) {
      return await response.json()
    }
    return await response.text()
  } catch {
    return null
  }
}
