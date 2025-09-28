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
 * Load balancer strategy types.
 * @description Defines available load balancing strategies.
 */
export type BalancerStrategy = 'fastest' | 'parallel'

/**
 * Load balancer configuration.
 * @description Configuration for request load balancing across multiple endpoints.
 */
export interface BalancerConfig {
  /** Array of endpoint URLs to balance across */
  endpoints: string[]
  /** Load balancing strategy to use */
  strategy: BalancerStrategy
}

/**
 * Load balancer execution result.
 * @description Result of load balancer execution with success flag and data or error.
 */
export type BalancerResult<T> =
  | { success: true; data: T; endpoint: string }
  | { success: false; error: unknown; endpoint: string }

/**
 * Load balancer request executor function type.
 * @description Function type for executing individual requests in load balancer.
 */
export type BalancerExecutor<T> = (
  endpoint: string
) => Promise<{ success: true; data: T } | { success: false; error: unknown }>
