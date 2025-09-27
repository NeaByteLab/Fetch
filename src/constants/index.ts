/**
 * Standard header names.
 * @description Commonly used response/request header keys.
 */
export const headers: { readonly CONTENT_LENGTH: string; readonly CONTENT_TYPE: string } = {
  CONTENT_LENGTH: 'content-length',
  CONTENT_TYPE: 'content-type'
} as const

/**
 * URL schemes used for absolute URLs.
 * @description Supported protocols for constructing full URLs.
 */
export const schemes: { readonly HTTP: string; readonly HTTPS: string } = {
  HTTP: 'http://',
  HTTPS: 'https://'
} as const

/**
 * Content type strings and prefixes.
 * @description Used for serialization and parsing decisions.
 */
export const contentTypes: {
  readonly APPLICATION_JSON: string
  readonly APPLICATION_OCTET_STREAM: string
  readonly APPLICATION_URL_ENCODED: string
  readonly TEXT_PREFIX: string
  readonly TEXT_PLAIN: string
} = {
  APPLICATION_JSON: 'application/json',
  APPLICATION_OCTET_STREAM: 'application/octet-stream',
  APPLICATION_URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT_PREFIX: 'text/',
  TEXT_PLAIN: 'text/plain'
} as const

/**
 * Supported HTTP method names.
 * @description Standard HTTP verbs for request methods.
 */
export const httpMethods: {
  readonly GET: string
  readonly POST: string
  readonly PUT: string
  readonly PATCH: string
  readonly DELETE: string
  readonly HEAD: string
  readonly OPTIONS: string
  readonly TRACE: string
} = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
  TRACE: 'TRACE'
} as const

/**
 * Shared error message texts.
 * @description Standardized error messages used throughout the library.
 */
export const errorMessages: {
  readonly ABORTED: string
  readonly BALANCER_ENDPOINTS_REQUIRED: string
  readonly BALANCER_STRATEGY_INVALID: string
  readonly CONTENT_TYPE_NULL: string
  readonly FILENAME_REQUIRED: string
  readonly FILENAME_UNDEFINED: string
  readonly FORWARDER_ENDPOINTS_REQUIRED: string
  readonly PROGRESS_CALLBACK_UNDEFINED: string
  readonly RESPONSE_BODY_NULL: string
  readonly RESPONSE_TOO_LARGE: string
  readonly RETRIES_NON_NEGATIVE: string
  readonly STREAM_PARSE_PREFIX: string
  readonly TIMEOUT_NON_NEGATIVE: string
  readonly UNKNOWN_ERROR: string
  readonly URL_INVALID: string
} = {
  ABORTED: 'Request timeout - operation exceeded the specified timeout duration',
  BALANCER_ENDPOINTS_REQUIRED: 'Balancer endpoints are required and must be a non-empty array',
  BALANCER_STRATEGY_INVALID: 'Balancer strategy must be either "fastest" or "parallel"',
  CONTENT_TYPE_NULL: 'Content type is null',
  FILENAME_REQUIRED: 'Filename is required when download is enabled',
  FILENAME_UNDEFINED: 'Filename is undefined',
  FORWARDER_ENDPOINTS_REQUIRED: 'Forwarder endpoints are required and must be a non-empty array',
  PROGRESS_CALLBACK_UNDEFINED: 'Progress callback is undefined',
  RESPONSE_BODY_NULL: 'Response body is null',
  RESPONSE_TOO_LARGE: 'Response too large',
  RETRIES_NON_NEGATIVE: 'Retries must be a non-negative number',
  STREAM_PARSE_PREFIX: 'Failed to parse streaming response: ',
  TIMEOUT_NON_NEGATIVE: 'Timeout must be a non-negative number',
  UNKNOWN_ERROR: 'Unknown error',
  URL_INVALID: 'URL must be a non-empty string'
} as const

/**
 * Default configuration values.
 */
export const defaults: {
  TIMEOUT_MS: number
  RETRIES: number
  BASE_URL: string
  STREAM: boolean
  DOWNLOAD: boolean
  RESPONSE_TYPE: 'auto' | 'json' | 'text' | 'buffer' | 'blob'
} = {
  BASE_URL: '',
  DOWNLOAD: false,
  RESPONSE_TYPE: 'auto',
  RETRIES: 1,
  STREAM: false,
  TIMEOUT_MS: 30000
}

/**
 * Miscellaneous constants.
 * @description Various utility constants for parsing and error handling.
 */
export const misc: {
  readonly NEWLINE: string
  readonly ABORT_ERROR_NAME: string
  readonly MAX_NDJSON_BUFFER_BYTES: number
} = {
  NEWLINE: '\n',
  ABORT_ERROR_NAME: 'AbortError',
  MAX_NDJSON_BUFFER_BYTES: 10 * 1024 * 1024
} as const

/**
 * Retry strategy timing values.
 * @description Used for exponential backoff calculations.
 */
export const retryDelays: { readonly BASE_DELAY_MS: number; readonly MAX_DELAY_MS: number } = {
  BASE_DELAY_MS: 1000,
  MAX_DELAY_MS: 10000
} as const

/**
 * Load balancer strategy options.
 * @description Available strategies for request load balancing.
 */
export const balancerStrategies: {
  readonly FASTEST: 'fastest'
  readonly PARALLEL: 'parallel'
} = {
  FASTEST: 'fastest',
  PARALLEL: 'parallel'
} as const

/**
 * Forwarder default configuration values.
 * @description Default settings for response forwarding.
 */
export const forwarderDefaults: {
  readonly RETRIES: number
  readonly TIMEOUT_MS: number
  readonly METHOD: string
} = {
  RETRIES: 3,
  TIMEOUT_MS: 10000,
  METHOD: 'POST'
} as const
