# Progress Tracking

This guide covers progress tracking for uploads and downloads.

## 📊 Progress Callback

The `onProgress` callback provides real-time progress updates for both uploads and downloads.

### Callback Function
```typescript
onProgress: (percentage: number) => void
```

- `percentage` - Progress value from 0 to 100

## 📥 Download Progress

### Basic Download Progress

```typescript
import fetch from '@neabyte/fetch'

const response = await fetch.get('https://httpbin.org/bytes/1024', {
  download: true,
  filename: 'file.bin',
  onProgress: (percentage) => {
    console.log(`Download progress: ${percentage}%`)
  }
})
```

### Download with Progress Bar

```typescript
function updateProgressBar(percentage: number) {
  const bar = '█'.repeat(Math.floor(percentage / 2))
  const space = ' '.repeat(50 - Math.floor(percentage / 2))
  process.stdout.write(`\r[${bar}${space}] ${percentage}%`)
}

const response = await fetch.get('https://httpbin.org/bytes/10240', {
  download: true,
  filename: 'large-file.bin',
  onProgress: updateProgressBar
})

console.log('\nDownload complete!')
```

### Multiple File Downloads

```typescript
const files = [
  { url: 'https://httpbin.org/bytes/1024', name: 'file1.bin' },
  { url: 'https://httpbin.org/bytes/2048', name: 'file2.bin' },
  { url: 'https://httpbin.org/bytes/4096', name: 'file3.bin' }
]

for (const file of files) {
  console.log(`Downloading ${file.name}...`)
  await fetch.get(file.url, {
    download: true,
    filename: file.name,
    onProgress: (percentage) => {
      console.log(`${file.name}: ${percentage}%`)
    }
  })
}
```

## 📤 Upload Progress

### Basic Upload Progress

```typescript
const formData = new FormData()
formData.append('file', fileInput.files[0])

const response = await fetch.post('https://httpbin.org/post', formData, {
  onProgress: (percentage) => {
    console.log(`Upload progress: ${percentage}%`)
  }
})
```

### JSON Upload Progress

```typescript
const data = {
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'base64-encoded-image-data'
}

const response = await fetch.post('https://httpbin.org/post', data, {
  onProgress: (percentage) => {
    console.log(`Upload progress: ${percentage}%`)
  }
})
```

### File Upload with Progress

```typescript
async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  return await fetch.post('https://httpbin.org/post', formData, {
    onProgress: (percentage) => {
      const bar = '█'.repeat(Math.floor(percentage / 2))
      const space = ' '.repeat(50 - Math.floor(percentage / 2))
      console.log(`\r[${bar}${space}] ${percentage}%`)
    }
  })
}

// Usage
const fileInput = document.getElementById('file') as HTMLInputElement
const file = fileInput.files[0]
if (file) {
  await uploadFile(file)
  console.log('\nUpload complete!')
}
```

## 🔄 Combined Upload and Download

### Upload with Download Progress

```typescript
const response = await fetch.post('https://httpbin.org/post', data, {
  onProgress: (percentage) => {
    console.log(`Upload progress: ${percentage}%`)
  }
})

// Process response and download result
const downloadResponse = await fetch.get(response.data.downloadUrl, {
  download: true,
  filename: 'result.pdf',
  onProgress: (percentage) => {
    console.log(`Download progress: ${percentage}%`)
  }
})
```

### Batch Operations with Progress

```typescript
async function processFiles(files: File[]) {
  const results = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`)

    const response = await fetch.post('https://httpbin.org/post', file, {
      onProgress: (percentage) => {
        console.log(`File ${i + 1} upload: ${percentage}%`)
      }
    })

    results.push(response)
  }

  return results
}
```

## ⚙️ Progress Configuration

### Custom Progress Handler

```typescript
class ProgressTracker {
  private totalFiles: number
  private completedFiles: number = 0
  private currentProgress: number = 0

  constructor(totalFiles: number) {
    this.totalFiles = totalFiles
  }

  createProgressCallback(fileIndex: number) {
    return (percentage: number) => {
      this.currentProgress = percentage
      this.updateOverallProgress(fileIndex, percentage)
    }
  }

  private updateOverallProgress(fileIndex: number, percentage: number) {
    const fileWeight = 100 / this.totalFiles
    const fileProgress = (percentage / 100) * fileWeight
    const completedWeight = (this.completedFiles / this.totalFiles) * 100
    const overallProgress = completedWeight + fileProgress

    console.log(`Overall progress: ${Math.round(overallProgress)}%`)
  }

  markFileComplete() {
    this.completedFiles++
  }
}

// Usage
const tracker = new ProgressTracker(3)
const files = [file1, file2, file3]

for (let i = 0; i < files.length; i++) {
  await fetch.post('https://httpbin.org/post', files[i], {
    onProgress: tracker.createProgressCallback(i)
  })
  tracker.markFileComplete()
}
```

### Progress with Error Handling

```typescript
async function uploadWithProgress(file: File) {
  try {
    const response = await fetch.post('https://httpbin.org/post', file, {
      onProgress: (percentage) => {
        console.log(`Upload: ${percentage}%`)
      }
    })
    console.log('Upload successful!')
    return response
  } catch (error) {
    console.log('Upload failed:', error.message)
    throw error
  }
}
```

## 🎯 Best Practices

- Use progress callbacks for long-running operations
- Provide visual feedback with progress bars
- Handle progress errors gracefully
- Track overall progress for batch operations
- Use descriptive progress messages
- Consider user experience when showing progress

## 🚀 Next Steps

- [Streaming](./streaming.md) - Real-time data streaming
