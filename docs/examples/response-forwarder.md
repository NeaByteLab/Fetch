# Response Forwarder Examples

This guide covers practical examples for using the Response Forwarder feature.

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

## 🔥 Basic Forwarding Examples

### Simple Logging

```typescript
// Forward response to logging service
const response = await fetch.get('/api/users', {
  forwarder: [
    {
      method: 'POST',
      url: 'https://logs.example.com/api/audit',
      headers: {
        'X-Source': 'api-gateway',
        'X-Timestamp': new Date().toISOString()
      }
    }
  ]
})
```

### Multiple Forwarders

```typescript
// Forward to multiple services
const response = await fetch.post('/api/orders', orderData, {
  forwarder: [
    {
      method: 'POST',
      url: 'https://analytics.example.com/api/events',
      headers: { 'X-Service': 'order-service' }
    },
    {
      method: 'PUT',
      url: 'https://inventory.example.com/api/update',
      headers: { 'X-Source': 'order-api' }
    },
    {
      method: 'POST',
      url: 'https://notifications.example.com/api/send',
      headers: { 'X-Type': 'order-created' }
    }
  ]
})
```

### Custom Headers

```typescript
// Forward with custom headers
const response = await fetch.get('/api/data', {
  forwarder: [
    {
      method: 'POST',
      url: 'https://monitoring.example.com/api/metrics',
      headers: {
        'Authorization': 'Bearer monitoring-token',
        'X-Request-ID': Math.random().toString(36).substr(2, 9),
        'X-Source-Service': 'data-api'
      }
    }
  ]
})
```

## 🚀 Function-Based Body Examples

### Dynamic Body Generation

```typescript
// Function-based body with original response access
const response = await fetch.get('/api/user/123', {
  forwarder: [
    {
      method: 'POST',
      url: 'https://logs.example.com/api/audit',
      body: (originalResponse) => ({
        timestamp: new Date().toISOString(),
        userId: originalResponse.data?.id,
        action: 'user_viewed',
        originalData: originalResponse.data,
        metadata: {
          responseSize: JSON.stringify(originalResponse).length,
          hasData: !!originalResponse?.data
        }
      })
    }
  ]
})
```

### Conditional Logging

```typescript
// Only log errors or specific conditions
const response = await fetch.get('/api/data', {
  forwarder: [
    {
      method: 'POST',
      url: 'https://alerts.example.com/api/errors',
      body: (response) => response.status >= 400 ? {
        alert: 'error_detected',
        error: response.error,
        severity: 'high',
        timestamp: new Date().toISOString(),
        url: response.url
      } : null  // Don't forward successful responses
    }
  ]
})
```

### Analytics with Metrics

```typescript
// Forward analytics data with performance metrics
const startTime = Date.now()

const response = await fetch.get('/api/analytics', {
  forwarder: [
    {
      method: 'POST',
      url: 'https://metrics.example.com/api/performance',
      body: (response) => ({
        event: 'api_response',
        data: response.data,
        metrics: {
          responseTime: Date.now() - startTime,
          dataSize: JSON.stringify(response).length,
          statusCode: response.status,
          timestamp: new Date().toISOString()
        }
      })
    }
  ]
})
```

### Data Transformation

```typescript
// Transform data before forwarding
const response = await fetch.post('/api/orders', orderData, {
  forwarder: [
    {
      method: 'POST',
      url: 'https://warehouse.example.com/api/inventory-update',
      body: (response) => ({
        orderId: response.data?.id,
        items: response.data?.items?.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          timestamp: new Date().toISOString()
        })),
        originalResponse: response.data
      })
    }
  ]
})
```

## 📞 Callback Strategy Examples

### Completion Callback

```typescript
// Monitor forwarder success rates
const response = await fetch.get('/api/data', {
  forwarder: [
    {
      method: 'POST',
      url: 'https://logs.example.com/api/audit'
    },
    {
      method: 'POST',
      url: 'https://analytics.example.com/api/events'
    }
  ],
  onComplete: (results) => {
    const successful = results.filter(r => r.success).length
    const failed = results.length - successful

    console.log(`Forwarding complete: ${successful} successful, ${failed} failed`)

    // Log individual failures
    results.forEach(result => {
      if (!result.success) {
        console.error(`Failed to forward to ${result.endpoint}:`, result.error)
      }
    })
  }
})
```

### Custom Error Handling

```typescript
// Custom error handling for forwarders
const response = await fetch.get('/api/data', {
  forwarder: [
    {
      method: 'POST',
      url: 'https://critical-service.example.com/api/data'
    },
    {
      method: 'POST',
      url: 'https://optional-service.example.com/api/data'
    }
  ],
  onComplete: (results) => {
    results.forEach(result => {
      if (!result.success) {
        if (result.endpoint.includes('critical-service')) {
          // Alert for critical service failures
          console.error('CRITICAL: Failed to forward to critical service')
          // Send alert notification
        } else {
          // Log optional service failures
          console.warn('Optional service forwarding failed:', result.error)
        }
      }
    })
  }
})
```

