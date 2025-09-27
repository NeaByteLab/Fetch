# @neabyte/fetch

HTTP client with timeout, retries, streaming, downloads, and error handling for browser and Node.js.

## ✨ Features

### 🌐 **Core**
- Works in browser and Node.js
- HTTP methods: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- Request cancellation via AbortSignal

### 📦 **Request Support**
- JSON objects (auto-serialized)
- FormData and URLSearchParams
- Binary data: Blob, ArrayBuffer, Uint8Array
- Plain objects and strings

### 🔄 **Reliability**
- Retries with exponential backoff and jitter
- Honors Retry-After headers from servers
- Configurable timeouts (default: 30s)
- Input validation for URLs and configuration

### 📡 **Additional Features**
- Content-type detection and parsing
- Streaming responses: NDJSON, text, and binary
- File downloads for browser and Node.js
- Progress tracking for both uploads and downloads

### ⚠️ **Error Handling**
- Custom FetchError with status codes and response data
- Structured error messages
- Network error handling

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

<!-- Direct Import -->
<script src="https://unpkg.com/@neabyte/fetch@latest/dist/index.js"></script>
```

## 📖 Examples

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
