/**
 * API key authentication configuration.
 * @description Authentication using API key-value pairs.
 */
export interface AuthApiKey {
  /** API key field name */
  key: string
  /** API key value */
  value: string
  /** Authentication type identifier */
  type: 'apikey'
}

/**
 * Basic authentication configuration.
 * @description Authentication using username and password credentials.
 */
export interface AuthBasic {
  /** Username for authentication */
  username: string
  /** Password for authentication */
  password: string
  /** Authentication type identifier */
  type: 'basic'
}

/**
 * Bearer token authentication configuration.
 * @description Authentication using bearer token in Authorization header.
 */
export interface AuthBearer {
  /** Bearer token value */
  token: string
  /** Authentication type identifier */
  type: 'bearer'
}

/**
 * Union type for all authentication methods.
 * @description Supports basic, bearer, and API key authentication types.
 */
export type AuthConfig = AuthApiKey | AuthBasic | AuthBearer
