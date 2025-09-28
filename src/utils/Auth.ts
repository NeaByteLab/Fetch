/**
 * @license
 * Copyright 2025 NeaByteLab
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { FetchError, type AuthConfig } from '@interfaces/index'
import { errorMessages } from '@constants/index'

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
  throw new FetchError(errorMessages.BASE64_ENCODING_NOT_AVAILABLE, undefined, undefined, '')
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
