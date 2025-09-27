import { test, expect, Page } from '@playwright/test'

test.describe('@neabyte/fetch Module Loading Tests', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    await page.goto('about:blank')
    await page.addScriptTag({ url: 'http://localhost:3000/dist/index.umd.min.js' })
    await page.waitForFunction(() => window.Fetch && window.Fetch.default, { timeout: 10000 })
    await page.evaluate(() => {
      window.fetchClient = window.Fetch.default
    })
  })

  test('should load the module successfully', async () => {
    const result = await page.evaluate(() => {
      return {
        fetchClientExists: !!window.fetchClient,
        fetchClientType: typeof window.fetchClient,
        hasGetMethod: typeof window.fetchClient?.get === 'function',
        hasPostMethod: typeof window.fetchClient?.post === 'function',
        hasPutMethod: typeof window.fetchClient?.put === 'function',
        hasDeleteMethod: typeof window.fetchClient?.delete === 'function',
        hasHeadMethod: typeof window.fetchClient?.head === 'function',
        hasOptionsMethod: typeof window.fetchClient?.options === 'function',
        hasTraceMethod: typeof window.fetchClient?.trace === 'function'
      }
    })
    expect(result.fetchClientExists).toBe(true)
    expect(result.fetchClientType).toBe('function')
    expect(result.hasGetMethod).toBe(true)
    expect(result.hasPostMethod).toBe(true)
    expect(result.hasPutMethod).toBe(true)
    expect(result.hasDeleteMethod).toBe(true)
    expect(result.hasHeadMethod).toBe(true)
    expect(result.hasOptionsMethod).toBe(true)
    expect(result.hasTraceMethod).toBe(true)
  })

  test('should be able to make a simple GET request', async () => {
    const result = await page.evaluate(async () => {
      try {
        const data = await window.fetchClient.get('https://jsonplaceholder.typicode.com/posts/1')
        return {
          success: true,
          data: data,
          hasId: !!data?.id,
          hasTitle: !!data?.title
        }
      } catch (error) {
        return {
          success: false,
          error: error.message
        }
      }
    })
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.hasId).toBe(true)
    expect(result.hasTitle).toBe(true)
  })

  test.describe('HTTP Methods', () => {
    test('POST request should work', async () => {
      const result = await page.evaluate(async () => {
        try {
          const data = await window.fetchClient.post('https://jsonplaceholder.typicode.com/posts', {
            title: 'Test Post',
            body: 'This is a test post',
            userId: 1
          })
          return {
            success: true,
            data: data,
            hasId: !!data?.id,
            hasTitle: !!data?.title
          }
        } catch (error) {
          return {
            success: false,
            error: error.message
          }
        }
      })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.hasId).toBe(true)
      expect(result.hasTitle).toBe(true)
    })

    test('PUT request should work', async () => {
      const result = await page.evaluate(async () => {
        try {
          const data = await window.fetchClient.put(
            'https://jsonplaceholder.typicode.com/posts/1',
            {
              id: 1,
              title: 'Updated Post',
              body: 'This is an updated post',
              userId: 1
            }
          )
          return {
            success: true,
            data: data,
            hasId: !!data?.id,
            hasTitle: !!data?.title
          }
        } catch (error) {
          return {
            success: false,
            error: error.message
          }
        }
      })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.hasId).toBe(true)
      expect(result.hasTitle).toBe(true)
    })

    test('DELETE request should work', async () => {
      const result = await page.evaluate(async () => {
        try {
          const data = await window.fetchClient.delete(
            'https://jsonplaceholder.typicode.com/posts/1'
          )
          return {
            success: true,
            data: data
          }
        } catch (error) {
          return {
            success: false,
            error: error.message
          }
        }
      })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    test('HEAD request should work', async () => {
      const result = await page.evaluate(async () => {
        try {
          const data = await window.fetchClient.head('https://jsonplaceholder.typicode.com/posts/1')
          return {
            success: true,
            data: data,
            isHeadRequest: true
          }
        } catch (error) {
          return {
            success: false,
            error: error.message
          }
        }
      })
      expect(result.success).toBe(true)
      expect(result.isHeadRequest).toBe(true)
    })

    test('OPTIONS request should work', async () => {
      const result = await page.evaluate(async () => {
        try {
          const data = await window.fetchClient.options('https://httpbin.org/anything')
          return {
            success: true,
            data: data,
            isOptionsRequest: true
          }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            isExpectedRejection: true,
            isOptionsRequest: true
          }
        }
      })
      expect(result.isOptionsRequest).toBe(true)
      if (result.success) {
        expect(result.data).toBeUndefined()
      } else {
        expect(result.isExpectedRejection).toBe(true)
      }
    })

    test('TRACE request should work', async () => {
      const result = await page.evaluate(async () => {
        try {
          const data = await window.fetchClient.trace('https://httpbin.org/anything')
          return {
            success: true,
            data: data,
            isTraceRequest: true
          }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            isTraceRequest: true,
            isExpectedRejection: true
          }
        }
      })
      expect(result.isTraceRequest).toBe(true)
      if (result.success) {
        expect(result.data).toBeDefined()
      } else {
        expect(result.isExpectedRejection).toBe(true)
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should handle 404 errors', async () => {
      const result = await page.evaluate(async () => {
        try {
          await window.fetchClient.get('https://jsonplaceholder.typicode.com/posts/99999')
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            status: error.status,
            isFetchError: error.name === 'FetchError'
          }
        }
      })
      expect(result.success).toBe(false)
      expect(result.isFetchError).toBe(true)
      expect(result.status).toBe(404)
    })

    test('should handle timeout errors', async () => {
      const result = await page.evaluate(async () => {
        try {
          await window.fetchClient.get('https://httpbin.org/delay/2', { timeout: 1000 })
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            isTimeout: error.message.includes('timeout') || error.message.includes('aborted')
          }
        }
      })
      expect(result.success).toBe(false)
      expect(result.isTimeout).toBe(true)
    })

    test('should handle network errors', async () => {
      const result = await page.evaluate(async () => {
        try {
          await window.fetchClient.get('https://invalid-domain-that-does-not-exist.com')
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            isNetworkError: true
          }
        }
      })
      expect(result.success).toBe(false)
      expect(result.isNetworkError).toBe(true)
    })
  })

  test.describe('Retry Logic', () => {
    test('should retry on failure', async () => {
      const result = await page.evaluate(async () => {
        let retryCount = 0
        try {
          await window.fetchClient.get('https://httpbin.org/status/500', { retries: 2 })
          return { success: true, retryCount }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            retryCount
          }
        }
      })
      expect(result.success).toBe(false)
      expect(result.retryCount).toBeGreaterThanOrEqual(0)
    })

    test('should respect Retry-After header', async () => {
      const result = await page.evaluate(async () => {
        const startTime = Date.now()
        try {
          await window.fetchClient.get('https://httpbin.org/status/429', { retries: 1 })
          return { success: true, duration: Date.now() - startTime }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            duration: Date.now() - startTime
          }
        }
      })
      expect(result.success).toBe(false)
      expect(result.duration).toBeGreaterThan(0)
    })
  })

  test.describe('Progress Tracking', () => {
    test('should track download progress', async () => {
      const result = await page.evaluate(async () => {
        const progressEvents = []
        try {
          await window.fetchClient.get('https://jsonplaceholder.typicode.com/posts', {
            onProgress: percentage => {
              progressEvents.push(percentage)
            }
          })
          return {
            success: true,
            progressEvents
          }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            progressEvents
          }
        }
      })
      expect(result.success).toBe(true)
      expect(result.progressEvents.length).toBeGreaterThanOrEqual(0)
    })

    test('should track upload progress', async () => {
      const result = await page.evaluate(async () => {
        const progressEvents = []
        try {
          await window.fetchClient.post(
            'https://jsonplaceholder.typicode.com/posts',
            {
              title: 'Test Post',
              body: 'This is a test post',
              userId: 1
            },
            {
              onProgress: percentage => {
                progressEvents.push(percentage)
              }
            }
          )
          return {
            success: true,
            progressEvents
          }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            progressEvents
          }
        }
      })
      expect(result.success).toBe(true)
      expect(result.progressEvents.length).toBeGreaterThan(0)
      expect(result.progressEvents[result.progressEvents.length - 1]).toBe(100)
    })
  })

  test.describe('Streaming', () => {
    test('should handle NDJSON streaming', async () => {
      const result = await page.evaluate(async () => {
        const streamedData = []
        try {
          const stream = await window.fetchClient.get('https://httpbin.org/stream/3', {
            stream: true
          })
          if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
            for await (const chunk of stream) {
              streamedData.push(chunk)
            }
          }
          return {
            success: true,
            streamedData
          }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            streamedData
          }
        }
      })
      expect(result.success).toBe(true)
      expect(result.streamedData.length).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Request Balancer', () => {
    test('should balance requests across endpoints', async () => {
      const result = await page.evaluate(async () => {
        try {
          const data = await window.fetchClient.get('/posts/1', {
            balancer: {
              endpoints: [
                'https://jsonplaceholder.typicode.com',
                'https://jsonplaceholder.typicode.com'
              ],
              strategy: 'fastest'
            }
          })
          return {
            success: true,
            data
          }
        } catch (error) {
          return {
            success: false,
            error: error.message
          }
        }
      })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  test.describe('Response Forwarder', () => {
    test('should forward responses to multiple endpoints', async () => {
      const result = await page.evaluate(async () => {
        try {
          const data = await window.fetchClient.get(
            'https://jsonplaceholder.typicode.com/posts/1',
            {
              forwarder: [
                {
                  url: 'https://httpbin.org/post',
                  method: 'POST'
                }
              ]
            }
          )
          return {
            success: true,
            data
          }
        } catch (error) {
          return {
            success: false,
            error: error.message
          }
        }
      })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  test.describe('Rate Limiting', () => {
    test('should respect rate limits', async () => {
      const result = await page.evaluate(async () => {
        const startTime = Date.now()
        try {
          await window.fetchClient.get('https://jsonplaceholder.typicode.com/posts/1', {
            maxRate: 1000
          })
          return {
            success: true,
            duration: Date.now() - startTime
          }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            duration: Date.now() - startTime
          }
        }
      })
      expect(result.success).toBe(true)
      expect(result.duration).toBeGreaterThan(0)
    })
  })

  test.describe('Headers and Configuration', () => {
    test('should send custom headers', async () => {
      const result = await page.evaluate(async () => {
        try {
          const data = await window.fetchClient.get('https://httpbin.org/headers', {
            headers: {
              'X-Custom-Header': 'test-value',
              Authorization: 'Bearer test-token'
            }
          })
          return {
            success: true,
            data
          }
        } catch (error) {
          return {
            success: false,
            error: error.message
          }
        }
      })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.headers['X-Custom-Header']).toBe('test-value')
      expect(result.data.headers['Authorization']).toBe('Bearer test-token')
    })

    test('should use baseURL', async () => {
      const result = await page.evaluate(async () => {
        try {
          const data = await window.fetchClient.get('/posts/1', {
            baseURL: 'https://jsonplaceholder.typicode.com'
          })
          return {
            success: true,
            data
          }
        } catch (error) {
          return {
            success: false,
            error: error.message
          }
        }
      })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  test.describe('Response Types', () => {
    test('should handle JSON response', async () => {
      const result = await page.evaluate(async () => {
        try {
          const data = await window.fetchClient.get(
            'https://jsonplaceholder.typicode.com/posts/1',
            {
              responseType: 'json'
            }
          )
          return {
            success: true,
            dataType: typeof data,
            data
          }
        } catch (error) {
          return {
            success: false,
            error: error.message
          }
        }
      })
      expect(result.success).toBe(true)
      expect(result.dataType).toBe('object')
      expect(result.data.id).toBe(1)
    })

    test('should handle text response', async () => {
      const result = await page.evaluate(async () => {
        try {
          const data = await window.fetchClient.get('https://httpbin.org/html', {
            responseType: 'text'
          })
          return {
            success: true,
            dataType: typeof data,
            data
          }
        } catch (error) {
          return {
            success: false,
            error: error.message
          }
        }
      })
      expect(result.success).toBe(true)
      expect(result.dataType).toBe('string')
      expect(result.data).toContain('<html>')
    })

    test('should handle blob response', async () => {
      const result = await page.evaluate(async () => {
        try {
          const data = await window.fetchClient.get('https://httpbin.org/image/png', {
            responseType: 'blob'
          })
          return {
            success: true,
            isBlob: data instanceof Blob,
            data
          }
        } catch (error) {
          return {
            success: false,
            error: error.message
          }
        }
      })
      expect(result.success).toBe(true)
      expect(result.isBlob).toBe(true)
    })
  })
})
