import type { FetchRequestBody } from '@interfaces/index'
import { contentTypes, httpMethods, schemes } from '@constants/index'
import { createHeaders } from '@utils/index'

/**
 * Builds an absolute URL from a base and a relative path.
 * @description Returns the input URL if it already includes a scheme.
 * @param url - Target path or absolute URL
 * @param baseURL - Optional base URL used when `url` is relative
 * @returns Absolute URL string
 */
export function buildUrl(url: string, baseURL: string): string {
  if (url.startsWith(schemes.HTTP) || url.startsWith(schemes.HTTPS)) {
    return url
  }
  if (baseURL) {
    const base: string = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
    const endpoint: string = url.startsWith('/') ? url : `/${url}`
    return `${base}${endpoint}`
  }
  return url
}

/**
 * Processes request body and returns body with duplex flag.
 * @description Handles different body types and progress tracking.
 * @param body - Request body to process
 * @param headers - Request headers
 * @param onProgress - Optional progress callback
 * @returns Object with processed body and duplex flag
 */
function processRequestBody(
  body: FetchRequestBody,
  headers: Record<string, string>,
  onProgress?: (percentage: number) => void
): { body: BodyInit; needsDuplex: boolean } {
  if (isValidBodyInit(body)) {
    if (onProgress) {
      return {
        body: createBodyWithProgress(body as BodyInit, onProgress),
        needsDuplex: true
      }
    }
    return { body: body as BodyInit, needsDuplex: false }
  }
  if (typeof body === 'object' && body != null) {
    headers['Content-Type'] ??= contentTypes.APPLICATION_JSON
    const serializedBody: string = serializeObjectBody(body as Record<string, unknown>, headers)
    if (onProgress) {
      return {
        body: createBodyWithProgress(serializedBody, onProgress),
        needsDuplex: true
      }
    }
    return { body: serializedBody, needsDuplex: false }
  }
  const stringBody: string = String(body)
  headers['Content-Type'] ??= contentTypes.TEXT_PLAIN
  if (onProgress) {
    return {
      body: createBodyWithProgress(stringBody, onProgress),
      needsDuplex: true
    }
  }
  return { body: stringBody, needsDuplex: false }
}

/**
 * Creates a RequestInit object for fetch calls.
 * @description Includes method, headers, optional body, and optional abort signal.
 * @param method - HTTP method name
 * @param config - Headers and optional body and signal
 * @param controller - Optional controller to provide a signal
 * @param onProgress - Optional progress callback for uploads
 * @returns RequestInit suitable for fetch
 */
export function buildRequestInit(
  method: string,
  config: {
    headers: Record<string, string>
    signal?: AbortSignal
    body?: FetchRequestBody
  },
  controller?: AbortController,
  onProgress?: (percentage: number) => void
): RequestInit {
  const headers: Record<string, string> = { ...config.headers }
  if (config.body !== undefined) {
    if (config.body instanceof FormData) {
      delete headers['Content-Type']
    } else if (config.body instanceof URLSearchParams) {
      headers['Content-Type'] = contentTypes.APPLICATION_URL_ENCODED
    }
  }
  const requestInit: RequestInit = {
    method,
    headers: createHeaders(headers)
  }
  const methodsWithBody: readonly string[] = [
    httpMethods.POST,
    httpMethods.PUT,
    httpMethods.PATCH
  ] as const
  if (config.body !== undefined && methodsWithBody.includes(method)) {
    const bodyResult: { body: BodyInit; needsDuplex: boolean } = processRequestBody(
      config.body,
      config.headers,
      onProgress
    )
    requestInit.body = bodyResult.body
    if (bodyResult.needsDuplex) {
      ;(requestInit as Record<string, unknown>)['duplex'] = 'half'
    }
  }
  if (config.signal) {
    requestInit.signal = config.signal
  } else if (controller) {
    requestInit.signal = controller.signal
  }
  return requestInit
}

/**
 * Checks whether a value can be used directly as a fetch BodyInit.
 * @description Accepts common body types like FormData, URLSearchParams, Blob, ArrayBuffer, Uint8Array, and string.
 * @param body - Body value to test
 * @returns True if the value is a valid BodyInit
 */
export function isValidBodyInit(body: FetchRequestBody): boolean {
  return (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof Uint8Array ||
    typeof body === 'string'
  )
}

/**
 * Serializes an object to a string body according to headers.
 * @description Respects JSON and URL-encoded content types; defaults to JSON for others.
 * @param body - Object to serialize
 * @param headers - Headers used to determine content type
 * @returns Serialized body string
 */
