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
  headers?: Record<string, string>
) => Promise<{ success: true; data: unknown } | { success: false; error: unknown }>

/**
 * Forwarder completion callback function type.
 * @description Callback function for handling forwarder completion results.
 */
export type ForwarderCompletionCallback = (results: ForwarderResult[]) => void
