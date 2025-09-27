# Advanced Usage

This guide covers configuration options and patterns.

## 🌐 BaseURL Configuration

### Single BaseURL

```typescript
// Set base URL for all requests
const api = {
  get: (path: string, options = {}) =>
    fetch.get(path, { ...options, baseURL: 'https://api.example.com' }),
  post: (path: string, body?: any, options = {}) =>
    fetch.post(path, body, { ...options, baseURL: 'https://api.example.com' })
}

// Usage
const users = await api.get('/users')
const newUser = await api.post('/users', { name: 'John' })
```

### Multiple BaseURLs

```typescript
// Different base URLs for different services
const services = {
  auth: (path: string, options = {}) =>
    fetch.get(path, { ...options, baseURL: 'https://auth.example.com' }),
  api: (path: string, options = {}) =>
    fetch.get(path, { ...options, baseURL: 'https://api.example.com' }),
  storage: (path: string, options = {}) =>
    fetch.get(path, { ...options, baseURL: 'https://storage.example.com' })
}

// Usage
const token = await services.auth('/token')
const data = await services.api('/data')
const file = await services.storage('/files/image.jpg')
```

### Dynamic BaseURL

```typescript
// BaseURL based on environment
function getBaseURL() {
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.example.com'
  } else if (process.env.NODE_ENV === 'staging') {
    return 'https://staging-api.example.com'
  } else {
    return 'http://localhost:3000'
  }
}

const response = await fetch.get('/users', {
  baseURL: getBaseURL()
})
```

## 📡 Headers Configuration

### Static Headers

```typescript
// Common headers for all requests
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'MyApp/1.0.0'
}

const response = await fetch.get('https://api.example.com/data', {
  headers: defaultHeaders
})
```

### Dynamic Headers

```typescript
// Headers that change based on request
async function fetchWithAuth(url: string, token: string) {
  return await fetch.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Request-ID': Math.random().toString(36).substr(2, 9),
      'X-Timestamp': Date.now().toString()
    }
  })
}
```

### Header Inheritance

```typescript
// Base headers with request-specific additions
const baseHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

const response = await fetch.post('https://api.example.com/data', data, {
  headers: {
    ...baseHeaders,
    'Authorization': 'Bearer token123',
    'X-Custom-Header': 'custom-value'
  }
})
```

## ⏱️ Timeout Configuration

### Basic Timeout

```typescript
// Simple timeout
const response = await fetch.get('https://api.example.com/data', {
  timeout: 5000 // 5 seconds
})
```

### Dynamic Timeout Based on Request Type

```typescript
// Different timeouts for different operations
const quickData = await fetch.get('/api/quick', { timeout: 2000 })
const slowData = await fetch.get('/api/slow', { timeout: 30000 })
const uploadData = await fetch.post('/api/upload', data, { timeout: 60000 })
```

### Timeout with Fallback

```typescript
async function fetchWithFallback(url: string, fallbackUrl: string) {
  const response = await fetch.get(url, { timeout: 3000 })
  return response
}
```

## 🔄 Retry Configuration

### Basic Retries

```typescript
// Simple retry configuration
const response = await fetch.get('https://api.example.com/data', {
  retries: 3
})
```

### Conditional Retries

```typescript
// Custom retry logic based on error type
async function fetchWithConditionalRetry(url: string) {
  const response = await fetch.get(url, { retries: 5 })
  return response
}
```

### Exponential Backoff with Retries

```typescript
// Combine retries with custom backoff
async function fetchWithBackoff(url: string) {
  const response = await fetch.get(url, {
    timeout: 5000,
    retries: 3
  })
  return response
}
```

## 🛑 Signal Configuration

### Basic AbortSignal

```typescript
// Simple request cancellation
const controller = new AbortController()

const promise = fetch.get('https://api.example.com/slow-data', {
  signal: controller.signal
})

// Cancel after 2 seconds
setTimeout(() => controller.abort(), 2000)

const data = await promise
```

### Timeout with AbortSignal

```typescript
// Manual timeout using AbortSignal
function fetchWithManualTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController()

  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  return fetch.get(url, { signal: controller.signal })
    .finally(() => {
      clearTimeout(timeoutId)
    })
}

// Usage
const data = await fetchWithManualTimeout('https://api.example.com/data', 5000)
```

### Multiple Request Cancellation

