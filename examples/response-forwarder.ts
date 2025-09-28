import fetch from '@root/index'
import { startServer, stopServer, handleError } from './utils'

/** HTTPBin.org base URL for testing load balancing */
const httpbinUrl: string = 'https://httpbin.org'
/** Local base URL for testing load balancing */
const localUrl: string = 'http://localhost:3000'

/**
 * Tests basic response forwarding functionality.
 * @description Demonstrates simple forwarding to multiple endpoints with default settings.
 * @returns Promise that resolves when test completes
 */
async function forwarderBasic(): Promise<void> {
  try {
    console.log(
      '-> Basic Response Forwarding',
      await fetch.get(`${httpbinUrl}/json`, {
        forwarder: [
          {
            url: `${localUrl}/forwarded-data`,
            method: 'POST'
          },
          {
            url: `${httpbinUrl}/post`,
            method: 'POST'
          }
        ]
      })
    )
  } catch (error: unknown) {
    handleError(error, 'Response Forwarder Basic')
  }
}

/**
 * Tests advanced response forwarding with custom headers and body transformation.
 * @description Demonstrates custom headers, body functions, and different HTTP methods.
 * @returns Promise that resolves when test completes
 */
async function forwarderAdvanced(): Promise<void> {
  try {
    console.log(
      '-> Advanced Response Forwarding',
      await fetch.post(
        `${httpbinUrl}/post`,
        {
          title: 'Original Post',
          content: 'This is the original content',
          userId: 123
        },
        {
          forwarder: [
            {
              url: `${localUrl}/analytics`,
              method: 'POST',
              headers: {
                'X-Analytics-Source': 'fetch-client',
                'X-Event-Type': 'user-action'
              },
              body: (originalResponse: unknown): Record<string, unknown> => ({
                event: 'post_created',
                timestamp: Date.now(),
                data: originalResponse,
                metadata: {
                  source: 'response-forwarder',
                  version: '1.0.0'
                }
              })
            },
            {
              url: `${httpbinUrl}/post`,
              method: 'POST',
              headers: {
                'X-Notification-Type': 'webhook'
              },
              body: {
                notification: 'New post created',
                summary: 'A new post has been created via response forwarder'
              }
            }
          ]
        }
      )
    )
  } catch (error: unknown) {
    handleError(error, 'Response Forwarder Advanced')
  }
}

/**
 * Tests response forwarding with retry configuration and error handling.
 * @description Demonstrates individual timeout, retry settings, and error isolation.
 * @returns Promise that resolves when test completes
 */
async function forwarderWithRetries(): Promise<void> {
  try {
    console.log(
      '-> Response Forwarding with Retries',
      await fetch.get(`${httpbinUrl}/json`, {
        forwarder: [
          {
            url: `${localUrl}/reliable-endpoint`,
            method: 'POST',
            timeout: 5000,
            retries: 3,
            headers: {
              'X-Retry-Config': 'high-reliability'
            }
          },
          {
            url: `${httpbinUrl}/post`,
            method: 'POST',
            timeout: 2000,
            retries: 1,
            headers: {
              'X-Retry-Config': 'low-reliability'
            }
          },
          {
            url: `${httpbinUrl}/status/429`,
            method: 'POST',
            timeout: 3000,
            retries: 2,
            headers: {
              'X-Retry-Config': 'medium-reliability'
            }
          }
        ]
      })
    )
  } catch (error: unknown) {
    handleError(error, 'Response Forwarder with Retries')
  }
}

/**
 * Runs all response forwarder test functions in sequence.
 * @description Executes all test functions with progress logging and error handling.
 * @returns Promise that resolves when all tests complete
 */
async function runAllTests(): Promise<void> {
  const listTests: Array<() => Promise<void>> = [
    startServer,
    forwarderBasic,
    forwarderAdvanced,
    forwarderWithRetries,
    stopServer
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
