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

import type { BalancerConfig, ForwarderEndpoint, AuthConfig } from '@interfaces/index'

/**
 * Response value returned by the client.
 * @description Can be a parsed value, a stream of values, or undefined for no-body responses.
 */
export type FetchResponse<T> = T | AsyncIterable<T> | undefined

/**
 * Supported request body types.
 * @description Includes common text, form, binary, and object payloads.
 */
export type FetchRequestBody =
  | string
  | FormData
  | URLSearchParams
  | Blob
  | ArrayBuffer
  | Uint8Array
  | Record<string, unknown>

/**
 * Options for configuring a request.
 * @description HTTP request configuration options.
 */
export interface FetchOptions {
  /** Authentication configuration */
  auth?: AuthConfig
  /** Load balancer configuration */
  balancer?: BalancerConfig
  /** Base URL for relative requests */
  baseURL?: string
  /** Request body data */
  body?: FetchRequestBody
  /** Enable file download mode */
  download?: boolean
  /** Filename for downloads */
  filename?: string
  /** Response forwarding configuration */
  forwarder?: ForwarderEndpoint[]
  /** Additional request headers */
  headers?: Record<string, string>
  /** Maximum transfer rate in bytes per second (for downloads/uploads) */
  maxRate?: number
  /** Progress callback for downloads */
  onProgress?: (percentage: number) => void
  /** Number of retry attempts */
  retries?: number
  /** Response parsing type */
  responseType?: 'auto' | 'json' | 'text' | 'buffer' | 'blob'
  /** Abort signal for cancellation */
  signal?: AbortSignal
  /** SSL pinning hashes for certificate validation */
  sslPinning?: string[]
  /** Enable streaming response */
  stream?: boolean
  /** Request timeout in milliseconds */
  timeout?: number
}

/**
 * Error thrown for request failures.
 * @description Extends Error with optional status, data, and URL fields.
 */
export class FetchError extends Error {
  status?: number | undefined
  data?: unknown
  url?: string | undefined
  constructor(
    message: string,
    status?: number | undefined,
    data?: unknown,
    url?: string | undefined
  ) {
    super(message)
    this.name = 'FetchError'
    this.status = status
    this.data = data
    this.url = url
  }
}