```typescript
// Cancel multiple requests with one signal
const controller = new AbortController()
const signal = controller.signal

const promises = [
  fetch.get('/api/data1', { signal }),
  fetch.get('/api/data2', { signal }),
  fetch.get('/api/data3', { signal })
]

// Cancel all requests
setTimeout(() => controller.abort(), 3000)

const results = await Promise.all(promises)
```

## 📄 Response Type Configuration

### Auto Detection

```typescript
// Let the library detect response type (default)
const jsonData = await fetch.get('https://api.example.com/json-data')
const textData = await fetch.get('https://api.example.com/text-data')
const binaryData = await fetch.get('https://api.example.com/binary-data')
```

### Explicit Response Types

```typescript
// Force specific response types
const jsonResponse = await fetch.get('https://api.example.com/data', {
  responseType: 'json'
})

const textResponse = await fetch.get('https://api.example.com/text', {
  responseType: 'text'
})

const bufferResponse = await fetch.get('https://api.example.com/file', {
  responseType: 'buffer'
})

const blobResponse = await fetch.get('https://api.example.com/image', {
  responseType: 'blob'
})
```

### Response Type Based on Content

```typescript
// Different response types for different content
async function fetchContent(url: string, contentType: string) {
  let responseType: 'json' | 'text' | 'buffer' | 'blob' = 'auto'

  if (contentType.includes('json')) {
    responseType = 'json'
  } else if (contentType.includes('text')) {
    responseType = 'text'
  } else if (contentType.includes('image') || contentType.includes('pdf')) {
    responseType = 'blob'
  } else {
    responseType = 'buffer'
  }

  return await fetch.get(url, { responseType })
}
```

## 🔧 Combined Configuration

### Complete Configuration Example

```typescript
// All options combined
const response = await fetch.post('https://api.example.com/complex-endpoint', {
  data: { key: 'value' }
}, {
  baseURL: 'https://api.example.com',
  timeout: 30000,
  retries: 3,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123',
    'X-API-Version': 'v2'
  },
  signal: controller.signal,
  responseType: 'json'
})
```

### Configuration Factory

```typescript
// Create reusable configuration
function createApiConfig(baseURL: string, token: string) {
  return {
    baseURL,
    timeout: 10000,
    retries: 2,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }
}

// Usage
const config = createApiConfig('https://api.example.com', 'token123')
const data = await fetch.get('/users', config)
```

## 🔄 Retry Strategies

### Request Interceptors Pattern

```typescript
// Create a wrapper with automatic token refresh
class AuthenticatedFetch {
  private accessToken: string
  private refreshToken: string

  constructor(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
  }

  private async refreshAccessToken(): Promise<string> {
    const response = await fetch.post('https://auth.example.com/refresh', {
      refreshToken: this.refreshToken
    })
    this.accessToken = response.accessToken
    return this.accessToken
  }

  async request(url: string, options: any = {}) {
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      ...options.headers
    }
    return await fetch.request(url, { ...options, headers })
  }
}
```

### Custom Retry Logic

```typescript
// Retry with custom conditions
async function fetchWithCustomRetry(url: string, options: any = {}) {
  const response = await fetch.get(url, {
    ...options,
    retries: options.retries || 3
  })
  return response
}
```

### Circuit Breaker Pattern

```typescript
// Circuit breaker for fault tolerance
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  private threshold: number
  private timeout: number

  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold
    this.timeout = timeout
  }

  async execute(url: string, options: any) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN'
      }
    }
    const result = await fetch.get(url, options)
    this.onSuccess()
    return result
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'CLOSED'
  }

  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    if (this.failures >= this.threshold) {
      this.state = 'OPEN'
    }
  }
}
```

## 📊 Batch Operations

### Parallel Requests

```typescript
// Fetch multiple resources simultaneously
async function fetchMultipleUsers(userIds: number[]) {
  const promises = userIds.map(id =>
    fetch.get(`https://jsonplaceholder.typicode.com/users/${id}`)
  )
  const users = await Promise.all(promises)
  return users
}
```

### Sequential Requests

```typescript
// Fetch data in sequence with dependencies
async function fetchUserWithPosts(userId: number) {
  // First get user
  const user = await fetch.get(`https://jsonplaceholder.typicode.com/users/${userId}`)
  // Then get user's posts
  const posts = await fetch.get(`https://jsonplaceholder.typicode.com/posts?userId=${userId}`)
  // Finally get comments for each post
  const postsWithComments = await Promise.all(
    posts.map(async (post: any) => {
      const comments = await fetch.get(`https://jsonplaceholder.typicode.com/posts/${post.id}/comments`)
      return { ...post, comments }
    })
  )
  return { user, posts: postsWithComments }
}
```

## 🚀 Performance Optimization

### Request Caching

```typescript
// Simple in-memory cache
class CachedFetch {
  private cache = new Map()
  private ttl: number

