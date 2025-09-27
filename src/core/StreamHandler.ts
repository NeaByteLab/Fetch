import { FetchError } from '@interfaces/index'
import { errorMessages } from '@constants/index'
import { parseResponseWithProgress } from '@utils/index'

/**
 * Stream handling utilities.
 * @description Manages streaming responses and creates async iterators.
 */
export class StreamHandler {
  /**
   * Creates an async iterator for streaming responses.
   * @description Converts a Response into an async iterable for streaming data.
   * @param response - Response to stream
   * @param fullUrl - Request URL for error context
   * @returns Async iterable of parsed data
   */
  static createStreamIterator<T>(response: Response, fullUrl: string): AsyncIterable<T> {
    if (!response.body) {
      throw new FetchError(errorMessages.RESPONSE_BODY_NULL, undefined, undefined, fullUrl)
    }
    const reader: ReadableStreamDefaultReader<Uint8Array> = response.body.getReader()
    const decoder: TextDecoder = new TextDecoder()
    let buffer: string = ''
    return {
      async *[Symbol.asyncIterator](): AsyncIterator<T> {
        try {
          while (true) {
            const { done, value }: { done: boolean; value?: Uint8Array | undefined } =
              await reader.read()
            if (done) {
              break
            }
            buffer += decoder.decode(value, { stream: true })
            const lines: string[] = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
              if (line.trim() === '') {
                continue
              }
              try {
                const parsed: T = JSON.parse(line) as T
                yield parsed
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
          if (buffer.trim() !== '') {
            try {
              const parsed: T = JSON.parse(buffer) as T
              yield parsed
            } catch {
              // Skip invalid JSON
            }
          }
        } finally {
          reader.releaseLock()
        }
      }
    }
  }

  /**
   * Processes streaming response with progress tracking.
   * @description Handles streaming with optional progress callbacks.
   * @param response - Response to process
   * @param fullUrl - Request URL for error context
   * @param method - HTTP method
   * @param responseType - Type of response to parse
   * @param onProgress - Optional progress callback
   * @returns Parsed streaming data
   */
  static async processStreamResponse<T>(
    response: Response,
    fullUrl: string,
    method: string,
    responseType: 'auto' | 'json' | 'text' | 'buffer' | 'blob',
    onProgress?: (percentage: number) => void
  ): Promise<T> {
    const parseConfig: {
      responseType: 'auto' | 'json' | 'text' | 'buffer' | 'blob'
    } & Partial<{ onProgress: (percentage: number) => void }> = { responseType }
    if (onProgress !== undefined) {
      parseConfig.onProgress = onProgress
    }
    return parseResponseWithProgress<T>(response, parseConfig, fullUrl, method)
  }
}
