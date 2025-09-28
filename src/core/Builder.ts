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

import type { FetchRequestBody } from '@interfaces/index'
import { contentTypes, httpMethods, schemes } from '@constants/index'
import { createHeaders, createRateLimiter } from '@utils/index'

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
 * @param maxRate - Optional maximum rate in bytes per second
 * @param onProgress - Optional progress callback
 * @returns Object with processed body and duplex flag
 */
function processRequestBody(
  body: FetchRequestBody,
  headers: Record<string, string>,
  maxRate?: number,
  onProgress?: (percentage: number) => void
): { body: BodyInit; needsDuplex: boolean } {
  if (isValidBodyInit(body)) {
    if (onProgress) {
      return {
        body: createBodyWithProgress(body as BodyInit, maxRate, onProgress),
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
        body: createBodyWithProgress(serializedBody, maxRate, onProgress),
        needsDuplex: true
      }
    }
    return { body: serializedBody, needsDuplex: false }
  }
  const stringBody: string = String(body)
  headers['Content-Type'] ??= contentTypes.TEXT_PLAIN
  if (onProgress) {
    return {
      body: createBodyWithProgress(stringBody, maxRate, onProgress),
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
    maxRate?: number
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
    httpMethods.PATCH,
    httpMethods.DELETE
  ] as const
  if (config.body !== undefined && methodsWithBody.includes(method)) {
    const bodyResult: { body: BodyInit; needsDuplex: boolean } = processRequestBody(
      config.body,
      config.headers,
      config.maxRate,
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
  let result: string
  const contentType: string | undefined = headers['Content-Type']
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
 * Calculates the estimated total bytes for FormData entries.
 * @param entries - FormData entries
 * @returns Estimated total bytes
 */
function calculateFormDataSize(entries: Array<[string, string | File]>): number {
  let totalBytes: number = 0
  for (const [key, value] of entries) {
    if (value instanceof File) {
      totalBytes += value.size
    } else {
      totalBytes += new TextEncoder().encode(`${key}=${value}`).length
    }
  }
  return totalBytes
}

/**
 * Processes a file entry with chunking and rate limiting.
 * @param file - File to process
 * @param chunkSize - Size of each chunk
 * @param maxRate - Maximum rate in bytes per second
 * @param rateLimiter - Rate limiter instance
 * @param controller - Stream controller
 * @param processedBytes - Current processed bytes count
 * @param totalBytes - Total estimated bytes
 * @param onProgress - Progress callback
 * @returns Updated processed bytes count
 */
async function processFileEntry(
  file: File,
  chunkSize: number,
  maxRate: number | undefined,
  rateLimiter: ReturnType<typeof createRateLimiter>,
  controller: ReadableStreamDefaultController<Uint8Array>,
  processedBytes: number,
  totalBytes: number,
  onProgress: ((percentage: number) => void) | undefined
): Promise<number> {
  const fileBytes: Uint8Array = new Uint8Array(await file.arrayBuffer())
  let currentProcessed: number = processedBytes
  for (let i: number = 0; i < fileBytes.length; i += chunkSize) {
    const chunk: Uint8Array = fileBytes.slice(i, i + chunkSize)
    if (maxRate !== undefined && maxRate > 0) {
      await rateLimiter.throttle(chunk.length, maxRate)
    }
    controller.enqueue(chunk)
    currentProcessed += chunk.length
    const percentage: number = Math.round((currentProcessed / totalBytes) * 100)
    onProgress?.(Math.min(percentage, 100))
  }
  return currentProcessed
}

/**
 * Processes a text entry with rate limiting.
 * @param key - FormData key
 * @param value - FormData value
 * @param maxRate - Maximum rate in bytes per second
 * @param rateLimiter - Rate limiter instance
 * @param controller - Stream controller
 * @param processedBytes - Current processed bytes count
 * @param totalBytes - Total estimated bytes
 * @param onProgress - Progress callback
 * @returns Updated processed bytes count
 */
async function processTextEntry(
  key: string,
  value: string,
  maxRate: number | undefined,
  rateLimiter: ReturnType<typeof createRateLimiter>,
  controller: ReadableStreamDefaultController<Uint8Array>,
  processedBytes: number,
  totalBytes: number,
  onProgress: ((percentage: number) => void) | undefined
): Promise<number> {
  const entryData: Uint8Array = new TextEncoder().encode(`${key}=${value}`)
  if (maxRate !== undefined && maxRate > 0) {
    await rateLimiter.throttle(entryData.length, maxRate)
  }
  controller.enqueue(entryData)
  const newProcessed: number = processedBytes + entryData.length
  const percentage: number = Math.round((newProcessed / totalBytes) * 100)
  onProgress?.(Math.min(percentage, 100))
  return newProcessed
}

/**
 * Creates a ReadableStream for FormData with progress tracking.
 * @param body - FormData to process
 * @param maxRate - Maximum rate in bytes per second
 * @param onProgress - Progress callback function
 * @param rateLimiter - Rate limiter instance
 * @returns ReadableStream with progress tracking
 */
function createFormDataStream(
  body: FormData,
  maxRate: number | undefined,
  onProgress: ((percentage: number) => void) | undefined,
  rateLimiter: ReturnType<typeof createRateLimiter>
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller: ReadableStreamDefaultController<Uint8Array>): Promise<void> {
      try {
        const entries: Array<[string, string | File]> = Array.from(body.entries())
        const totalEstimatedBytes: number = calculateFormDataSize(entries)
        const chunkSize: number = Math.max(1024, Math.floor(totalEstimatedBytes / 1000))
        let processedBytes: number = 0

        for (const [key, value] of entries) {
          if (value instanceof File) {
            processedBytes = await processFileEntry(
              value,
              chunkSize,
              maxRate,
              rateLimiter,
              controller,
              processedBytes,
              totalEstimatedBytes,
              onProgress
            )
          } else {
            processedBytes = await processTextEntry(
              key,
              value,
              maxRate,
              rateLimiter,
              controller,
              processedBytes,
              totalEstimatedBytes,
              onProgress
            )
          }
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    }
  })
}

/**
 * Creates a body with upload progress tracking.
 * @description Wraps a body in a ReadableStream that tracks upload progress.
 * @param body - The body to wrap
 * @param maxRate - Maximum upload rate in bytes per second
 * @param onProgress - Progress callback function
 * @returns ReadableStream with progress tracking
 */
export function createBodyWithProgress(
  body: BodyInit,
  maxRate?: number,
  onProgress?: (percentage: number) => void
): ReadableStream<Uint8Array> {
  let uploadedBytes: number = 0
  const totalBytes: number = calculateBodySize(body)
  const rateLimiter: ReturnType<typeof createRateLimiter> = createRateLimiter()
  if (body instanceof Blob) {
    return new ReadableStream<Uint8Array>({
      async start(controller: ReadableStreamDefaultController<Uint8Array>): Promise<void> {
        try {
          const arrayBuffer: ArrayBuffer = await body.arrayBuffer()
          const bytes: Uint8Array = new Uint8Array(arrayBuffer)
          const actualTotalBytes: number = bytes.length
          const chunkSize: number = Math.max(1024, Math.floor(actualTotalBytes / 1000))
          for (let i: number = 0; i < bytes.length; i += chunkSize) {
            const chunk: Uint8Array = bytes.slice(i, i + chunkSize)
            if (maxRate !== undefined && maxRate > 0) {
              await rateLimiter.throttle(chunk.length, maxRate)
            }
            controller.enqueue(chunk)
            uploadedBytes += chunk.length
            const percentage: number = Math.round((uploadedBytes / actualTotalBytes) * 100)
            onProgress?.(Math.min(percentage, 100))
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })
  }
  if (body instanceof FormData) {
    return createFormDataStream(body, maxRate, onProgress, rateLimiter)
  }
  const bodyBytes: Uint8Array = convertBodyToBytes(body)
  return new ReadableStream<Uint8Array>({
    async start(controller: ReadableStreamDefaultController<Uint8Array>): Promise<void> {
      const chunkSize: number = Math.max(1024, Math.floor(totalBytes / 1000))
      for (let i: number = 0; i < bodyBytes.length; i += chunkSize) {
        const chunk: Uint8Array = bodyBytes.slice(i, i + chunkSize)
        if (maxRate !== undefined && maxRate > 0) {
          await rateLimiter.throttle(chunk.length, maxRate)
        }
        controller.enqueue(chunk)
        uploadedBytes += chunk.length
        const percentage: number = Math.round((uploadedBytes / totalBytes) * 100)
        onProgress?.(Math.min(percentage, 100))
      }
      controller.close()
    }
  })
}
