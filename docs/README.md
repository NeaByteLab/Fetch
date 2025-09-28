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
// Main class
import fetch, { FetchError } from '@neabyte/fetch'

// TypeScript types
import type {
  AuthApiKey,
  AuthBasic,
  AuthBearer,
  AuthConfig,
  BalancerConfig,
  FetchOptions,
  FetchRequestBody,
  FetchResponse,
  ForwarderEndpoint,
  TimeoutController
} from '@neabyte/fetch'

// Additional handlers (optional)
import { BalancerHandler, ForwarderHandler } from '@neabyte/fetch'

// Utility functions
import { createHeaders, createAuthHeaders } from '@neabyte/fetch'

```

### Configuration Options

```typescript
interface FetchOptions {
  // Authentication
  auth?: AuthConfig                      // Authentication configuration (Basic, Bearer, API Key)

  // Basic configuration
  timeout?: number                       // Request timeout in ms (default: 30000)
  retries?: number                       // Number of retry attempts (default: 1)
  headers?: Record<string, string>       // Additional headers
  baseURL?: string                       // Base URL for relative URLs
  signal?: AbortSignal                   // Abort signal for cancellation

  // Response handling
  stream?: boolean                       // Enable streaming response (default: false)
  download?: boolean                     // Enable file download (default: false)
  filename?: string                      // Filename for download (required if download: true)

  // Response parsing type (default: 'auto')
  responseType?: 'auto' | 'json' | 'text' | 'buffer' | 'blob'

  // Security
  sslPinning?: string[]                  // SSL certificate pinning hashes (max 20)

  // Additional features
  body?: FetchRequestBody                // Request body data
  maxRate?: number                       // Rate limiting in bytes per second
  balancer?: BalancerConfig              // Load balancer configuration
  forwarder?: ForwarderEndpoint[]        // Response forwarding configuration

  // Progress callback for uploads and downloads
  onProgress?: (percentage: number) => void
}
```

---

## 📖 Examples

### 🚀 TypeScript Examples (Live Code)
Ready-to-run TypeScript examples with full type safety:

- [General Usage](../examples/general-usage.ts) - Using all available HTTP methods
- [Request Balancer](../examples/request-balancer.ts) - Load balancing and failover examples

### 💻 How To Run
```sh
cd <path>/<project-name>
npx tsx ./examples/filename.ts
```

### 📚 Documentation Examples
Detailed markdown examples with explanations:

- [Basic Usage](./examples/basic-usage.md) - HTTP methods and common usage patterns
- [Authentication](./examples/authentication.md) - Basic, Bearer, and API key authentication
- [SSL Pinning](./examples/ssl-pinning.md) - SSL certificate pinning for enhanced security
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
