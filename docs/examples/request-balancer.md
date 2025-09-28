# Request Balancer Examples

This guide covers practical examples for using the Request Balancer feature.

## 🚀 Fastest Strategy Examples

### Basic Fastest Strategy

```typescript
// Simple failover between endpoints
const response = await fetch.get('/api/users', {
  balancer: {
    endpoints: [
      'https://api1.example.com',
      'https://api2.example.com',
      'https://api3.example.com'
    ],
    strategy: 'fastest'
  }
})
// Returns single response from first successful endpoint
```

### Geographic Failover

```typescript
// Primary server with geographic backups
const userData = await fetch.get('/api/profile', {
  balancer: {
    endpoints: [
      'https://us-east.api.example.com',    // Primary US East
      'https://us-west.api.example.com',    // Backup US West
      'https://eu-west.api.example.com'     // Backup Europe
    ],
    strategy: 'fastest'
  }
})
```


### TypeScript Type Safety

```typescript
interface User {
  id: number
  name: string
  email: string
}

// TypeScript infers correct return type
const user: FetchResponse<User> = await fetch.get('/api/user/1', {
  balancer: {
    endpoints: ['https://api1.example.com', 'https://api2.example.com'],
    strategy: 'fastest'
  }
})
```

## ⚡ Parallel Strategy Examples

### Data Aggregation

```typescript
// Collect data from multiple sources
const allData = await fetch.get('/api/analytics', {
  balancer: {
    endpoints: [
      'https://analytics-1.example.com',
      'https://analytics-2.example.com',
      'https://analytics-3.example.com'
    ],
    strategy: 'parallel'
  }
})
// Returns array of all successful responses
```

### Performance Comparison

```typescript
// Compare response times from different CDNs
const cdnResponses = await fetch.get('/api/content', {
  balancer: {
    endpoints: [
      'https://cdn1.example.com',
      'https://cdn2.example.com',
      'https://cdn3.example.com'
    ],
    strategy: 'parallel'
  }
})

// Analyze which CDN performed best
const responseTimes = cdnResponses.map(response => ({
  endpoint: response.url,
  time: response.responseTime,
  size: response.data.length
}))
```

### Redundant Data Collection

```typescript
// Collect user data from multiple services
const userProfiles = await fetch.get('/api/user/profile', {
  balancer: {
    endpoints: [
      'https://profile-service-1.example.com',
      'https://profile-service-2.example.com'
    ],
    strategy: 'parallel'
  }
})

// Merge data from all sources
const mergedProfile = userProfiles.reduce((acc, response) => ({
  ...acc,
  ...response.data
}), {})
```


## 🔧 Advanced Configuration

### Custom Headers per Endpoint

```typescript
// Different authentication for different endpoints
const response = await fetch.get('/api/secure-data', {
  balancer: {
    endpoints: [
      'https://internal-api.example.com',
      'https://external-api.example.com'
    ],
    strategy: 'fastest'
  },
  headers: {
    'Authorization': 'Bearer internal-token',
    'X-Source': 'balancer-request'
  }
})
```

### Timeout and Retry Configuration

```typescript
// Different timeouts for different strategies
const fastResponse = await fetch.get('/api/quick-data', {
  balancer: {
    endpoints: ['https://api1.com', 'https://api2.com'],
    strategy: 'fastest'
  },
  timeout: 2000,
  retries: 1
})

const comprehensiveData = await fetch.get('/api/comprehensive-data', {
  balancer: {
    endpoints: ['https://api1.com', 'https://api2.com', 'https://api3.com'],
    strategy: 'parallel'
  },
  timeout: 10000,
  retries: 2
})
```

### Mixed Strategy Usage

```typescript
// Use fastest for critical operations
const criticalData = await fetch.get('/api/critical', {
  balancer: {
    endpoints: ['https://primary.com', 'https://backup.com'],
    strategy: 'fastest'
  }
})

// Use parallel for data collection
const allMetrics = await fetch.get('/api/metrics', {
  balancer: {
    endpoints: ['https://metrics1.com', 'https://metrics2.com'],
    strategy: 'parallel'
  }
})
```

## 🎯 Real-World Use Cases

### API Gateway with Load Balancing

