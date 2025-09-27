# Authentication

This guide covers authentication methods including Basic, Bearer, and API key authentication.

## 🔐 Authentication Types

The library supports three authentication methods:
- **Basic Authentication** - Username and password credentials
- **Bearer Token** - JWT or access tokens
- **API Key** - Custom header authentication

## 📦 Import & Setup

```typescript
// ES Modules
import fetch from '@neabyte/fetch'
import type { AuthBasic, AuthBearer, AuthApiKey, FetchError } from '@neabyte/fetch'

// CommonJS
const fetch = require('@neabyte/fetch').default
```

## 🔑 Basic Authentication

### Simple Basic Auth

```typescript
// Basic authentication with username and password
const response = await fetch.get('https://httpbin.org/basic-auth/testuser/testpass', {
  auth: {
    type: 'basic',
    username: 'testuser',
    password: 'testpass'
  }
})

console.log('Authenticated:', response.authenticated) // true
console.log('User:', response.user) // testuser
```

### Basic Auth with API Client

```typescript
// Create an authenticated API client
class AuthenticatedClient {
  private baseURL: string
  private username: string
  private password: string

  constructor(baseURL: string, username: string, password: string) {
    this.baseURL = baseURL
    this.username = username
    this.password = password
  }

  private getAuthConfig(): AuthBasic {
    return {
      type: 'basic',
      username: this.username,
      password: this.password
    }
  }

  async getUsers() {
    return await fetch.get('/users', {
      baseURL: this.baseURL,
      auth: this.getAuthConfig()
    })
  }

  async createUser(userData: any) {
    return await fetch.post('/users', userData, {
      baseURL: this.baseURL,
      auth: this.getAuthConfig()
    })
  }
}

// Usage
const client = new AuthenticatedClient('https://api.example.com', 'admin', 'secret123')
const users = await client.getUsers()
```

## 🎫 Bearer Token Authentication

### Simple Bearer Token

```typescript
// Bearer token authentication
const response = await fetch.get('https://httpbin.org/bearer', {
  auth: {
    type: 'bearer',
    token: 'your-jwt-token-here'
  }
})

console.log('Authenticated:', response.authenticated) // true
console.log('Token:', response.token) // your-jwt-token-here
```

### Bearer Token with Retry

```typescript
// Bearer token with automatic retry on 401
async function fetchWithBearerToken(url: string, token: string) {
  try {
    return await fetch.get(url, {
      auth: { type: 'bearer', token }
    })
  } catch (error) {
    if (error instanceof FetchError && error.status === 401) {
      // Token expired, get new token and retry
      const newToken = await getNewToken()
      return await fetch.get(url, {
        auth: { type: 'bearer', token: newToken }
      })
    }
    throw error
  }
}

async function getNewToken(): Promise<string> {
  const response = await fetch.post('/auth/refresh', {})
  return response.accessToken
}
```

### JWT Token Validation

```typescript
// JWT token with validation
async function fetchWithJWT(url: string, jwtToken: string) {
  // Validate JWT format (basic check)
  if (!jwtToken.includes('.')) {
    throw new Error('Invalid JWT token format')
  }

  return await fetch.get(url, {
    auth: {
      type: 'bearer',
      token: jwtToken
    }
  })
}

// Usage
const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
const response = await fetchWithJWT('https://api.example.com/protected', jwtToken)
```

## 🔑 API Key Authentication

### Simple API Key

```typescript
// API key authentication with custom header
const response = await fetch.get('https://httpbin.org/headers', {
  auth: {
    type: 'apikey',
    key: 'X-API-Key',
    value: 'your-api-key-here'
  }
})

console.log('API Key sent:', response.headers['X-Api-Key']) // your-api-key-here
```

### Multiple API Keys

