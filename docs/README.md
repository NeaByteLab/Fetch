# Documentation

This folder contains detailed documentation and examples for the @neabyte/fetch library.

## 📚 Contents

- **Examples** - Code examples and usage patterns
- **API Reference** - Detailed API documentation
- **TypeScript Types** - Type definitions and interfaces
- **Guides** - Step-by-step guides for common use cases

## 🚀 Quick Start

For installation and basic setup, see the main [README](../README.md).

## 🔧 Available Methods

- `fetch.get(url, options?)` - GET request
- `fetch.post(url, body?, options?)` - POST request
- `fetch.put(url, body?, options?)` - PUT request
- `fetch.patch(url, body?, options?)` - PATCH request
- `fetch.delete(url, options?)` - DELETE request
- `fetch.head(url, options?)` - HEAD request
- `fetch.options(url, options?)` - OPTIONS request

### Import & Usage

```typescript
// Main class
import fetch from '@neabyte/fetch'

// TypeScript types
import type {
  FetchError,
  FetchOptions,
  FetchResponse,
  FetchRequestBody,
  TimeoutController
} from '@neabyte/fetch'

// Utility function
import { createHeaders } from '@neabyte/fetch'
```

### Configuration Options

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

  // Response parsing type (default: 'auto')
  responseType?: 'auto' | 'json' | 'text' | 'buffer' | 'blob'
  // Progress callback for uploads and downloads
  onProgress?: (percentage: number) => void
}
```

---

## 📖 Examples

Detailed examples are organized by category:

- [Basic Usage](./examples/basic-usage.md) - HTTP methods and common usage patterns
- [Advanced Usage](./examples/advanced-usage.md) - Configuration options and patterns
- [Error Handling](./examples/error-handling.md) - Error handling patterns
- [Request Balancer](./examples/request-balancer.md) - Load balancing and failover examples
- [Response Forwarder](./examples/response-forwarder.md) - Response forwarding and observability examples
- [Progress Tracking](./examples/progress-tracking.md) - Upload and download progress
- [Streaming](./examples/streaming.md) - Real-time data streaming

## 🏗️ Architecture

- [Request Balancer](./architecture/request-balancer.md) - Load balancing strategies and patterns
- [Response Forwarder](./architecture/response-forwarder.md) - Response forwarding and observability

## 🔗 Links

- [Main README](../README.md)
- [GitHub Repository](https://github.com/NeaByteLab/Fetch)
- [NPM Package](https://www.npmjs.com/package/@neabyte/fetch)
