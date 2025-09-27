# @neabyte/fetch

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![npm version](https://img.shields.io/npm/v/@neabyte/fetch.svg?color=red)](https://www.npmjs.com/package/@neabyte/fetch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/NeaByteLab/Fetch/blob/main/LICENSE)
[![Bundle Size](https://badgen.net/bundlephobia/minzip/@neabyte/fetch)](https://bundlephobia.com/result?p=@neabyte/fetch)

HTTP client with timeout, retries, streaming, downloads, and error handling for browser and Node.js.

## ✨ Features

- 🌐 **Universal Support** - Browser and Node.js
- ❌ **Request Cancellation** - AbortSignal support
- ⏱️ **Timeout Control** - Configurable timeouts (default: 30s)
- 🔄 **Retry Logic** - Exponential backoff with Retry-After header support
- 📡 **NDJSON Streaming** - Real-time JSON processing
- 📊 **Progress Tracking** - Upload and download progress
- 📦 **Request Bodies** - JSON, FormData, URLSearchParams, binary data
- 📥 **File Downloads** - Cross-platform file downloads
- 🛡️ **Error Handling** - Structured errors with full context

---

## 📦 Installation

### NPM
```bash
npm install @neabyte/fetch
```

### CDN (Browser)
```html
<!-- ES Modules (Recommended) -->
<script type="module">
  import fetch from 'https://cdn.jsdelivr.net/npm/@neabyte/fetch/+esm'
  // or
  import fetch from 'https://esm.sh/@neabyte/fetch'
  // or
  import fetch from 'https://esm.run/@neabyte/fetch'

  // Use fetch as normal
  const data = await fetch.get('https://api.example.com/data')
</script>

<!-- UMD (Global Variable) -->
<script src="https://unpkg.com/@neabyte/fetch@latest/dist/index.umd.min.js"></script>
<script>
  // Available as global variable 'Fetch' with default export
  const FetchClient = window.Fetch.default
  const data = await FetchClient.get('https://api.example.com/data')
</script>
```

## 📖 Quick Start

```typescript
import fetch from '@neabyte/fetch'
import type { FetchError } from '@neabyte/fetch'

// Simple GET request
const users = await fetch.get('https://jsonplaceholder.typicode.com/users')

// POST with JSON body
const newPost = await fetch.post('https://jsonplaceholder.typicode.com/posts', {
  title: 'My New Post',
  body: 'This is the content',
  userId: 1
})

// Error handling
try {
  const data = await fetch.get('https://api.example.com/data')
} catch (error) {
  if (error instanceof FetchError) {
    console.log('HTTP Error:', error.status, error.message)
  }
}
```

For detailed examples and usage patterns, see the [documentation](./docs/README.md).

---

## 🗺️ Roadmap

### 🔮 **Planned Features**
- [ ] **HTTP Proxy Support** - Connect through HTTP proxies
- [ ] **SOCKS Proxy Support** - Connect through SOCKS4/SOCKS5 proxies
- [ ] **Proxy Authentication** - Username/password authentication for proxies
- [ ] **Request Balancer** - Load balance requests across multiple endpoints
- [ ] **Response Forwarder** - Forward responses to multiple endpoints

### 📋 **Future Considerations**
- [ ] Additional proxy types and configurations
- [ ] Enhanced proxy error handling
- [ ] Proxy connection pooling
- [ ] Forwarder error handling and retry logic
- [ ] Request/response transformation for forwarder

---

## 📄 License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
