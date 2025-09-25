/**
 * Response value returned by the client.
 * @description Can be a parsed value, a stream of values, or undefined for no-body responses.
 */
export type FetchResponse<T> = T | AsyncIterable<T> | undefined

/**
 * Supported request body types.
 * @description Includes common text, form, binary, and object payloads.
 */
export type FetchRequestBody =
  | string
  | FormData
  | URLSearchParams
  | Blob
  | ArrayBuffer
  | Uint8Array
  | Record<string, unknown>

/**
 * Options for configuring a request.
 * @description Controls timeouts, retries, headers, base URL, body, streaming, and parsing behavior.
 */
export interface FetchOptions {
  timeout?: number
  retries?: number
  headers?: Record<string, string>
  baseURL?: string
  signal?: AbortSignal
  body?: FetchRequestBody
  stream?: boolean
  download?: boolean
  filename?: string
  responseType?: 'auto' | 'json' | 'text' | 'buffer' | 'blob'
  onProgress?: (percentage: number) => void
}

/**
 * Error thrown for request failures.
 * @description Extends Error with optional status, data, and URL fields.
 */
export class FetchError extends Error {
  status?: number | undefined
  data?: unknown
  url?: string | undefined
  constructor(
    message: string,
    status?: number | undefined,
    data?: unknown,
    url?: string | undefined
  ) {
    super(message)
    this.name = 'FetchError'
    this.status = status
    this.data = data
    this.url = url
  }
}
