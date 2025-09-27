import type { AuthConfig } from '@interfaces/Auth'

/**
 * Base64 encodes a string for basic authentication
 * @description Handles both Node.js and browser environments
 * @param str - String to encode
 * @returns Base64 encoded string
 */
function base64Encode(str: string): string {
  if (typeof globalThis !== 'undefined' && typeof globalThis.btoa === 'function') {
    return globalThis.btoa(str)
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf8').toString('base64')
  }
  throw new Error('Base64 encoding not available in this environment')
}

/**
 * Generates authentication headers
 * @description Creates appropriate headers based on auth type
 * @param auth - Authentication configuration
 * @returns Headers object
 */
export function createAuthHeaders(auth: AuthConfig): Record<string, string> {
  switch (auth.type) {
    case 'basic': {
      const credentials: string = base64Encode(`${auth.username}:${auth.password}`)
      return { Authorization: `Basic ${credentials}` }
    }
    case 'bearer': {
      return { Authorization: `Bearer ${auth.token}` }
    }
    case 'apikey': {
      return { [auth.key]: auth.value }
    }
    default:
      return {}
  }
}
