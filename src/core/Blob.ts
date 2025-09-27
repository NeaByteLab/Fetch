import { contentTypes, headers, errorMessages } from '@constants/index'
import { createRateLimiter } from '@utils/index'

/**
 * Type declaration for the global document object.
 * @description Ensures TypeScript recognizes the browser document API for DOM manipulation.
 */
declare const document: Document

/**
 * Configuration options for file downloads.
 * @description Defines optional filename and progress callback for download operations.
 */
type DownloadConfig = {
  /** Filename to save as */
  filename?: string
  /** Maximum download rate in bytes per second */
  maxRate?: number
  /** Progress callback function */
  onProgress?: (percentage: number) => void
}

/**
 * Handles file download with optional progress updates.
 * @description Uses streaming to report progress when possible, otherwise performs a direct download.
 * @param response - Response containing the file data
 * @param config - Download configuration with optional filename, progress callback, and max rate
 * @returns void
 * @throws {Error} When filename is required but not provided
 */
export async function handleDownload(response: Response, config: DownloadConfig): Promise<void> {
  if (config.filename === undefined || config.filename.trim() === '') {
    throw new Error(errorMessages.FILENAME_REQUIRED)
  }
  if (config.onProgress !== undefined && response.body !== null) {
    await handleDownloadWithProgress(response, config)
  } else {
    await handleDirectDownload(response, config.filename)
  }
}

/**
 * Handles a download using streaming progress when possible.
 * @description Uses content length and stream reader to report progress; falls back to direct download when size is unknown.
 * @param response - The response containing the file data
 * @param config - Download configuration
 * @returns void
 * @throws {Error} When filename is undefined
 */
async function handleDownloadWithProgress(
  response: Response,
  config: DownloadConfig
): Promise<void> {
  const contentLength: string | null = response.headers.get(headers.CONTENT_LENGTH)
  const total: number = contentLength !== null ? parseInt(contentLength, 10) : 0
  if (total > 0) {
    await downloadWithProgressTracking(response, config, total)
  } else {
    if (config.filename === undefined) {
      throw new Error(errorMessages.FILENAME_UNDEFINED)
    }
    await handleDirectDownload(response, config.filename)
  }
}

/**
 * Processes a chunk with rate limiting and progress tracking.
 * @description Handles rate limiting and progress updates for a data chunk.
 * @param chunk - Data chunk to process
 * @param config - Download configuration
 * @param rateLimiter - Rate limiter instance
 * @param chunks - Array to store processed chunks
 * @param received - Current received bytes count
 * @param total - Total expected bytes
 * @returns Updated received bytes count
 */
async function processChunk(
  chunk: Uint8Array,
  config: DownloadConfig,
  rateLimiter: ReturnType<typeof createRateLimiter>,
  chunks: Uint8Array[],
  received: number,
  total: number
): Promise<number> {
  if (config.maxRate !== undefined && config.maxRate > 0) {
    await rateLimiter.throttle(chunk.length, config.maxRate)
  }
  chunks.push(chunk)
  const newReceived: number = received + chunk.length
  const percentage: number = Math.round((newReceived / total) * 100)
  config.onProgress?.(percentage)
  return newReceived
}

/**
 * Streams a download and tracks progress.
 * @description Aggregates chunks, reports percentage, and saves the file when complete.
 * @param response - The response to read from
 * @param config - Download configuration with required filename and progress callback
 * @param total - Total number of bytes expected
 * @returns void
 * @throws {Error} When response body is null, progress callback is undefined, or filename is undefined
 */
async function downloadWithProgressTracking(
  response: Response,
  config: DownloadConfig,
  total: number
): Promise<void> {
  if (response.body === null) {
    throw new Error(errorMessages.RESPONSE_BODY_NULL)
  }
  if (config.onProgress === undefined) {
    throw new Error(errorMessages.PROGRESS_CALLBACK_UNDEFINED)
  }
  if (config.filename === undefined) {
    throw new Error(errorMessages.FILENAME_UNDEFINED)
  }
  let received: number = 0
  const chunks: Uint8Array[] = []
  const rateLimiter: ReturnType<typeof createRateLimiter> = createRateLimiter()
  const reader: ReadableStreamDefaultReader<Uint8Array> = response.body.getReader()
  const processingChunkSize: number = 128
  try {
    while (true) {
      const { done, value }: { done: boolean; value: Uint8Array | undefined } = await reader.read()
      if (done) {
        break
      }
      if (value !== undefined) {
        for (let i: number = 0; i < value.length; i += processingChunkSize) {
          const chunk: Uint8Array = value.slice(i, i + processingChunkSize)
          received = await processChunk(chunk, config, rateLimiter, chunks, received, total)
        }
      }
    }
    const blob: Blob = createBlobFromChunks(chunks, received, response)
    await saveBlob(blob, config.filename)
  } finally {
    reader.releaseLock()
  }
}

/**
 * Performs a direct download without progress.
 * @description Reads the response as a blob and saves it.
 * @param response - The response to download
 * @param filename - Filename to save as
 * @returns void
 */
async function handleDirectDownload(response: Response, filename: string): Promise<void> {
  const blob: Blob = await response.blob()
  await saveBlob(blob, filename)
}

/**
 * Creates a Blob from received chunks.
 * @description Concatenates Uint8Array chunks into a single ArrayBuffer and wraps it in a Blob.
 * @param chunks - Collected byte chunks
 * @param received - Total bytes received
 * @param response - Source response for content type
 * @returns Blob instance
 */
function createBlobFromChunks(chunks: Uint8Array[], received: number, response: Response): Blob {
  let position: number = 0
  const buffer: ArrayBuffer = new ArrayBuffer(received)
  const allChunks: Uint8Array = new Uint8Array(buffer)
  for (const chunk of chunks) {
    allChunks.set(chunk, position)
    position += chunk.length
  }
  return new Blob([buffer], {
    type: response.headers.get(headers.CONTENT_TYPE) ?? contentTypes.APPLICATION_OCTET_STREAM
  })
}

/**
 * Saves a Blob to a file in browser or Node.js environments.
 * @description Uses an anchor element in browsers and `fs.writeFileSync` in Node.js.
 * @param blob - Data to save
 * @param filename - Output filename
 * @returns void
 */
async function saveBlob(blob: Blob, filename: string): Promise<void> {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const objectUrl: string = URL.createObjectURL(blob)
    const link: HTMLAnchorElement = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    try {
      document.body.appendChild(link)
      link.click()
    } finally {
      if (document.body.contains(link)) {
        document.body.removeChild(link)
      }
      URL.revokeObjectURL(objectUrl)
    }
  } else {
    const { writeFileSync }: { writeFileSync: typeof import('node:fs').writeFileSync } =
      await import('node:fs')
    const buffer: ArrayBuffer = await blob.arrayBuffer()
    writeFileSync(filename, Buffer.from(buffer))
  }
}
