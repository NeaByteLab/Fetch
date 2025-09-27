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
