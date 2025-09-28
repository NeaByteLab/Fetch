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