## 🔧 Advanced Configuration

### Timeout and Retry per Forwarder

```typescript
// Different timeout and retry settings per forwarder
const response = await fetch.get('/api/data', {
  forwarder: [
    {
      method: 'POST',
      url: 'https://fast-service.example.com/api/data',
      timeout: 2000,
      retries: 1
    },
    {
      method: 'POST',
      url: 'https://slow-service.example.com/api/data',
      timeout: 10000,
      retries: 3
    }
  ]
})
```

### Different HTTP Methods

```typescript
// Use different HTTP methods for different forwarders
const response = await fetch.post('/api/orders', orderData, {
  forwarder: [
    {
      method: 'POST',
      url: 'https://logs.example.com/api/audit'
    },
    {
      method: 'PUT',
      url: 'https://inventory.example.com/api/update'
    },
    {
      method: 'PATCH',
      url: 'https://notifications.example.com/api/send'
    }
  ]
})
```

### Static vs Dynamic Bodies

```typescript
// Mix of static and dynamic body configurations
const response = await fetch.get('/api/user/123', {
  forwarder: [
    // Static body
    {
      method: 'POST',
      url: 'https://logs.example.com/api/audit',
      body: {
        event: 'user_accessed',
        timestamp: new Date().toISOString()
      }
    },
    // Dynamic body with function
    {
      method: 'POST',
      url: 'https://analytics.example.com/api/events',
      body: (response) => ({
        userId: response.data?.id,
        action: 'profile_view',
        data: response.data
      })
    },
    // No body - uses original response
    {
      method: 'POST',
      url: 'https://backup.example.com/api/store'
    }
  ]
})
```

## 🎯 Real-World Use Cases

### API Gateway with Logging

```typescript
class ApiGateway {
  private logEndpoint: string
  private analyticsEndpoint: string

  constructor(logEndpoint: string, analyticsEndpoint: string) {
    this.logEndpoint = logEndpoint
    this.analyticsEndpoint = analyticsEndpoint
  }

  async request(method: string, url: string, data?: any) {
    return await fetch.request(url, {
      method,
      body: data,
      forwarder: [
        {
          method: 'POST',
          url: this.logEndpoint,
          body: (response) => ({
            timestamp: new Date().toISOString(),
            method,
            url,
            status: response.status,
            responseTime: response.responseTime
          })
        },
        {
          method: 'POST',
          url: this.analyticsEndpoint,
          body: (response) => ({
            event: 'api_request',
            method,
            url,
            status: response.status,
            dataSize: JSON.stringify(response).length
          })
        }
      ]
    })
  }
}

// Usage
const gateway = new ApiGateway(
  'https://logs.example.com/api/audit',
  'https://analytics.example.com/api/events'
)

const users = await gateway.request('GET', '/api/users')
```

### Microservices Event Broadcasting

```typescript
// Broadcast events to multiple microservices
async function broadcastUserEvent(eventType: string, userData: any) {
  return await fetch.post('/api/users', userData, {
    forwarder: [
      {
        method: 'POST',
        url: 'https://notification-service.example.com/api/events',
        body: (response) => ({
          eventType,
          userId: response.data?.id,
          timestamp: new Date().toISOString(),
          data: response.data
        })
      },
      {
        method: 'POST',
        url: 'https://analytics-service.example.com/api/events',
        body: (response) => ({
          event: `user_${eventType}`,
          userId: response.data?.id,
          properties: response.data
        })
      },
      {
        method: 'POST',
        url: 'https://audit-service.example.com/api/events',
        body: (response) => ({
          action: eventType,
          resource: 'user',
          resourceId: response.data?.id,
          timestamp: new Date().toISOString(),
          actor: 'system'
        })
      }
    ]
  })
}

// Usage
await broadcastUserEvent('created', { name: 'John Doe', email: 'john@example.com' })
```

### Data Replication

```typescript
// Replicate data to multiple storage systems
async function replicateData(data: any) {
  return await fetch.post('/api/data', data, {
    forwarder: [
      {
        method: 'POST',
        url: 'https://backup-1.example.com/api/store',
        body: (response) => ({
          id: response.data?.id,
          data: response.data,
          timestamp: new Date().toISOString(),
          source: 'primary'
        })
      },
      {
        method: 'POST',
        url: 'https://backup-2.example.com/api/store',
        body: (response) => ({
          id: response.data?.id,
          data: response.data,
          timestamp: new Date().toISOString(),
          source: 'primary'
        })
      },
      {
        method: 'POST',
        url: 'https://analytics.example.com/api/ingest',
        body: (response) => ({
          event: 'data_created',
          dataId: response.data?.id,
          dataType: 'user_data',
          timestamp: new Date().toISOString()
        })
      }
    ]
  })
}
```

### Webhook Notifications

