import fetch from '@root/index'
import { handleError } from './utils'

/** HTTPBin.org base URL for testing HTTP methods */
const httpbinUrl: string = 'https://httpbin.org'
/** JSONPlaceholder base URL for testing with realistic data */
const typicodeUrl: string = 'https://jsonplaceholder.typicode.com'

/**
 * Tests GET request functionality with various configurations.
 * @description Demonstrates basic GET requests, timeout handling, and abort signal usage.
 * @returns Promise that resolves when test completes
 */
async function generalGET(): Promise<void> {
  try {
    // -- Direct GET
    console.log('-> Direct GET', await fetch.get(`${typicodeUrl}/users/1`))
    // -- With Timeout
    console.log(
      '-> With Timeout (2s)',
      await fetch.get(`${typicodeUrl}/users/1`, { timeout: 2000 })
    )
    // -- With Abort
    const controller: AbortController = new AbortController()
    setTimeout(() => {
      controller.abort()
    }, 1)
    console.log(
      '-> With Abort (1ms)',
      await fetch.get(`${typicodeUrl}/users/1`, { signal: controller.signal })
    )
  } catch (error: unknown) {
    handleError(error, 'GET')
  }
}

/**
 * Tests POST request functionality with different body types.
 * @description Demonstrates JSON payloads and FormData submissions.
 * @returns Promise that resolves when test completes
 */
async function generalPOST(): Promise<void> {
  try {
    // -- With JSON
    console.log(
      '-> Direct POST',
      await fetch.post(`${httpbinUrl}/post`, {
        title: 'My New Post',
        body: 'This is the content',
        userId: 1
      })
    )
    // -- With FormData
    const formData: FormData = new FormData()
    formData.append('title', 'My New Post')
    formData.append('body', 'This is the content')
    formData.append('userId', '1')
    console.log('-> With FormData', await fetch.post(`${httpbinUrl}/post`, formData))
  } catch (error: unknown) {
    handleError(error, 'POST')
  }
}

/**
 * Tests PUT request functionality with JSON and file uploads.
 * @description Demonstrates JSON payloads and FormData with file uploads.
 * @returns Promise that resolves when test completes
 */
async function generalPUT(): Promise<void> {
  try {
    // -- With JSON
    console.log(
      '-> Direct PUT',
      await fetch.put(`${httpbinUrl}/put`, {
        id: 1,
        title: 'Updated Post Title',
        body: 'Updated post content',
        userId: 1
      })
    )
    // -- With FormData file upload
    const uploadFormData: FormData = new FormData()
    uploadFormData.append('title', 'File Upload Test')
    uploadFormData.append('description', 'Testing file upload with FormData')
    const mockFile: Blob = new Blob(['This is mock file content for upload test'], {
      type: 'text/plain'
    })
    uploadFormData.append('file', mockFile, 'test-file.txt')
    uploadFormData.append('userId', '1')
    console.log('-> PUT with File Upload', await fetch.put(`${httpbinUrl}/put`, uploadFormData))
  } catch (error: unknown) {
    handleError(error, 'PUT')
  }
}

/**
 * Tests PATCH request functionality with partial updates.
 * @description Demonstrates partial resource updates using PATCH method.
 * @returns Promise that resolves when test completes
 */
async function generalPATCH(): Promise<void> {
  try {
    console.log(
      await fetch.patch(`${httpbinUrl}/patch`, {
        title: 'Patched Title Only'
      })
    )
  } catch (error: unknown) {
    handleError(error, 'PATCH')
  }
}

/**
 * Tests DELETE request functionality with simple and complex scenarios.
 * @description Demonstrates basic DELETE requests and large file deletion with progress tracking.
 * @returns Promise that resolves when test completes
 */
async function generalDELETE(): Promise<void> {
  try {
    // -- Simple DELETE
    console.log('-> Simple DELETE', await fetch.delete(`${httpbinUrl}/delete`))
    // -- DELETE with With Progress
    const largeFile: Blob = new Blob(['x'.repeat(1 * 1024 * 1024)], {
      type: 'application/octet-stream'
    })
    const deleteFormData: FormData = new FormData()
    deleteFormData.append('file', largeFile, 'large-file-to-delete.bin')
    deleteFormData.append('action', 'delete')
    deleteFormData.append('reason', 'Testing large file deletion with progress')
    console.log('-> DELETE Large File with Progress')
    console.log(
      await fetch.delete(`${httpbinUrl}/delete`, {
        body: deleteFormData,
        maxRate: 500 * 1024,
        onProgress: (percentage: number) => {
          console.log(`  📊 Delete Progress: ${percentage.toFixed(1)}%`)
        }
      })
    )
  } catch (error: unknown) {
    handleError(error, 'DELETE')
  }
}

/**
 * Tests HEAD request functionality.
 * @description Demonstrates HEAD requests for retrieving headers without body content.
 * @returns Promise that resolves when test completes
 */
async function generalHEAD(): Promise<void> {
  try {
    console.log('-> Simple HEAD', await fetch.head(`${httpbinUrl}/get`))
  } catch (error: unknown) {
    handleError(error, 'HEAD')
  }
}

/**
 * Tests OPTIONS request functionality.
 * @description Demonstrates OPTIONS requests for checking allowed methods and CORS preflight.
 * @returns Promise that resolves when test completes
 */
async function generalOPTIONS(): Promise<void> {
  try {
    console.log('-> Simple OPTIONS', await fetch.options(`${httpbinUrl}/get`))
  } catch (error: unknown) {
    handleError(error, 'OPTIONS')
  }
}

/**
 * Tests TRACE request functionality.
 * @description Demonstrates TRACE requests for debugging and diagnostics.
 * @returns Promise that resolves when test completes
 */
async function generalTRACE(): Promise<void> {
  try {
    console.log('-> Simple TRACE', await fetch.trace(`${httpbinUrl}/get`))
  } catch (error: unknown) {
    handleError(error, 'TRACE')
  }
}

/**
 * Executes all HTTP method test functions in sequence.
 * @description Runs all test functions with progress logging and error handling.
 * @returns Promise that resolves when all tests complete
 */
async function runAllTests(): Promise<void> {
  const listTests: Array<() => Promise<void>> = [
    generalGET,
    generalPOST,
    generalPUT,
    generalPATCH,
    generalDELETE,
    generalHEAD,
    generalOPTIONS,
    generalTRACE
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
