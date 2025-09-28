# SSL Pinning

This guide covers SSL certificate pinning for enhanced security.

## 🔒 Overview

SSL pinning validates that the server's SSL certificate matches one of the provided pin hashes before making the request. If the certificate doesn't match any of the pins, the request is rejected.

## 🔑 SSL Pinning Methods

The library supports SSL pinning with the following features:
- **SHA-256 Pinning** - Uses SHA-256 hashes of public keys
- **Multiple Pins** - Support for up to 20 pins per request
- **Forwarder Support** - Individual SSL pinning per forwarder endpoint
- **Error Handling** - Clear error messages for validation failures

## 🔗 SSL Pinning Methods

### Single SSL Pin

```typescript
// Basic SSL pinning
const response = await fetch.get('https://api.example.com/secure-data', {
  sslPinning: ['CkrNrRxPZuk9q6wGw1YrpuXN8ZPI1sQrLcvLdlWIjjE=']
})

console.log('Secure data:', response)
```

### Multiple SSL Pins

```typescript
// Multiple pins - any one valid will pass
const response = await fetch.get('https://api.example.com/data', {
  sslPinning: [
    'CkrNrRxPZuk9q6wGw1YrpuXN8ZPI1sQrLcvLdlWIjjE=',
    '1jXwPJjk3SAhvkPxGFQ0VP8KMMN1FEFUNBOz2uaHHGk=',
    'backup-pin-hash-123456789'
  ]
})
```

### Error Handling

```typescript
try {
  const response = await fetch.get('https://api.example.com/data', {
    sslPinning: ['invalid-pin-hash']
  })
} catch (error) {
  if (error instanceof FetchError) {
    console.log('SSL Pinning Error:', error.message)
    // Output: SSL pinning validation failed. Certificate hash: CkrNrRxPZuk9q6wGw1YrpuXN8ZPI1sQrLcvLdlWIjjE=, Expected pins: invalid-pin-hash
  }
}
```

## 🔄 Forwarder SSL Pinning

```typescript
const response = await fetch.get('https://api.example.com/data', {
  forwarder: [
    {
      method: 'POST',
      url: 'https://webhook1.example.com/endpoint',
      sslPinning: ['webhook1-pin-hash-1', 'webhook1-pin-hash-2'],
      headers: { 'Content-Type': 'application/json' },
      body: (data) => ({ forwarded: data })
    },
    {
      method: 'POST',
      url: 'https://webhook2.example.com/endpoint',
      sslPinning: ['webhook2-pin-hash'],
      headers: { 'Content-Type': 'application/json' },
      body: (data) => ({ forwarded: data })
    },
    {
      method: 'POST',
      url: 'https://webhook3.example.com/endpoint',
      // No SSL pinning - works normally
      headers: { 'Content-Type': 'application/json' },
      body: (data) => ({ forwarded: data })
    }
  ]
})
```

## ⚠️ Limitations

**SSL pinning is only allowed for backend/Node.js environments:**

- **Browser Security Model**: Browsers prevent JavaScript from accessing SSL certificates
- **Client-Side Vulnerability**: SSL pinning in browsers would expose certificate hashes to attackers
- **Man-in-the-Middle Risk**: Client-side pinning can be bypassed by malicious scripts or extensions
- **Certificate Transparency**: Browsers handle certificate validation through their own mechanisms

## 🚀 Next Steps

- [Advanced Usage](./advanced-usage.md) - Configuration options and patterns
- [Error Handling](./error-handling.md) - Error handling patterns
- [Request Balancer](./request-balancer.md) - Load balancing and failover examples
- [Response Forwarder](./response-forwarder.md) - Response forwarding and observability examples
- [Progress Tracking](./progress-tracking.md) - Upload and download progress
- [Streaming](./streaming.md) - Real-time data streaming