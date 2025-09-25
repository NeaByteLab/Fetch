import { contentTypes, httpMethods, headers, errorMessages, misc } from '@constants/index'
import { FetchError } from '@interfaces/index'
import FetchClient from '@core/Fetch'

/**
 * Parses a response by inspecting its content type.
 * @description Returns JSON, text, or ArrayBuffer based on the `Content-Type` header.
 * @param response - The response to parse
 * @param url - Optional request URL for contextual error messages
 * @returns Parsed response data
 * @throws {FetchError} When the content type header is missing
 */
export async function parseResponse<T>(response: Response, url: string = 'unknown'): Promise<T> {
  const contentType: string | null = response.headers.get(headers.CONTENT_TYPE)
  if (contentType === null) {
    throw new FetchError(errorMessages.CONTENT_TYPE_NULL, undefined, null, url)
  }
  if (contentType.includes(FetchClient.CONTENT_TYPE_JSON)) {
    return (await response.json()) as T
  }
  if (contentType.includes(contentTypes.TEXT_PREFIX)) {
    return (await response.text()) as T
  }
  const arrayBuffer: ArrayBuffer = await response.arrayBuffer()
  return arrayBuffer as T
}

/**
 * Checks if a content type represents JSON.
 * @description Looks for a JSON content type prefix.
 * @param contentType - Content type header value
 * @returns True if JSON content type
 */
export function isJsonContentType(contentType: string | null): boolean {
  return contentType?.includes(FetchClient.CONTENT_TYPE_JSON) === true
}

/**
 * Checks if a content type represents text.
 * @description Looks for a text content type prefix.
 * @param contentType - Content type header value
 * @returns True if text content type
 */
export function isTextContentType(contentType: string | null): boolean {
  return contentType?.includes(FetchClient.TEXT_CONTENT_TYPE) === true
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
  if (
    method === httpMethods.HEAD ||
    method === httpMethods.OPTIONS ||
    method === httpMethods.DELETE
  ) {
    return undefined as T
  }
  if (isJsonContentType(contentType)) {
    try {
      return (await response.json()) as T
    } catch {
      try {
        const text: string = await response.text()
        return text as T
      } catch {
        return undefined as T
      }
    }
  }
  if (isTextContentType(contentType)) {
    return (await response.text()) as T
  }
  return (await response.arrayBuffer()) as T
}

/**
 * Parses a response based on an explicit response type or content negotiation.
 * @description Honors a requested response type when provided, otherwise infers from content type and method.
 * @param response - The response to parse
 * @param config - Parsing configuration containing the response type
 * @param url - Request URL for fallback parsing
 * @param method - Optional HTTP method
 * @returns Parsed response data
 */
export async function parseResponseByType<T>(
  response: Response,
  config: {
    responseType: 'auto' | 'json' | 'text' | 'buffer' | 'blob'
  },
  url: string,
  method?: string
): Promise<T> {
  const contentType: string | null = response.headers.get(headers.CONTENT_TYPE)
  if (
    method === httpMethods.HEAD ||
    method === httpMethods.OPTIONS ||
    method === httpMethods.DELETE
  ) {
    return undefined as T
  }
  if (config.responseType !== 'auto') {
    switch (config.responseType) {
      case 'json':
        try {
          return (await response.json()) as T
        } catch {
          try {
            const text: string = await response.text()
            return text as T
          } catch {
            return undefined as T
          }
        }
      case 'text':
        return (await response.text()) as T
      case 'buffer':
        return (await response.arrayBuffer()) as T
      case 'blob':
        return (await response.blob()) as T
      default:
        return parseResponse<T>(response, url)
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
  const total: number = contentLength !== null ? parseInt(contentLength, 10) : 0
  if (response.body === null) {
    return parseResponseByType<T>(response, { responseType: 'auto' }, url, method)
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
        throw new FetchError('Response too large', undefined, undefined, url)
      }
      if (total > 0 && config.onProgress !== undefined) {
        const percentage: number = Math.round((received / total) * 100)
        config.onProgress(percentage)
      }
    }
    if (chunks.length === 0) {
      return await parseResponseByType<T>(response, { responseType: 'auto' }, url, method)
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
    return await parseResponseByType<T>(newResponse, { responseType: 'auto' }, url, method)
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
  return parseResponseByType<T>(response, { responseType: config.responseType }, url, method)
}
