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

/**
 * Function type for dynamic body generation.
 * @description Function that receives the original response and returns the body to forward.
 */
export type ForwarderBodyFunction<T = unknown> = (originalResponse: T) => unknown

/**
 * Individual forwarder endpoint configuration.
 * @description Configuration for a single forwarder endpoint.
 */
export interface ForwarderEndpoint<T = unknown> {
  /** HTTP method for forwarding */
  method: string
  /** URL to forward to */
  url: string
  /** Headers to include in forwarded request */
  headers?: Record<string, string>
  /** Request body to forward - can be static data or a function that receives original response */
  body?: ForwarderBodyFunction<T> | Record<string, unknown> | string | number | boolean | null
  /** Timeout for this forwarder endpoint (ms) */
  timeout?: number
  /** Number of retry attempts for this forwarder endpoint */
  retries?: number
  /** SSL pinning hashes for certificate validation */
  sslPinning?: string[]
}

/**
 * Forwarder configuration.
 * @description Configuration for forwarding responses to multiple endpoints.
 */
export interface ForwarderConfig<T = unknown> {
  /** Array of forwarder endpoint configurations */
  forwarders: ForwarderEndpoint<T>[]
}

/**
 * Forwarder execution result.
 * @description Result of individual forwarder endpoint execution.
 */
export interface ForwarderResult {
  /** Endpoint URL that was attempted */
  endpoint: string
  /** Whether the forward was successful */
  success: boolean
  /** Error details if the forward failed */
  error?: unknown
}

/**
 * Forwarder request executor function type.
 * @description Function type for executing individual forward requests.
 */
export type ForwarderExecutor = (
  endpoint: string,
  method: string,
  body?: unknown,
  headers?: Record<string, string>,
  sslPinning?: string[]
) => Promise<{ success: true; data: unknown } | { success: false; error: unknown }>

/**
 * Forwarder completion callback function type.
 * @description Callback function for handling forwarder completion results.
 */
export type ForwarderCompletionCallback = (results: ForwarderResult[]) => void
