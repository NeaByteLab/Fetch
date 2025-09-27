# Basic Usage

This guide covers all the basic HTTP methods and common usage patterns.

## 📦 Import & Setup

```typescript
// ES Modules
import fetch from '@neabyte/fetch'

// CommonJS
const fetch = require('@neabyte/fetch').default

// TypeScript with types
import fetch from '@neabyte/fetch'
import type { FetchError, FetchOptions, FetchResponse } from '@neabyte/fetch'
```

## 🔗 HTTP Methods

### GET Request

```typescript
// Simple GET request
const users = await fetch.get('https://jsonplaceholder.typicode.com/users')

// GET with options
const user = await fetch.get('https://jsonplaceholder.typicode.com/users/1', {
  timeout: 5000,
  retries: 2
})
```

### POST Request

```typescript
// POST with JSON body
const newPost = await fetch.post('https://jsonplaceholder.typicode.com/posts', {
  title: 'My New Post',
  body: 'This is the content',
  userId: 1
})

// POST with options
const result = await fetch.post('https://api.example.com/data', {
  name: 'John Doe',
  email: 'john@example.com'
}, {
  headers: {
    'Authorization': 'Bearer token123'
  }
})
```

### PUT Request

```typescript
// Update existing resource
const updatedPost = await fetch.put('https://jsonplaceholder.typicode.com/posts/1', {
  title: 'Updated Title',
  body: 'Updated content'
})

// PUT with custom headers
const updatedUser = await fetch.put('https://api.example.com/users/1', {
  name: 'John Smith'
}, {
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### PATCH Request

```typescript
// Partial update
const patchedPost = await fetch.patch('https://jsonplaceholder.typicode.com/posts/1', {
  title: 'New Title'
})

// PATCH with multiple fields
const patchedUser = await fetch.patch('https://api.example.com/users/1', {
  email: 'newemail@example.com',
  phone: '+1234567890'
})
```

### DELETE Request

```typescript
// Delete resource
await fetch.delete('https://jsonplaceholder.typicode.com/posts/1')

// DELETE with options
await fetch.delete('https://api.example.com/users/1', {
  headers: {
    'Authorization': 'Bearer token123'
  }
})
```

### HEAD Request

```typescript
// Get headers only
const headers = await fetch.head('https://jsonplaceholder.typicode.com/posts')

// HEAD with custom headers
const responseHeaders = await fetch.head('https://api.example.com/data', {
  headers: {
    'Authorization': 'Bearer token123'
  }
})
```

### OPTIONS Request

```typescript
// Check allowed methods
const options = await fetch.options('https://api.example.com/users')

// OPTIONS with custom headers
const allowedMethods = await fetch.options('https://api.example.com/data', {
  headers: {
    'Origin': 'https://example.com'
  }
})
```

## ⚙️ Common Configuration

### Base URL

```typescript
// Set base URL for relative requests
const api = await fetch.get('/users', {
  baseURL: 'https://api.example.com'
})
// This makes a request to: https://api.example.com/users
```

### Custom Headers

```typescript
// Single request headers
const data = await fetch.get('https://api.example.com/data', {
  headers: {
    'Authorization': 'Bearer token123',
    'X-API-Key': 'key456',
    'Content-Type': 'application/json'
  }
})
```

### Timeout and Retries

```typescript
// Configure timeout and retries
const data = await fetch.get('https://api.example.com/slow-endpoint', {
  timeout: 10000,  // 10 seconds
  retries: 3       // 3 retry attempts
})
```

### Response Types

```typescript
// Auto-detect response type (default)
const jsonData = await fetch.get('https://api.example.com/data')

// Force specific response type
const textData = await fetch.get('https://api.example.com/text', {
  responseType: 'text'
})

const binaryData = await fetch.get('https://api.example.com/file', {
  responseType: 'buffer'
})
```

## 📝 Request Bodies

### JSON Objects

```typescript
// Automatically serialized to JSON
const result = await fetch.post('https://api.example.com/data', {
  name: 'John',
  age: 30,
  active: true
})
```

### Form Data

```typescript
// URLSearchParams
const params = new URLSearchParams()
params.append('name', 'John')
params.append('email', 'john@example.com')

const result = await fetch.post('https://api.example.com/form', params)
```

### String Data

```typescript
// Plain text
const result = await fetch.post('https://api.example.com/text', 'Hello World')

// XML
const xmlData = '<user><name>John</name></user>'
const result = await fetch.post('https://api.example.com/xml', xmlData)
```

## ⚠️ Error Handling

### Basic Error Handling

```typescript
try {
  const data = await fetch.get('https://api.example.com/data')
  console.log('Success:', data)
} catch (error) {
  console.log('Error:', error.message)
}
```

### FetchError Details

```typescript
import type { FetchError } from '@neabyte/fetch'

try {
  const data = await fetch.get('https://api.example.com/data')
} catch (error) {
  if (error instanceof FetchError) {
    console.log('HTTP Error:', error.status)
    console.log('Message:', error.message)
    console.log('URL:', error.url)
    console.log('Response Data:', error.data)
  } else {
    console.log('Network Error:', error.message)
  }
}
```

## 🚀 Next Steps

- [Advanced Usage](./advanced-usage.md) - Configuration options and patterns
- [Error Handling](./error-handling.md) - Error handling patterns
- [Progress Tracking](./progress-tracking.md) - Upload and download progress
- [Streaming](./streaming.md) - Real-time data streaming