export function serializeObjectBody(
  body: Record<string, unknown>,
  headers: Record<string, string>
): string {
  const contentType: string | undefined = headers['Content-Type']
  let result: string
  if (contentType === undefined || contentType === contentTypes.APPLICATION_JSON) {
    result = JSON.stringify(body)
  } else if (contentType.includes(contentTypes.APPLICATION_URL_ENCODED)) {
    const params: URLSearchParams = createFormData(body)
    result = params.toString()
  } else if (contentType.includes(contentTypes.TEXT_PLAIN)) {
    result = JSON.stringify(body)
  } else {
    result = JSON.stringify(body)
  }
  return result
}

/**
 * Converts an object to URLSearchParams.
 * @description Serializes values to strings; objects are JSON-stringified.
 * @param body - Source key-value pairs
 * @returns URLSearchParams instance
 */
export function createFormData(body: Record<string, unknown>): URLSearchParams {
  const formData: URLSearchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(body)) {
    if (value !== null && value !== undefined) {
      let stringValue: string
      if (typeof value === 'object') {
        stringValue = JSON.stringify(value)
      } else if (typeof value === 'string') {
        stringValue = value
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        stringValue = String(value)
      } else {
        stringValue = JSON.stringify(value)
      }
      formData.append(key, stringValue)
    }
  }
  return formData
}

/**
 * Calculates total bytes for a body.
 * @description Determines the total size of different body types.
 * @param body - The body to measure
 * @returns Total bytes or 1 for unknown sizes
 */
function calculateBodySize(body: BodyInit): number {
  if (typeof body === 'string') {
    return new TextEncoder().encode(body).length
  }
  if (body instanceof ArrayBuffer) {
    return body.byteLength
  }
  if (body instanceof Uint8Array) {
    return body.length
  }
  if (body instanceof Blob) {
    return body.size
  }
  if (body instanceof FormData || body instanceof URLSearchParams) {
    return 1
  }
  return 1
}

/**
 * Converts body to Uint8Array for streaming.
 * @description Handles different body types and converts them to bytes.
 * @param body - The body to convert
 * @returns Uint8Array representation of the body
 */
function convertBodyToBytes(body: BodyInit): Uint8Array {
  if (typeof body === 'string') {
    return new TextEncoder().encode(body)
  }
  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body)
  }
  if (body instanceof Uint8Array) {
    return body
  }
  let bodyString: string
  if (body instanceof FormData) {
    bodyString = 'FormData'
  } else if (body instanceof URLSearchParams) {
    bodyString = body.toString()
  } else {
    bodyString = typeof body === 'object' ? JSON.stringify(body) : String(body)
  }
  return new TextEncoder().encode(bodyString)
}

/**
 * Creates a body with upload progress tracking.
 * @description Wraps a body in a ReadableStream that tracks upload progress.
 * @param body - The body to wrap
 * @param onProgress - Progress callback function
 * @returns ReadableStream with progress tracking
 */
export function createBodyWithProgress(
  body: BodyInit,
  onProgress: (percentage: number) => void
): ReadableStream<Uint8Array> {
  const totalBytes: number = calculateBodySize(body)
  let uploadedBytes: number = 0
  if (body instanceof Blob) {
    return new ReadableStream<Uint8Array>({
      async start(controller: ReadableStreamDefaultController<Uint8Array>): Promise<void> {
        try {
          const arrayBuffer: ArrayBuffer = await body.arrayBuffer()
          const bytes: Uint8Array = new Uint8Array(arrayBuffer)
          const actualTotalBytes: number = bytes.length
          const chunkSize: number = Math.max(1024, Math.floor(actualTotalBytes / 100))
          for (let i: number = 0; i < bytes.length; i += chunkSize) {
            const chunk: Uint8Array = bytes.slice(i, i + chunkSize)
            controller.enqueue(chunk)
            uploadedBytes += chunk.length
            const percentage: number = Math.round((uploadedBytes / actualTotalBytes) * 100)
            onProgress(Math.min(percentage, 100))
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })
  }
  const bodyBytes: Uint8Array = convertBodyToBytes(body)
  return new ReadableStream<Uint8Array>({
    start(controller: ReadableStreamDefaultController<Uint8Array>): void {
      const chunkSize: number = Math.max(1024, Math.floor(totalBytes / 100))
      for (let i: number = 0; i < bodyBytes.length; i += chunkSize) {
        const chunk: Uint8Array = bodyBytes.slice(i, i + chunkSize)
        controller.enqueue(chunk)
        uploadedBytes += chunk.length
        const percentage: number = Math.round((uploadedBytes / totalBytes) * 100)
        onProgress(Math.min(percentage, 100))
      }
      controller.close()
    }
  })
}
