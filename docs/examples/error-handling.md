# Error Handling

This guide covers error handling patterns.

## 🔍 Error Types

The library throws `FetchError` for most errors and standard `Error` for some validation issues.

### FetchError Properties
- `message` - Error description
- `status` - HTTP status code (for HTTP errors)
- `data` - Response data (for HTTP errors)
- `url` - Request URL that failed

## 📝 Basic Error Handling

### Example 1: HTTP Status Errors

```typescript
import fetch, { FetchError } from '@neabyte/fetch'

try {
  const response = await fetch.get('https://httpbin.org/status/404')
} catch (error) {
  if (error instanceof FetchError) {
    console.log('HTTP Error:', error.status)  // 404
    console.log('Message:', error.message)    // HTTP 404: Not Found
    console.log('URL:', error.url)            // https://httpbin.org/status/404
    console.log('Data:', error.data)          // Response body data
  }
}
```

### Example 2: Validation and Configuration Errors

```typescript
try {
  // Invalid URL
  const response = await fetch.get('')
} catch (error) {
  if (error instanceof FetchError) {
    console.log('Validation Error:', error.message) // URL must be a non-empty string
  }
}

try {
  // Invalid retries
  const response = await fetch.get('https://api.example.com', { retries: -1 })
} catch (error) {
  if (error instanceof FetchError) {
    console.log('Config Error:', error.message) // Retries must be a non-negative number
  }
}

try {
  // Missing filename for download
  const response = await fetch.get('https://api.example.com/file.pdf', { download: true })
} catch (error) {
  if (error instanceof FetchError) {
    console.log('Download Error:', error.message) // Filename is required when download is enabled
  }
}
```

### Example 3: Network, Timeout, and Abort Errors

```typescript
try {
  const response = await fetch.get('https://httpbin.org/delay/5', {
    timeout: 2000
  })
} catch (error) {
  if (error instanceof FetchError) {
    if (error.message === 'Request aborted') {
      console.log('Request was aborted due to timeout')
    } else {
      console.log('Network error:', error.message)
    }
  } else {
    console.log('Unexpected error:', error.message)
  }
}

// Manual abort
const controller = new AbortController()
try {
  const promise = fetch.get('https://api.example.com', { signal: controller.signal })
  controller.abort()
  await promise
} catch (error) {
  if (error instanceof FetchError && error.message === 'Request aborted') {
    console.log('Request was manually aborted')
  }
}
```

## 🎯 Best Practices

- Always check `error instanceof FetchError` for most errors
- Check `error.message === 'Request aborted'` for timeout and cancellation
- Use `error.status` to get HTTP status codes
- Use `error.url` to identify which request failed
- Use `error.data` to access response body data
- Handle validation errors (empty URL, negative retries, missing filename)
- Use try-catch blocks around all fetch calls
- Log errors with context for debugging

## 🚀 Next Steps

- [Request Balancer](./request-balancer.md) - Load balancing and failover examples
- [Response Forwarder](./response-forwarder.md) - Response forwarding and observability examples
- [Progress Tracking](./progress-tracking.md) - Upload and download progress
- [Streaming](./streaming.md) - Real-time data streaming