  constructor(ttl = 300000) { // 5 minutes
    this.ttl = ttl
  }

  async get(url: string, options: any = {}) {
    const cacheKey = `${url}-${JSON.stringify(options)}`
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log('Cache hit for:', url)
      return cached.data
    }
    console.log('Cache miss, fetching:', url)
    const data = await fetch.get(url, options)
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
    return data
  }

  clearCache() {
    this.cache.clear()
  }
}
```

### Request Deduplication

```typescript
// Prevent duplicate requests
class DeduplicatedFetch {
  private pendingRequests = new Map()

  async get(url: string, options: any = {}) {
    const requestKey = `${url}-${JSON.stringify(options)}`
    if (this.pendingRequests.has(requestKey)) {
      console.log('Deduplicating request:', url)
      return this.pendingRequests.get(requestKey)
    }
    const promise = fetch.get(url, options)
      .finally(() => {
        this.pendingRequests.delete(requestKey)
      })
    this.pendingRequests.set(requestKey, promise)
    return promise
  }
}
```

## 🔐 Security Patterns

### Request Signing

```typescript
// HMAC request signing
class SignedFetch {
  private apiKey: string
  private secretKey: string

  constructor(apiKey: string, secretKey: string) {
    this.apiKey = apiKey
    this.secretKey = secretKey
  }

  private signRequest(method: string, url: string, body: string = '') {
    const timestamp = Date.now().toString()
    const nonce = crypto.randomBytes(16).toString('hex')
    const message = `${method}${url}${body}${timestamp}${nonce}`
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(message)
      .digest('hex')

    return {
      'X-API-Key': this.apiKey,
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Signature': signature
    }
  }

  async request(method: string, url: string, body?: any) {
    const bodyString = body ? JSON.stringify(body) : ''
    const headers = this.signRequest(method, url, bodyString)

    return await fetch.request(url, {
      method,
      body: bodyString,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    })
  }
}
```

## 📈 Monitoring & Logging

### Request Logging

```typescript
// Request logging
class LoggedFetch {
  private logger: any

  constructor(logger: any) {
    this.logger = logger
  }

  async request(url: string, options: any = {}) {
    const startTime = Date.now()
    const requestId = Math.random().toString(36).substr(2, 9)

    this.logger.info('Request started', {
      requestId,
      url,
      method: options.method || 'GET',
      headers: options.headers
    })

    const response = await fetch.request(url, options)
    const duration = Date.now() - startTime

    this.logger.info('Request completed', {
      requestId,
      url,
      status: response.status,
      duration: `${duration}ms`
    })

    return response
  }
}
```

## 🎯 Best Practices

### Simple API Calls

```typescript
// Simple API calls
async function simpleApiCall(url: string, options: any = {}) {
  const response = await fetch.get(url, options)
  return response
}
```

### TypeScript Integration

```typescript
// Strongly typed API client
interface User {
  id: number
  name: string
  email: string
}

interface ApiResponse<T> {
  data: T
  status: number
  message: string
}

class TypedApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  async getUsers(): Promise<ApiResponse<User[]>> {
    return await fetch.get('/users', { baseURL: this.baseURL })
  }

  async getUser(id: number): Promise<ApiResponse<User>> {
    return await fetch.get(`/users/${id}`, { baseURL: this.baseURL })
  }

  async createUser(user: Omit<User, 'id'>): Promise<ApiResponse<User>> {
    return await fetch.post('/users', user, { baseURL: this.baseURL })
  }
}
```

## 🚀 Next Steps

- [Error Handling](./error-handling.md) - Error handling patterns
- [Request Balancer](./request-balancer.md) - Load balancing and failover examples
- [Response Forwarder](./response-forwarder.md) - Response forwarding and observability examples
- [Progress Tracking](./progress-tracking.md) - Upload and download progress
- [Streaming](./streaming.md) - Real-time data streaming