```typescript
// Different API keys for different services
const apiKeys = {
  'user-service': 'user-api-key-123',
  'payment-service': 'payment-api-key-456',
  'notification-service': 'notification-api-key-789'
}

async function requestWithService(service: string, endpoint: string) {
  const apiKey = apiKeys[service]
  if (!apiKey) {
    throw new Error(`Unknown service: ${service}`)
  }

  return await fetch.get(endpoint, {
    auth: {
      type: 'apikey',
      key: 'X-API-Key',
      value: apiKey
    }
  })
}

// Usage
const users = await requestWithService('user-service', '/users')
const payments = await requestWithService('payment-service', '/payments')
```

### API Key with Different Headers

```typescript
// Different API key header formats
const authConfigs = {
  // Standard API key
  standard: {
    type: 'apikey' as const,
    key: 'X-API-Key',
    value: 'standard-key-123'
  },

  // Authorization header
  authorization: {
    type: 'apikey' as const,
    key: 'Authorization',
    value: 'ApiKey auth-key-456'
  },

  // Custom header
  custom: {
    type: 'apikey' as const,
    key: 'X-Custom-Auth',
    value: 'custom-key-789'
  }
}

// Test different auth methods
for (const [name, auth] of Object.entries(authConfigs)) {
  try {
    const response = await fetch.get('https://httpbin.org/headers', { auth })
    console.log(`${name} auth successful`)
  } catch (error) {
    console.log(`${name} auth failed:`, error.message)
  }
}
```

## 🔄 Authentication with Other Features

```typescript
// Authentication with load balancing
const response = await fetch.get('/api/data', {
  auth: {
    type: 'bearer',
    token: 'jwt-token-123'
  },
  balancer: {
    endpoints: [
      'https://api1.example.com',
      'https://api2.example.com'
    ],
    strategy: 'fastest'
  }
})

// Authentication with response forwarding
const response2 = await fetch.get('/api/data', {
  auth: {
    type: 'apikey',
    key: 'X-API-Key',
    value: 'api-key-123'
  },
  forwarder: [
    {
      url: 'https://audit.example.com/log',
      method: 'POST'
    }
  ]
})
```

## 🛡️ Error Handling for Authentication

```typescript
// Handle authentication errors
try {
  const response = await fetch.get('https://api.example.com/protected', {
    auth: {
      type: 'bearer',
      token: 'invalid-token'
    }
  })
} catch (error) {
  if (error instanceof FetchError) {
    if (error.status === 401) {
      console.log('Authentication failed - invalid token')
      // Handle token refresh or re-authentication
    } else if (error.status === 403) {
      console.log('Access forbidden - insufficient permissions')
      // Handle permission errors
    } else {
      console.log('HTTP Error:', error.status, error.message)
    }
  }
}
```

## 🎯 Best Practices

### Environment-Based Authentication

```typescript
// Environment-based authentication configuration
function getAuthConfig(): AuthBasic | AuthBearer | AuthApiKey {
  const env = process.env.NODE_ENV || 'development'

  switch (env) {
    case 'production':
      return {
        type: 'bearer',
        token: process.env.PROD_API_TOKEN!
      }
    case 'staging':
      return {
        type: 'apikey',
        key: 'X-API-Key',
        value: process.env.STAGING_API_KEY!
      }
    case 'development':
      return {
        type: 'basic',
        username: process.env.DEV_USERNAME || 'dev',
        password: process.env.DEV_PASSWORD || 'dev'
      }
    default:
      throw new Error(`Unknown environment: ${env}`)
  }
}

// Usage
const authConfig = getAuthConfig()
const response = await fetch.get('/api/data', { auth: authConfig })
```

## 🚀 Next Steps

- [Advanced Usage](./advanced-usage.md) - Configuration options and patterns
- [Error Handling](./error-handling.md) - Error handling patterns
- [Request Balancer](./request-balancer.md) - Load balancing and failover examples
- [Response Forwarder](./response-forwarder.md) - Response forwarding and observability examples
- [Progress Tracking](./progress-tracking.md) - Upload and download progress
- [Streaming](./streaming.md) - Real-time data streaming
