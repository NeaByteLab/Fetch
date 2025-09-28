import fetch from '@root/index'
import { handleError } from './utils'

/** HTTPBin.org base URL for testing progress tracking */
const httpbinUrl: string = 'https://httpbin.org'
/** Test file size for progress demonstrations */
const testFileSize: number = 1 * 1024 * 1024

/**
 * Tests upload progress tracking functionality.
 * @description Demonstrates upload progress with rate limiting and progress callbacks.
 * @returns Promise that resolves when test completes
 */
async function progressUpload(): Promise<void> {
  try {
    const largeFile: Blob = new Blob(['x'.repeat(testFileSize)], {
      type: 'application/octet-stream'
    })
    console.log(
      '-> Upload Progress Tracking',
      await fetch.post(`${httpbinUrl}/post`, largeFile, {
        maxRate: 100 * 1024,
        onProgress: (percentage: number) => {
          console.log(`  📤 Upload Progress: ${percentage.toFixed(1)}%`)
        }
      })
    )
  } catch (error: unknown) {
    handleError(error, 'Upload Progress Tracking')
  }
}

/**
 * Tests download progress tracking functionality.
 * @description Demonstrates download progress with rate limiting and progress callbacks.
 * @returns Promise that resolves when test completes
 */
async function progressDownload(): Promise<void> {
  try {
    console.log(
      '-> Download Progress Tracking',
      await fetch.get(`${httpbinUrl}/bytes/${testFileSize}`, {
        download: true,
        filename: 'test-download.bin',
        maxRate: 200 * 1024,
        onProgress: (percentage: number) => {
          console.log(`  📥 Download Progress: ${percentage.toFixed(1)}%`)
        }
      })
    )
  } catch (error: unknown) {
    handleError(error, 'Download Progress Tracking')
  }
}

/**
 * Tests FormData upload progress tracking.
 * @description Demonstrates FormData upload progress with mixed content types.
 * @returns Promise that resolves when test completes
 */
async function progressFormData(): Promise<void> {
  try {
    const formData: FormData = new FormData()
    formData.append('title', 'Progress Test File')
    formData.append('description', 'Testing FormData upload progress')
    const fileBlob: Blob = new Blob(['FormData file content for progress test'], {
      type: 'text/plain'
    })
    formData.append('file', fileBlob, 'progress-test.txt')
    console.log(
      '-> FormData Upload Progress',
      await fetch.post(`${httpbinUrl}/post`, formData, {
        maxRate: 150 * 1024,
        onProgress: (percentage: number) => {
          console.log(`  📋 FormData Progress: ${percentage.toFixed(1)}%`)
        }
      })
    )
  } catch (error: unknown) {
    handleError(error, 'FormData Upload Progress')
  }
}

/**
 * Tests progress tracking error handling.
 * @description Demonstrates progress tracking with invalid configurations and error scenarios.
 * @returns Promise that resolves when test completes
 */
async function progressErrorHandling(): Promise<void> {
  try {
    console.log(
      '-> Progress Error Handling',
      await fetch.get(`${httpbinUrl}/status/500`, {
        download: true,
        filename: 'error-test.bin',
        onProgress: (percentage: number) => {
          console.log(`  ❌ Error Progress: ${percentage.toFixed(1)}%`)
        }
      })
    )
  } catch (error: unknown) {
    handleError(error, 'Progress Error Handling')
  }
}

/**
 * Tests progress tracking with different rate limits.
 * @description Demonstrates various rate limiting scenarios for uploads and downloads.
 * @returns Promise that resolves when test completes
 */
async function progressRateLimiting(): Promise<void> {
  try {
    const testData: Blob = new Blob(['Rate limiting test data'], {
      type: 'application/octet-stream'
    })
    console.log(
      '-> Rate Limiting Progress',
      await fetch.post(`${httpbinUrl}/post`, testData, {
        maxRate: 50 * 1024,
        onProgress: (percentage: number) => {
          console.log(`  🐌 Slow Upload: ${percentage.toFixed(1)}%`)
        }
      })
    )
  } catch (error: unknown) {
    handleError(error, 'Rate Limiting Progress')
  }
}

/**
 * Tests progress tracking with JSON data upload.
 * @description Demonstrates progress tracking with JSON payloads and rate limiting.
 * @returns Promise that resolves when test completes
 */
async function progressJsonUpload(): Promise<void> {
  try {
    const jsonData: Record<string, unknown> = {
      title: 'Progress Test JSON',
      content: 'x'.repeat(500 * 1024),
      timestamp: Date.now(),
      metadata: {
        testType: 'progress-tracking',
        fileSize: '500KB'
      }
    }
    console.log(
      '-> JSON Upload Progress',
      await fetch.post(`${httpbinUrl}/post`, jsonData, {
        maxRate: 75 * 1024,
        onProgress: (percentage: number) => {
          console.log(`  📄 JSON Progress: ${percentage.toFixed(1)}%`)
        }
      })
    )
  } catch (error: unknown) {
    handleError(error, 'JSON Upload Progress')
  }
}

/**
 * Executes all progress tracking test functions in sequence.
 * @description Runs all test functions with progress logging and error handling.
 * @returns Promise that resolves when all tests complete
 */
async function runAllTests(): Promise<void> {
  const listTests: Array<() => Promise<void>> = [
    progressUpload,
    progressDownload,
    progressFormData,
    progressJsonUpload,
    progressRateLimiting,
    progressErrorHandling
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
