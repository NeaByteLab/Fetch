<div align="center">
  <h1>@neabyte/fetch</h1>
  <p>
    HTTP client with timeout, retries, streaming, downloads, and error handling for browser and Node.js.
  </p>
  <p>
    <a href="https://www.typescriptlang.org/">
      <img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" alt="TypeScript">
    </a>
    <a href="https://www.npmjs.com/package/@neabyte/fetch">
      <img alt="npm version" src="https://img.shields.io/npm/v/@neabyte/fetch.svg?color=red">
    </a>
    <a href="https://github.com/NeaByteLab/Fetch/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
    </a>
    <a href="https://bundlephobia.com/result?p=@neabyte/fetch">
      <img src="https://badgen.net/bundlephobia/minzip/@neabyte/fetch" alt="Bundle Size">
    </a>
    <a href="https://nodejs.org/">
      <img src="https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen" alt="Node.js">
    </a>
  </p>
  <table style="margin: 0 auto;">
    <tr>
      <td>
        <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/chrome/chrome_48x48.png" alt="Chrome" width="48" height="48">
      </td>
      <td>
        <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/firefox/firefox_48x48.png" alt="Firefox" width="48" height="48">
      </td>
      <td>
        <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/safari/safari_48x48.png" alt="Safari" width="48" height="48">
      </td>
      <td>
        <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/opera/opera_48x48.png" alt="Opera" width="48" height="48">
      </td>
      <td>
        <img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/edge/edge_48x48.png" alt="Edge" width="48" height="48">
      </td>
    </tr>
    <tr>
      <td>Latest ✔</td>
      <td>Latest ✔</td>
      <td>Latest ✔</td>
      <td>Latest ✔</td>
      <td>Latest ✔</td>
    </tr>
  </table>
</div>

## ✨ Features

- 🌐 **Universal Support** - Browser and Node.js
- ❌ **Request Cancellation** - `AbortSignal` support
- ⏱️ **Timeout Control** - Configurable timeouts (default: 30s)
- 🔄 **Retry Logic** - Exponential backoff with Retry-After header support
- 📡 **NDJSON Streaming** - Real-time JSON processing
- 📊 **Progress Tracking** - Upload and download progress
- 🚦 **Rate Limiting** - Control transfer speeds with `maxRate` option
- 📦 **Request Bodies** - JSON, FormData, URLSearchParams, binary data
- 📥 **File Downloads** - Cross-platform file downloads
- ⚖️ **Request Balancer** - Load balance requests across multiple endpoints
- 📨 **Response Forwarder** - Forward responses to multiple endpoints
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

// Rate limiting for downloads (100KB/s)
const file = await fetch.get('https://example.com/large-file.zip', {
  download: true,
  filename: 'large-file.zip',
  maxRate: 100 * 1024, // 100KB/s
  onProgress: (percentage) => console.log(`Download: ${percentage}%`)
})

// Rate limiting for uploads (50KB/s)
const result = await fetch.post('https://api.example.com/upload', fileData, {
  maxRate: 50 * 1024, // 50KB/s
  onProgress: (percentage) => console.log(`Upload: ${percentage}%`)
})
```

For detailed examples and usage patterns, see the [documentation](./docs/README.md).

---

## 🗺️ Roadmap

### 🔮 **Planned Features**
- [ ] **Authentication Helpers** - Basic, Bearer, and API key auth
- [ ] **Cookie Management** - Cookie handling
- [ ] **HTTP Proxy Support** - HTTP proxy connections
- [ ] **Proxy Authentication** - Username/password for proxies
- [ ] **Request/Response Interceptors** - Request and response modification
- [ ] **Request/Response Transformers** - Data transformation
- [ ] **SOCKS Proxy Support** - SOCKS4/SOCKS5 proxy connections

### 📋 **Future Considerations**
- [ ] Additional proxy types and configurations
- [ ] Enhanced proxy error handling
- [ ] Proxy connection pooling

---

## 📄 License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
