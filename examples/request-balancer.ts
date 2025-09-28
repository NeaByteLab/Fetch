import fetch from '@root/index'
import { startServer, stopServer, handleError } from './utils'

/** HTTPBin.org base URL for testing load balancing */
const httpbinUrl: string = 'https://httpbin.org'
/** Local base URL for testing load balancing */
const localUrl: string = 'http://localhost:3000'

/**
 * Tests basic load balancing functionality.
 * @description Demonstrates load balancing across multiple endpoints using the fastest strategy.
 * @returns Promise that resolves when test completes
 */
async function balancerBasic(): Promise<void> {
  try {
    console.log(
      '-> Load Balanced Fastest',
      await fetch.get('/anything', {
        balancer: {
          endpoints: [httpbinUrl, localUrl],
          strategy: 'fastest'
        }
      })
    )
  } catch (error: unknown) {
    handleError(error, 'Load Balanced Fastest')
  }
}

/**
 * Tests parallel load balancing functionality.
 * @description Demonstrates parallel requests to multiple endpoints using the parallel strategy.
 * @returns Promise that resolves when test completes
 */
async function balancerParallel(): Promise<void> {
  try {
    console.log(
      '-> Load Balanced Parallel',
      await fetch.get('/users/1', {
        balancer: {
          endpoints: [httpbinUrl, localUrl],
          strategy: 'parallel'
        }
      })
    )
  } catch (error: unknown) {
    handleError(error, 'Load Balanced Parallel')
  }
}

/**
 * Tests load balancing failover functionality.
 * @description Demonstrates failover behavior when some endpoints fail using random/invalid URLs.
 * @returns Promise that resolves when test completes
 */
async function balancerFailover(): Promise<void> {
  try {
    console.log(
      '-> Load Balanced Failover',
      await fetch.get('/anything', {
        balancer: {
          endpoints: [
            'https://invalid-random-url-that-does-not-exist.com',
            'https://another-fake-endpoint.net',
            localUrl,
            httpbinUrl
          ],
          strategy: 'fastest'
        }
      })
    )
  } catch (error: unknown) {
    handleError(error, 'Load Balanced Failover')
  }
}

/**
 * Runs all load balancing test functions in sequence.
 * @description Executes all test functions with progress logging and error handling.
 * @returns Promise that resolves when all tests complete
 */
async function runAllTests(): Promise<void> {
  const listTests: Array<() => Promise<void>> = [
    startServer,
    balancerBasic,
    balancerParallel,
    balancerFailover,
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
