import fetch from '@root/index'
import { handleError } from './utils'

/** HTTPBin.org base URL for testing streaming */
const httpbinUrl: string = 'https://httpbin.org'

/**
 * Type guard to check if a value is an async iterable.
 * @param value - Value to check
 * @returns True if value is an async iterable
 */
function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return (
    value != null &&
    typeof value === 'object' &&
    typeof (value as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === 'function'
  )
}

/**
 * Tests basic streaming functionality.
 * @description Demonstrates streaming responses with text data.
 * @returns Promise that resolves when test completes
 */
async function streamingBasic(): Promise<void> {
  try {
    console.log('-> Basic Streaming')
    const response: unknown = await fetch.get(`${httpbinUrl}/stream/5`, {
      stream: true
    })
    if (isAsyncIterable(response)) {
      for await (const chunk of response as AsyncIterable<string>) {
        console.log(`  📡 Stream Chunk: ${JSON.stringify(chunk)}`)
      }
    }
  } catch (error: unknown) {
    handleError(error, 'Basic Streaming')
  }
}

/**
 * Tests NDJSON streaming functionality.
 * @description Demonstrates streaming NDJSON responses with JSON parsing.
 * @returns Promise that resolves when test completes
 */
async function streamingNdjson(): Promise<void> {
  try {
    console.log('-> NDJSON Streaming')
    const response: unknown = await fetch.get(`${httpbinUrl}/stream/3`, {
      stream: true
    })
    if (isAsyncIterable(response)) {
      for await (const chunk of response as AsyncIterable<string>) {
        try {
          const data: unknown = JSON.parse(chunk)
          console.log(`  📄 NDJSON Data: ${JSON.stringify(data)}`)
        } catch {
          console.log(`  📄 Raw Chunk: ${Object.keys(chunk).toString()}`)
        }
      }
    }
  } catch (error: unknown) {
    handleError(error, 'NDJSON Streaming')
  }
}

/**
 * Tests streaming with large data sets.
 * @description Demonstrates streaming with larger data sets for performance testing.
 * @returns Promise that resolves when test completes
 */
async function streamingLargeData(): Promise<void> {
  try {
    console.log('-> Streaming Large Data')
    const response: unknown = await fetch.get(`${httpbinUrl}/stream/20`, {
      stream: true
    })
    let chunkCount: number = 0
    if (isAsyncIterable(response)) {
      for await (const chunk of response as AsyncIterable<string>) {
        chunkCount++
        console.log(chunk)
      }
      console.log(`  ✅ Total chunks processed: ${chunkCount}`)
    }
  } catch (error: unknown) {
    handleError(error, 'Streaming Large Data')
  }
}

/**
 * Tests streaming with timeout configuration.
 * @description Demonstrates streaming with timeout settings.
 * @returns Promise that resolves when test completes
 */
async function streamingWithTimeout(): Promise<void> {
  try {
    console.log('-> Streaming with Timeout')
    const response: unknown = await fetch.get(`${httpbinUrl}/delay/5`, {
      stream: true,
      timeout: 3000
    })
    if (isAsyncIterable(response)) {
      for await (const chunk of response as AsyncIterable<string>) {
        console.log(`  ⏱️ Timeout Chunk: ${chunk}`)
      }
    }
  } catch (error: unknown) {
    handleError(error, 'Streaming with Timeout')
  }
}

/**
 * Executes all streaming test functions in sequence.
 * @description Runs all test functions with progress logging and error handling.
 * @returns Promise that resolves when all tests complete
 */
async function runAllTests(): Promise<void> {
  const listTests: Array<() => Promise<void>> = [
    streamingBasic,
    streamingNdjson,
    streamingLargeData,
    streamingWithTimeout
  ]
  for (const [index, testTask] of listTests.entries()) {
    console.log(`[${index + 1}] Working on "${testTask.name}" Function...`)
    await testTask()
    console.log('-\n-')
  }
}

/**
 * Main function to execute all tests when run directly.
 * @description Checks if the script is being run directly and executes all tests.
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error)
}