```typescript
// Send webhook notifications to multiple subscribers
async function notifySubscribers(event: string, data: any) {
  return await fetch.post('/api/events', { event, data }, {
    forwarder: [
      {
        method: 'POST',
        url: 'https://webhook-1.example.com/webhook',
        headers: {
          'X-Event-Type': event,
          'X-Signature': generateSignature(event, data)
        },
        body: (response) => ({
          event,
          data: response.data,
          timestamp: new Date().toISOString(),
          id: response.data?.id
        })
      },
      {
        method: 'POST',
        url: 'https://webhook-2.example.com/webhook',
        headers: {
          'X-Event-Type': event,
          'X-Signature': generateSignature(event, data)
        },
        body: (response) => ({
          event,
          data: response.data,
          timestamp: new Date().toISOString(),
          id: response.data?.id
        })
      }
    ]
  })
}

function generateSignature(event: string, data: any): string {
  // Implementation for webhook signature generation
  return 'signature'
}
```

## ❌ Error Handling

### Basic Error Handling

```typescript
try {
  const response = await fetch.get('/api/data', {
    forwarder: [
      {
        method: 'POST',
        url: 'https://logs.example.com/api/audit'
      }
    ]
  })
  console.log('Success:', response.data)
} catch (error) {
  if (error instanceof FetchError) {
    console.log('Main request failed:', error.message)
  }
}
```

### Forwarder Error Monitoring

```typescript
const response = await fetch.get('/api/data', {
  forwarder: [
    {
      method: 'POST',
      url: 'https://logs.example.com/api/audit'
    },
    {
      method: 'POST',
      url: 'https://analytics.example.com/api/events'
    }
  ],
  onComplete: (results) => {
    results.forEach(result => {
      if (!result.success) {
        console.error(`Forwarder failed for ${result.endpoint}:`, result.error)
        // Implement retry logic or alerting here
      }
    })
  }
})
```

### Graceful Degradation

```typescript
// Continue even if forwarders fail
const response = await fetch.get('/api/data', {
  forwarder: [
    {
      method: 'POST',
      url: 'https://critical-logs.example.com/api/audit'
    },
    {
      method: 'POST',
      url: 'https://optional-analytics.example.com/api/events'
    }
  ],
  onComplete: (results) => {
    const criticalFailures = results.filter(r =>
      !r.success && r.endpoint.includes('critical-logs')
    )

    if (criticalFailures.length > 0) {
      console.error('Critical logging failed - investigate immediately')
      // Send alert to monitoring system
    }
  }
})
```

## 🔄 Retry Integration

### Custom Retry per Forwarder

```typescript
// Different retry settings for different forwarders
const response = await fetch.get('/api/data', {
  forwarder: [
    {
      method: 'POST',
      url: 'https://critical-service.example.com/api/data',
      retries: 5,
      timeout: 10000
    },
    {
      method: 'POST',
      url: 'https://optional-service.example.com/api/data',
      retries: 1,
      timeout: 3000
    }
  ]
})
```

### Retry with Exponential Backoff

```typescript
// The forwarder automatically uses the retry mechanism
const response = await fetch.get('/api/data', {
  forwarder: [
    {
      method: 'POST',
      url: 'https://service.example.com/api/data',
      retries: 3,
      timeout: 5000
    }
  ]
})
```

## 🎯 Best Practices

### Forwarder Design

```typescript
// Design forwarders based on your use case
const forwarders = {
  // For logging - simple and fast
  logging: [
    {
      method: 'POST',
      url: 'https://logs.example.com/api/audit',
      timeout: 2000,
      retries: 1
    }
  ],

  // For analytics - can be slower
  analytics: [
    {
      method: 'POST',
      url: 'https://analytics.example.com/api/events',
      timeout: 5000,
      retries: 2
    }
  ],

  // For critical notifications - high retry
  notifications: [
    {
      method: 'POST',
      url: 'https://notifications.example.com/api/send',
      timeout: 10000,
      retries: 5
    }
  ]
}
```

### Body Function Design

```typescript
// Keep body functions simple and focused
const response = await fetch.get('/api/data', {
  forwarder: [
    {
      method: 'POST',
      url: 'https://logs.example.com/api/audit',
      body: (response) => ({
        // Simple, focused data
        timestamp: new Date().toISOString(),
        status: response.status,
        dataSize: JSON.stringify(response).length
      })
    }
  ]
})
```

### Error Handling Strategy

```typescript
// Implement proper error handling
const response = await fetch.get('/api/data', {
  forwarder: [
    {
      method: 'POST',
      url: 'https://service.example.com/api/data'
    }
  ],
  onComplete: (results) => {
    // Always check results
    results.forEach(result => {
      if (!result.success) {
        // Log errors appropriately
        console.error(`Forwarder failed: ${result.endpoint}`, result.error)

        // Implement appropriate action based on criticality
        if (result.endpoint.includes('critical')) {
          // Alert for critical failures
        } else {
          // Log for non-critical failures
        }
      }
    })
  }
})
```

## 🚀 Next Steps

- [Progress Tracking](./progress-tracking.md) - Upload and download progress
- [Streaming](./streaming.md) - Real-time data streaming