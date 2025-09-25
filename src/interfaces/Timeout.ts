/**
 * Abort controller extended with a timeout id.
 * @description Enables clearing a pending abort timeout.
 */
export interface TimeoutController extends AbortController {
  timeoutId?: ReturnType<typeof setTimeout>
}
