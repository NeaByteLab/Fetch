import fetch from '@root/index'
import { handleError } from './utils'

/** HTTPBin.org base URL for testing authentication */
const httpbinUrl: string = 'https://httpbin.org'
/** HTTPBin.org base URL for testing authentication */
const httpBaseAuth: string = 'f3tch1mpl3ment4t1on'

/**
 * Tests basic authentication functionality.
 * @description Demonstrates username/password authentication using httpbin basic auth endpoint.
 * @returns Promise that resolves when test completes
 */
async function authBasic(): Promise<void> {
  try {
    console.log(
      '-> Basic Authentication',
      await fetch.get(`${httpbinUrl}/basic-auth/${httpBaseAuth}/${httpBaseAuth}`, {
        auth: {
          type: 'basic',
          username: httpBaseAuth,
          password: httpBaseAuth
        }
      })
    )
  } catch (error: unknown) {
    handleError(error, 'Basic Authentication')
  }
}

/**
 * Tests bearer token authentication functionality.
 * @description Demonstrates JWT/OAuth token authentication using httpbin bearer endpoint.
 * @returns Promise that resolves when test completes
 */
async function authBearer(): Promise<void> {
  try {
    console.log(
      '-> Bearer Token Authentication',
      await fetch.get(`${httpbinUrl}/bearer`, {
        auth: {
          type: 'bearer',
          token: 'test-bearer-token-123'
        }
      })
    )
  } catch (error: unknown) {
    handleError(error, 'Bearer Token Authentication')
  }
}

/**
 * Tests API key authentication functionality.
 * @description Demonstrates custom header API key authentication using httpbin headers endpoint.
 * @returns Promise that resolves when test completes
 */
async function authApiKey(): Promise<void> {
  try {
    console.log(
      '-> API Key Authentication',
      await fetch.get(`${httpbinUrl}/headers`, {
        auth: {
          type: 'apikey',
          key: 'X-API-Key',
          value: 'test-api-key-456'
        }
      })
    )
  } catch (error: unknown) {
    handleError(error, 'API Key Authentication')
  }
}

/**
 * Tests custom API key header authentication functionality.
 * @description Demonstrates custom API key header authentication with different header names.
 * @returns Promise that resolves when test completes
 */
async function authApiKeyCustom(): Promise<void> {
  try {
    console.log(
      '-> Custom API Key Authentication',
      await fetch.get(`${httpbinUrl}/headers`, {
        auth: {
          type: 'apikey',
          key: 'X-Custom-Auth',
          value: 'custom-key-789'
        }
      })
    )
  } catch (error: unknown) {
    handleError(error, 'Custom API Key Authentication')
  }
}

/**
 * Tests authentication with POST request functionality.
 * @description Demonstrates authentication combined with POST requests and body data.
 * @returns Promise that resolves when test completes
 */
async function authWithPost(): Promise<void> {
  try {
    console.log(
      '-> Authentication with POST',
      await fetch.post(
        `${httpbinUrl}/post`,
        {
          name: 'John Doe',
          email: 'john@example.com'
        },
        {
          auth: {
            type: 'bearer',
            token: 'post-test-token'
          }
        }
      )
    )
  } catch (error: unknown) {
    handleError(error, 'Authentication with POST')
  }
}

/**
 * Tests authentication error handling functionality.
 * @description Demonstrates how authentication errors are handled with invalid credentials.
 * @returns Promise that resolves when test completes
 */
async function authErrorHandling(): Promise<void> {
  try {
    console.log(
      '-> Authentication Error Handling',
      await fetch.get(`${httpbinUrl}/basic-auth/testuser/testpass`, {
        auth: {
          type: 'basic',
          username: httpBaseAuth,
          password: httpBaseAuth
        }
      })
    )
  } catch (error: unknown) {
    handleError(error, 'Authentication Error Handling')
  }
}

/**
 * Executes all authentication test functions in sequence.
 * @description Runs all test functions with progress logging and error handling.
 * @returns Promise that resolves when all tests complete
 */
async function runAllTests(): Promise<void> {
  const listTests: Array<() => Promise<void>> = [
    authBasic,
    authBearer,
    authApiKey,
    authApiKeyCustom,
    authWithPost,
    authErrorHandling
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
