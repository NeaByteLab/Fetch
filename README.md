# @neabyte/fetch

HTTP client based on the Fetch API with timeout, retries, streaming, downloads, and error handling for browser and Node.js.

## ✨ Features

- **Universal**: Works in browser and Node.js
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **Request Body**: Support for JSON, FormData, URLSearchParams, Blob, ArrayBuffer, Uint8Array, and plain objects
- **Retry Logic**: Automatic retries with exponential backoff (default: 1 retry)
- **Timeout Support**: Configurable request timeouts (default: 30s)
- **Streaming**: Real-time data streaming with NDJSON, text, and binary support
- **Downloads**: File download support for both browser and Node.js with progress tracking
- **Progress Tracking**: Callbacks for upload/download progress
- **Error Handling**: Custom FetchError with status codes and response data
- **Abort Support**: Request cancellation via AbortSignal

---

## 📦 Installation

```bash
npm install @neabyte/fetch
```

## 🚀 Quick Start

```typescript
import fetch from '@neabyte/fetch'

// Basic GET request
const users = await fetch.get<User[]>('https://api.example.com/users')

// POST request with JSON body
const newUser = await fetch.post<User>('/api/users', {
  name: 'John Doe',
  email: 'john@example.com'
}, {
  baseURL: 'https://api.example.com'
})

// With configuration
const data = await fetch.get<ApiResponse>('/api/data', {
  timeout: 5000,
  retries: 3,
  headers: {
    'Authorization': 'Bearer token'
  }
})
```

---

## 📚 API Reference

### HTTP Methods

All methods return a `Promise` that resolves to the parsed response data. For methods without response bodies (HEAD, OPTIONS, DELETE), it returns `undefined`.

#### `fetch.get<T>(url, options?)`
Makes a GET request.

#### `fetch.post<T>(url, body?, options?)`
Makes a POST request with optional body.

#### `fetch.put<T>(url, body?, options?)`
Makes a PUT request with optional body.

#### `fetch.patch<T>(url, body?, options?)`
Makes a PATCH request with optional body.

#### `fetch.delete<T>(url, options?)`
Makes a DELETE request.

#### `fetch.head<T>(url, options?)`
Makes a HEAD request.

#### `fetch.options<T>(url, options?)`
Makes an OPTIONS request.

**Parameters:**
- `url` (string): Request URL (relative or absolute)
- `body` (FetchRequestBody, optional): Request body for POST/PUT/PATCH
- `options` (FetchOptions, optional): Request configuration

**Returns:** `Promise<T | AsyncIterable<T> | undefined>`

### ⚙️ Configuration Options

```typescript
interface FetchOptions {
  timeout?: number                       // Request timeout in ms (default: 30000)
  retries?: number                       // Number of retry attempts (default: 1)
  headers?: Record<string, string>       // Additional headers
  baseURL?: string                       // Base URL for relative URLs
  signal?: AbortSignal                   // Abort signal for cancellation
  stream?: boolean                       // Enable streaming response (default: false)
  download?: boolean                     // Enable file download (default: false)
  filename?: string                      // Filename for download (required if download: true)
  responseType?: 'auto' | 'json' | 'text' | 'buffer' | 'blob'  // Response parsing type (default: 'auto')
  onProgress?: (percentage: number) => void  // Progress callback for downloads
}

type FetchRequestBody =
  | string
  | FormData
  | URLSearchParams
  | Blob
  | ArrayBuffer
  | Uint8Array
  | Record<string, unknown>
```

## 📖 Usage Examples

### Basic Requests

```typescript
// GET request
const users = await fetch.get('https://jsonplaceholder.typicode.com/users')

// POST with JSON
const newPost = await fetch.post('https://jsonplaceholder.typicode.com/posts', {
  title: 'foo',
  body: 'bar',
  userId: 1
})

// PUT request
const updatedPost = await fetch.put('https://jsonplaceholder.typicode.com/posts/1', {
  title: 'updated title'
})

// DELETE request
await fetch.delete('https://jsonplaceholder.typicode.com/posts/1')
```

