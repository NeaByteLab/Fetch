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
 * Creates a RequestInit object for fetch calls.
 * @description Includes method, headers, optional body, and optional abort signal.
 * @param method - HTTP method name
 * @param config - Headers and optional body and signal
 * @param controller - Optional controller to provide a signal
 * @returns RequestInit suitable for fetch
 */
export function buildRequestInit(
  method: string,
  config: {
    headers: Record<string, string>
    signal?: AbortSignal
    body?: FetchRequestBody
  },
  controller?: AbortController
): RequestInit {
  const requestInit: RequestInit = {
    method,
    headers: createHeaders(config.headers)
  }
  const methodsWithBody: readonly string[] = [
    httpMethods.POST,
    httpMethods.PUT,
    httpMethods.PATCH
  ] as const
  if (config.body !== undefined && methodsWithBody.includes(method)) {
    const reqBody: FetchRequestBody = config.body
    if (isValidBodyInit(reqBody)) {
      requestInit.body = reqBody as BodyInit
      if (requestInit.headers instanceof Headers) {
        requestInit.headers.delete('Content-Type')
      }
    } else if (typeof reqBody === 'object' && reqBody != null) {
      config.headers['Content-Type'] ??= contentTypes.APPLICATION_JSON
      requestInit.body = serializeObjectBody(reqBody as Record<string, unknown>, config.headers)
    } else {
      requestInit.body = String(reqBody)
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
