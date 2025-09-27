/**
 * Validates if a string is a valid HTTP or HTTPS URL.
 * @description Checks if string is a valid HTTP/HTTPS URL with proper hostname and port.
 * @param url - The URL string to validate
 * @returns True if the URL is valid, false otherwise
 */
export function isValidURL(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }
  try {
    const parsedUrl: URL = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false
    }
    if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
      return false
    }
    if (url.endsWith(':')) {
      return false
    }
    if (parsedUrl.port) {
      const port: number = parseInt(parsedUrl.port, 10)
      if (isNaN(port) || port < 1 || port > 65535) {
        return false
      }
    }
    return true
  } catch {
    return false
  }
}
