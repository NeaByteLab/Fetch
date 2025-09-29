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

import type { Cookie } from '@interfaces/Cookie'

/**
 * Simple cookie jar for storing and managing cookies.
 * @description Handles cookie storage and retrieval for HTTP requests.
 */
export class CookieJar {
  private readonly cookies: Map<string, Cookie> = new Map()

  /**
   * Adds a cookie to the jar.
   * @description Stores cookie with name as key for quick lookup.
   * @param cookie - Cookie to store
   */
  setCookie(cookie: Cookie): void {
    this.cookies.set(cookie.name, cookie)
  }

  /**
   * Gets cookies for a specific URL.
   * @description Returns cookies formatted for Cookie header.
   * @returns Formatted cookie string or empty string
   */
  getCookies(): string {
    if (this.cookies.size === 0) {
      return ''
    }
    return Array.from(this.cookies.values())
      .map((cookie: Cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ')
  }

  /**
   * Parses Set-Cookie header and stores cookies.
   * @description Extracts cookies from Set-Cookie response header.
   * @param setCookieHeader - Set-Cookie header value
   */
  parseSetCookie(setCookieHeader: string): void {
    const parts: string[] = setCookieHeader.split(';')
    const nameValue: string | undefined = parts[0]
    if (nameValue !== undefined && nameValue.trim() !== '' && nameValue.includes('=')) {
      const [name, value]: [string, string] = nameValue.trim().split('=', 2) as [string, string]
      if (name && value) {
        this.setCookie({ name: name.trim(), value: value.trim() })
      }
    }
  }

  /**
   * Clears all cookies from the jar.
   * @description Removes all stored cookies.
   */
  clear(): void {
    this.cookies.clear()
  }
}
