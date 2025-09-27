import { contentTypes, headers, errorMessages } from '@constants/index'

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
  filename?: string
  onProgress?: (percentage: number) => void
}

/**
 * Handles file download with optional progress updates.
 * @description Uses streaming to report progress when possible, otherwise performs a direct download.
 * @param response - Response containing the file data
 * @param config - Download configuration with optional filename and progress callback
 * @returns void
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
 * Streams a download and tracks progress.
 * @description Aggregates chunks, reports percentage, and saves the file when complete.
 * @param response - The response to read from
 * @param config - Download configuration with required filename and progress callback
 * @param total - Total number of bytes expected
 * @returns void
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
        const percentage: number = Math.round((received / total) * 100)
        config.onProgress(percentage)
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
  const buffer: ArrayBuffer = new ArrayBuffer(received)
  const allChunks: Uint8Array = new Uint8Array(buffer)
  let position: number = 0
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