```typescript
class ApiGateway {
  private endpoints: string[]

  constructor(endpoints: string[]) {
    this.endpoints = endpoints
  }

  async getUsers() {
    return await fetch.get('/users', {
      balancer: {
        endpoints: this.endpoints,
        strategy: 'fastest'
      }
    })
  }

  async getAnalytics() {
    return await fetch.get('/analytics', {
      balancer: {
        endpoints: this.endpoints,
        strategy: 'parallel'
      }
    })
  }
}

// Usage
const gateway = new ApiGateway([
  'https://api-gateway-1.example.com',
  'https://api-gateway-2.example.com',
  'https://api-gateway-3.example.com'
])

const users = await gateway.getUsers()
const analytics = await gateway.getAnalytics()
```

### Microservices Communication

```typescript
// Service discovery with balancer
class ServiceClient {
  private serviceEndpoints: Map<string, string[]>

  constructor() {
    this.serviceEndpoints = new Map([
      ['user-service', ['https://user-1.com', 'https://user-2.com']],
      ['order-service', ['https://order-1.com', 'https://order-2.com']],
      ['payment-service', ['https://payment-1.com', 'https://payment-2.com']]
    ])
  }

  async callService(serviceName: string, path: string, strategy: 'fastest' | 'parallel' = 'fastest') {
    const endpoints = this.serviceEndpoints.get(serviceName)
    if (!endpoints) {
      throw new Error(`Service ${serviceName} not found`)
    }

    return await fetch.get(path, {
      balancer: {
        endpoints,
        strategy
      }
    })
  }
}

// Usage
const serviceClient = new ServiceClient()
const user = await serviceClient.callService('user-service', '/users/1', 'fastest')
const orders = await serviceClient.callService('order-service', '/orders', 'parallel')
```

### Health Check and Monitoring

```typescript
// Health check with multiple endpoints
async function performHealthCheck() {
  try {
    const healthStatus = await fetch.get('/health', {
      balancer: {
        endpoints: [
          'https://api1.example.com',
          'https://api2.example.com',
          'https://api3.example.com'
        ],
        strategy: 'fastest'
      },
      timeout: 5000
    })

    console.log('Health check passed:', healthStatus.data)
    return true
  } catch (error) {
    console.error('Health check failed:', error.message)
    return false
  }
}

// Monitor all endpoints
async function monitorAllEndpoints() {
  const statuses = await fetch.get('/status', {
    balancer: {
      endpoints: [
        'https://api1.example.com',
        'https://api2.example.com',
        'https://api3.example.com'
      ],
      strategy: 'parallel'
    }
  })

  statuses.forEach((status, index) => {
    console.log(`Endpoint ${index + 1}:`, status.data)
  })
}
```


## 🎯 Best Practices

### Endpoint Selection

```typescript
// Choose endpoints based on your use case
const endpoints = {
  // For failover - order by priority
  failover: [
    'https://primary-api.example.com',
    'https://backup-api.example.com'
  ],

  // For load balancing - distribute evenly
  loadBalancing: [
    'https://api-1.example.com',
    'https://api-2.example.com',
    'https://api-3.example.com'
  ],

  // For data aggregation - include all sources
  dataAggregation: [
    'https://analytics-1.example.com',
    'https://analytics-2.example.com',
    'https://analytics-3.example.com'
  ]
}
```

### Strategy Selection

```typescript
// Use 'fastest' for:
// - Critical operations that need quick response
// - Failover scenarios
// - When you only need one successful response

const criticalData = await fetch.get('/api/critical', {
  balancer: {
    endpoints: ['https://api1.com', 'https://api2.com'],
    strategy: 'fastest'
  }
})

// Use 'parallel' for:
// - Data collection from multiple sources
// - Performance comparison
// - When you need all available data

const allData = await fetch.get('/api/analytics', {
  balancer: {
    endpoints: ['https://api1.com', 'https://api2.com'],
    strategy: 'parallel'
  }
})
```

## 🚀 Next Steps

- [Response Forwarder](./response-forwarder.md) - Response forwarding and observability examples
- [Progress Tracking](./progress-tracking.md) - Upload and download progress
- [Streaming](./streaming.md) - Real-time data streaming