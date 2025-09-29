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
 * Cookie interface for storage and management.
 * @description Simple cookie representation with essential properties.
 */
export interface Cookie {
  /** Cookie name */
  name: string
  /** Cookie value */
  value: string
  /** Optional domain restriction */
  domain?: string
  /** Optional path restriction */
  path?: string
}
