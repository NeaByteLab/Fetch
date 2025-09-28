# Streaming

This guide covers streaming responses for real-time data processing.

## 🔄 Stream Configuration

Enable streaming by setting `stream: true` in the request options.

```typescript
const response = await fetch.get('https://api.example.com/stream', {
  stream: true
})
```

## 📊 Stream Types

The library automatically detects content type and provides appropriate streaming:

- **JSON/NDJSON** - Yields parsed JSON objects
- **Text** - Yields text chunks
- **Binary** - Yields Uint8Array chunks

## 📝 Basic Streaming

### JSON Stream

```typescript
import fetch from '@neabyte/fetch'

const stream = await fetch.get('https://httpbin.org/stream/5', {
  stream: true
})

for await (const chunk of stream) {
  console.log('Received:', chunk)
  // Process each JSON object as it arrives
}
```

### Text Stream

```typescript
const stream = await fetch.get('https://api.example.com/logs', {
  stream: true
})

for await (const chunk of stream) {
  console.log('Log line:', chunk)
  // Process each text chunk as it arrives
}
```

### Binary Stream

```typescript
const stream = await fetch.get('https://api.example.com/data.bin', {
  stream: true
})

for await (const chunk of stream) {
  console.log('Binary chunk size:', chunk.length)
  // Process each binary chunk as it arrives
}
```

## 🔄 Advanced Streaming

### Stream with Error Handling

```typescript
async function processStream(url: string) {
  try {
    const stream = await fetch.get(url, { stream: true })

    for await (const chunk of stream) {
      try {
        // Process chunk
        console.log('Processing:', chunk)
      } catch (chunkError) {
        console.log('Chunk processing error:', chunkError.message)
        // Continue with next chunk
      }
    }
  } catch (error) {
    console.log('Stream error:', error.message)
  }
}
```

### Stream with Timeout

```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds

try {
  const stream = await fetch.get('https://api.example.com/stream', {
    stream: true,
    signal: controller.signal
  })

  for await (const chunk of stream) {
    console.log('Chunk:', chunk)
  }
} catch (error) {
  if (error.message === 'Request aborted') {
    console.log('Stream timeout')
  }
} finally {
  clearTimeout(timeoutId)
}
```

### Stream Processing with Limits

```typescript
async function processStreamWithLimit(url: string, maxChunks: number) {
  const stream = await fetch.get(url, { stream: true })
  let count = 0

  for await (const chunk of stream) {
    console.log(`Chunk ${count + 1}:`, chunk)
    count++

    if (count >= maxChunks) {
      console.log('Reached chunk limit, stopping')
      break
    }
  }
}

// Process only first 10 chunks
await processStreamWithLimit('https://httpbin.org/stream/100', 10)
```

## 📈 Real-time Data Processing

### Live Data Feed

```typescript
async function processLiveData() {
  const stream = await fetch.get('https://api.example.com/live-feed', {
    stream: true
  })

  for await (const data of stream) {
    // Process live data
    console.log('Live data:', data.timestamp, data.value)

    // Update UI or trigger actions
    updateDashboard(data)
  }
}

function updateDashboard(data: any) {
  // Update dashboard with new data
  console.log('Dashboard updated with:', data)
}
```

### Stream Aggregation

```typescript
async function aggregateStream(url: string) {
  const stream = await fetch.get(url, { stream: true })
  const results: any[] = []
  let total = 0

  for await (const chunk of stream) {
    results.push(chunk)
    total += chunk.value || 0

    // Process every 10 items
    if (results.length % 10 === 0) {
      console.log(`Processed ${results.length} items, total: ${total}`)
    }
  }

  console.log('Final aggregation:', {
    count: results.length,
    total: total,
    average: total / results.length
  })

  return results
}
```

### Stream with Progress

```typescript
async function streamWithProgress(url: string) {
  const stream = await fetch.get(url, { stream: true })
  let count = 0
  const startTime = Date.now()

  for await (const chunk of stream) {
    count++
    const elapsed = Date.now() - startTime
    const rate = count / (elapsed / 1000)

    console.log(`Chunk ${count} - Rate: ${rate.toFixed(2)} chunks/sec`)
  }

  console.log(`Stream completed: ${count} chunks in ${elapsed}ms`)
}
```

## 🔧 Stream Utilities

### Stream to Array

```typescript
async function streamToArray<T>(url: string): Promise<T[]> {
  const stream = await fetch.get(url, { stream: true })
  const results: T[] = []

  for await (const chunk of stream) {
    results.push(chunk)
  }

  return results
}

// Usage
const data = await streamToArray('https://httpbin.org/stream/5')
console.log('All data:', data)
```

### Stream Filtering

```typescript
async function filterStream<T>(
  url: string,
  predicate: (chunk: T) => boolean
): Promise<T[]> {
  const stream = await fetch.get(url, { stream: true })
  const filtered: T[] = []

  for await (const chunk of stream) {
    if (predicate(chunk)) {
      filtered.push(chunk)
    }
  }

  return filtered
}

// Usage - filter only even IDs
const evenData = await filterStream(
  'https://httpbin.org/stream/10',
  (chunk: any) => chunk.id % 2 === 0
)
```

### Stream Mapping

```typescript
async function mapStream<T, U>(
  url: string,
  mapper: (chunk: T) => U
): Promise<U[]> {
  const stream = await fetch.get(url, { stream: true })
  const mapped: U[] = []

  for await (const chunk of stream) {
    mapped.push(mapper(chunk))
  }

  return mapped
}

// Usage - extract only specific fields
const processedData = await mapStream(
  'https://httpbin.org/stream/5',
  (chunk: any) => ({ id: chunk.id, timestamp: Date.now() })
)
```

## 🎯 Best Practices

- Use streaming for large datasets or real-time data
- Handle errors gracefully within the stream loop
- Set appropriate timeouts for long-running streams
- Process chunks efficiently to avoid memory issues
- Use stream utilities for common operations
- Monitor stream performance and rate

## 🚀 Next Steps

- [Advanced Usage](./advanced-usage.md) - Configuration options and patterns
- [Error Handling](./error-handling.md) - Error handling patterns