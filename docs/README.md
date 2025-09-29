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
- `fetch.trace(url, options?)` - TRACE request

### Import & Usage

```typescript
// Main class and error handling
import fetch, { FetchError } from '@neabyte/fetch'

// TypeScript types
import type { AuthConfig } from '@neabyte/fetch'
```

### Configuration Options
```typescript
type FetchRequestBody =
  | string
  | FormData
  | URLSearchParams
  | Blob
  | ArrayBuffer
  | Uint8Array
  | Record<string, unknown>

type FetchResponseType = 'auto' | 'json' | 'text' | 'buffer' | 'blob'

interface BalancerConfig {
  /** Array of endpoint URLs to balance across */
  endpoints: string[]
  /** Load balancing strategy to use */
  strategy: 'fastest' | 'parallel'
}

interface ForwarderEndpoint<T = unknown> {
  /** HTTP method for forwarding */
  method: string
  /** URL to forward to */
  url: string
  /** Headers to include in forwarded request */
  headers?: Record<string, string>
  /** Request body to forward - can be static data or a function that receives original response */
  body?: ForwarderBodyFunction<T> | Record<string, unknown> | string | number | boolean | null
  /** Timeout for this forwarder endpoint (ms) */
  timeout?: number
  /** Number of retry attempts for this forwarder endpoint */
  retries?: number
  /** SSL pinning hashes for certificate validation */
  sslPinning?: string[]
}

interface FetchOptions {
  /** Authentication configuration */
  auth?: AuthConfig
  /** Load balancer configuration */
  balancer?: BalancerConfig
  /** Base URL for relative requests */
  baseURL?: string
  /** Request body data */
  body?: FetchRequestBody
  /** Enable file download mode */
  download?: boolean
  /** Filename for downloads */
  filename?: string
  /** Response forwarding configuration */
  forwarder?: ForwarderEndpoint[]
  /** Additional request headers */
  headers?: Record<string, string>
  /** Maximum transfer rate in bytes per second (for downloads/uploads) */
  maxRate?: number
  /** Progress callback for downloads */
  onProgress?: (percentage: number) => void
  /** Number of retry attempts */
  retries?: number
  /** Response parsing type */
  responseType?: FetchResponseType
  /** Abort signal for cancellation */
  signal?: AbortSignal
  /** SSL pinning hashes for certificate validation */
  sslPinning?: string[]
  /** Enable streaming response */
  stream?: boolean
  /** Request timeout in milliseconds */
  timeout?: number
  /** Enable cookie management */
  withCookies?: boolean
}
```

---

## 📖 Examples

### 📚 Documentation & Examples
Guides with markdown explanations and TypeScript code:

- **[General Usage](./examples/general-usage.md)** - HTTP methods and common usage patterns
  - 📁 [TypeScript Code | ./examples/general-usage.ts](../examples/general-usage.ts)

- **[Authentication](./examples/authentication.md)** - Basic, Bearer, and API key authentication
  - 📁 [TypeScript Code | ./examples/authentication.ts](../examples/authentication.ts)

- **[SSL Pinning](./examples/ssl-pinning.md)** - SSL certificate pinning for enhanced security
  - 📁 [TypeScript Code | ./examples/ssl-pinning.ts](../examples/ssl-pinning.ts)

- **[Request Balancer](./examples/request-balancer.md)** - Load balancing and failover examples
  - 📁 [TypeScript Code | ./examples/request-balancer.ts](../examples/request-balancer.ts)

- **[Response Forwarder](./examples/response-forwarder.md)** - Response forwarding and observability examples
  - 📁 [TypeScript Code | ./examples/response-forwarder.ts](../examples/response-forwarder.ts)

- **[Progress Tracking](./examples/progress-tracking.md)** - Upload and download progress
  - 📁 [TypeScript Code | ./examples/progress-tracking.ts](../examples/progress-tracking.ts)

- **[Streaming](./examples/streaming.md)** - Real-time data streaming / chunking
  - 📁 [TypeScript Code | ./examples/streaming.ts](../examples/streaming.ts)

#### 🚧 Pending Examples
- [Cookie Management](./examples/cookie-management.md) - Cookie handling and management
- [Advanced Usage](./examples/advanced-usage.md) - Configuration options and patterns
- [Error Handling](./examples/error-handling.md) - Error handling patterns

### 💻 How To Run
```sh
cd <path>/Fetch
npx tsx ./examples/filename.ts
```

## 🏗️ Architecture

- [Request Balancer](./architecture/request-balancer.md) - Load balancing strategies and patterns
- [Response Forwarder](./architecture/response-forwarder.md) - Response forwarding and observability

## 🔗 Links

- [Main README](../README.md)
- [GitHub Repository](https://github.com/NeaByteLab/Fetch)
- [NPM Package](https://www.npmjs.com/package/@neabyte/fetch)
