import { FetchError } from '@interfaces/index'
import { errorMessages, headers, misc } from '@constants/index'
import { isJsonContentType, isTextContentType } from '@utils/index'

/**
 * Stream processing utilities for handling different response types.
 * @description Provides methods for processing streaming responses including text, JSON, and binary data.
 */
export class StreamHandler {
  /**
   * Creates an async iterator over a streaming response.
   * @description Creates an async iterator that yields typed chunks from a streaming response.
   * @param response - Source response
   * @param url - Request URL for error context
   * @returns Async iterable yielding typed chunks
   */
  static createStreamIterator<T>(response: Response, url: string): AsyncIterable<T> {
    const bodyStream: ReadableStream<Uint8Array> | null = response.body
    if (!bodyStream) {
      throw new FetchError(errorMessages.RESPONSE_BODY_NULL, undefined, null, url)
    }
    return {
      async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {
        const reader: ReadableStreamDefaultReader<Uint8Array> = bodyStream.getReader()
        try {
          const contentType: string | null = response.headers.get(headers.CONTENT_TYPE)
          const isJson: boolean = isJsonContentType(contentType)
          const isText: boolean = isTextContentType(contentType)
          if (isJson) {
            yield* StreamHandler.iterateNdjson<T>(reader, url)
            return
          }
          if (isText) {
            yield* StreamHandler.iterateText<T>(reader)
            return
          }
          yield* StreamHandler.iterateBinary<T>(reader)
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
   * Reads and decodes a single stream chunk.
   * @description Reads a chunk from the stream and decodes it to a string.
   * @param reader - Stream reader
   * @param decoder - Text decoder
   * @returns Decoded string or null when complete
   */
  static async readDecodedChunk(
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
   * Iterates text chunks from a ReadableStream.
   * @description Yields decoded text chunks from a ReadableStream using TextDecoder.
   * @param reader - Stream reader
   */
  static async *iterateText<T>(
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
  static async *iterateNdjson<T>(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    url: string
  ): AsyncGenerator<T, void, unknown> {
    const decoder: TextDecoder = new TextDecoder()
    let buffer: string = ''
    while (true) {
      const chunk: string | null = await StreamHandler.readDecodedChunk(reader, decoder)
      if (chunk === null) {
        break
      }
      buffer += chunk
      yield* StreamHandler.yieldCompleteJsonLines<T>(
        buffer,
        (newBuffer: string) => {
          buffer = newBuffer
        },
        url
      )
    }
    const trimmed: string = buffer.trim()
    if (trimmed.length > 0) {
      yield* StreamHandler.safeParseJsonLine<T>(trimmed, url)
    }
  }

  /**
   * Yields complete JSON lines from a buffer.
   * @description Processes buffer to yield complete JSON lines, updating buffer state.
   * @param buffer - Accumulated text buffer
   * @param setBuffer - Callback to update buffer after consumption
   * @param url - Request URL for error context
   */
  static *yieldCompleteJsonLines<T>(
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
      yield* StreamHandler.safeParseJsonLine<T>(line, url)
    }
  }

  /**
   * Safely parses a single JSON line.
   * @description Parses a JSON string with error handling, yielding the parsed object.
   * @param line - JSON line string
   * @param url - Request URL for error context
   * @returns Generator yielding the parsed value
   */
  static *safeParseJsonLine<T>(line: string, url: string): Generator<T, void, unknown> {
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
  static async *iterateBinary<T>(
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
