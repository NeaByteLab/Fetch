import fetch from '@root/index'
import { handleError } from './utils'

/** NeaByte.com base URL for testing SSL pinning */
const neabyteUrl: string = 'https://neabyte.com'
/** NeaByte.com SSL hash */
const neabyteHash: string = 'CkrNrRxPZuk9q6wGw1YrpuXN8ZPI1sQrLcvLdlWIjjE='
/** GitHub API base URL for testing SSL pinning */
const githubUrl: string = 'https://api.github.com'

/**
 * Tests SSL pinning with NeaByte.com.
 * @description Demonstrates SSL certificate pinning with NeaByte.com.
 * @returns Promise that resolves when test completes
 */
async function sslPinningNeaByte(): Promise<void> {
  try {
    console.log(
      '-> SSL Pinning with NeaByte.com',
      await fetch.get(`${neabyteUrl}`, {
        sslPinning: [neabyteHash]
      })
    )
  } catch (error: unknown) {
    handleError(error, 'SSL Pinning with NeaByte.com')
  }
}

/**
 * Tests SSL pinning with multiple certificates.
 * @description Demonstrates SSL pinning with multiple certificate hashes for redundancy.
 * @returns Promise that resolves when test completes
 */
async function sslPinningMultiple(): Promise<void> {
  try {
    console.log(
      '-> SSL Pinning with Multiple Certificates',
      await fetch.get(`${neabyteUrl}`, {
        sslPinning: [neabyteHash, 'INVALID_HASH_FOR_REDUNDANCY_TEST=']
      })
    )
  } catch (error: unknown) {
    handleError(error, 'SSL Pinning with Multiple Certificates')
  }
}

/**
 * Tests SSL pinning error handling.
 * @description Demonstrates how SSL pinning errors are handled with invalid certificate hashes.
 * @returns Promise that resolves when test completes
 */
async function sslPinningErrorHandling(): Promise<void> {
  try {
    console.log(
      '-> SSL Pinning Error Handling',
      await fetch.get(`${githubUrl}`, {
        sslPinning: [neabyteHash, 'ANOTHER_INVALID_HASH_FOR_TESTING=']
      })
    )
  } catch (error: unknown) {
    handleError(error, 'SSL Pinning Error Handling')
  }
}

/**
 * Tests SSL pinning with POST request.
 * @description Demonstrates SSL pinning combined with POST requests.
 * @returns Promise that resolves when test completes
 */
async function sslPinningWithPost(): Promise<void> {
  try {
    console.log(
      '-> SSL Pinning with POST Request',
      await fetch.post(
        `${githubUrl}/api/test`,
        {
          title: 'SSL Pinning Test',
          body: 'This is a test request with SSL pinning',
          timestamp: Date.now()
        },
        {
          sslPinning: [neabyteHash]
        }
      )
    )
  } catch (error: unknown) {
    handleError(error, 'SSL Pinning with POST Request')
  }
}

/**
 * Executes all SSL pinning test functions in sequence.
 * @description Runs all test functions with progress logging and error handling.
 * @returns Promise that resolves when all tests complete
 */
async function runAllTests(): Promise<void> {
  const listTests: Array<() => Promise<void>> = [
    sslPinningNeaByte,
    sslPinningMultiple,
    sslPinningErrorHandling,
    sslPinningWithPost
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