### Request Bodies

```typescript
// JSON object (automatically serialized)
const data = await fetch.post('/api/data', { key: 'value' })

// FormData
const formData = new FormData()
formData.append('file', fileInput.files[0])
formData.append('name', 'example')
const result = await fetch.post('/api/upload', formData)

// URLSearchParams
const params = new URLSearchParams()
params.append('query', 'search term')
const searchResults = await fetch.post('/api/search', params)

// Binary data
const buffer = new ArrayBuffer(1024)
const result = await fetch.post('/api/binary', buffer)
```

### Configuration Options

```typescript
// Timeout and retries
const data = await fetch.get('/api/slow-endpoint', {
  timeout: 10000,  // 10 seconds
  retries: 5       // 5 retry attempts
})

// Custom headers
const authData = await fetch.get('/api/protected', {
  headers: {
    'Authorization': 'Bearer token123',
    'X-API-Key': 'key456'
  }
})

// Base URL
const api = await fetch.get('/users', {
  baseURL: 'https://api.example.com'
})
```

### Streaming Responses

```typescript
// NDJSON streaming
const stream = await fetch.get('/api/events', { stream: true })
for await (const event of stream) {
  console.log('Received event:', event)
}

// Text streaming
const textStream = await fetch.get('/api/logs', {
  stream: true,
  responseType: 'text'
})
for await (const chunk of textStream) {
  console.log('Log chunk:', chunk)
}
```

### File Downloads

```typescript
// Browser download
await fetch.get('/api/file.pdf', {
  download: true,
  filename: 'document.pdf'
})

// Node.js download with progress
await fetch.get('/api/large-file.zip', {
  download: true,
  filename: 'archive.zip',
  onProgress: (percentage) => {
    console.log(`Download progress: ${percentage}%`)
  }
})
```

### Request Cancellation

```typescript
const controller = new AbortController()

// Start request
const promise = fetch.get('/api/slow-operation', {
  signal: controller.signal
})

// Cancel after 1 second
setTimeout(() => controller.abort(), 1000)

try {
  const result = await promise
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled')
  }
}
```

### Response Types

```typescript
// Auto-detection (default)
const jsonData = await fetch.get('/api/data')  // Parses as JSON

// Explicit types
const text = await fetch.get('/api/html', { responseType: 'text' })
const buffer = await fetch.get('/api/binary', { responseType: 'buffer' })
const blob = await fetch.get('/api/image', { responseType: 'blob' })
```

### Error Handling

```typescript
import { FetchError } from '@neabyte/fetch'

try {
  const data = await fetch.get('/api/data')
  console.log('Success:', data)
} catch (error) {
  if (error instanceof FetchError) {
    console.log('HTTP Error:', error.status, error.message)
    console.log('URL:', error.url)
    console.log('Response data:', error.data)
  } else {
    console.log('Network error:', error.message)
  }
}
```

### Advanced Usage

```typescript
// Complex configuration
const result = await fetch.post('/api/complex', {
  data: { nested: { value: 123 } },
  files: formData
}, {
  baseURL: 'https://api.example.com',
  timeout: 30000,
  retries: 3,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  onProgress: (percent) => console.log(`${percent}% complete`)
})
```

## 🚨 Error Handling

The library throws `FetchError` for HTTP errors and other issues:

```typescript
class FetchError extends Error {
  status?: number      // HTTP status code
  data?: unknown       // Response body data
  url?: string         // Request URL
}
```

Retry behavior:
- **4xx errors**: No retries (client errors)
- **5xx errors**: Automatic retries with exponential backoff
- **Network errors**: Automatic retries
- **Timeouts**: Automatic retries
- **Aborts**: No retries

---

## 📄 License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
