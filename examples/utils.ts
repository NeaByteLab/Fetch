import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http'
import { FetchError } from '@root/index'

/**
 * Creates a promise that resolves after a specified delay.
 * @description Utility function for adding delays in async operations.
 * @param ms - Delay duration in milliseconds
 * @returns Promise that resolves after the specified delay
 */
export const delayPromise: (ms: number) => Promise<void> = (ms: number): Promise<void> =>
  new Promise<void>((resolve: () => void) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })

/**
 * Handles and logs errors with operation context.
 * @description Logs FetchError instances with operation context, falls back to generic error handling.
 * @param error - Error to handle
 * @param operation - Operation name for context
 */
export function handleError(error: unknown, operation: string): void {
  if (error instanceof FetchError) {
    console.log(`FetchError() -> ${operation} ${error.message}`)
  } else {
    console.log(
      `UnknownError() -> ${operation} ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Utility class for managing HTTP server instances.
 * @description Singleton class that provides HTTP server management for testing purposes.
 */
export default class ServerUtils {
  /** Singleton instance of ServerUtils */
  private static instance: ServerUtils | undefined
  /** HTTP server instance */
  private server: Server | undefined
  /** Server running state flag */
  private isRunning: boolean = false

  /**
   * Private constructor to prevent direct instantiation.
   * @description Enforces singleton pattern by preventing external instantiation.
   */
  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  /**
   * Gets the singleton instance of ServerUtils.
   * @description Creates and returns the singleton instance if it doesn't exist.
   * @returns ServerUtils singleton instance
   */
  public static getInstance(): ServerUtils {
    ServerUtils.instance ??= new ServerUtils()
    return ServerUtils.instance
  }

  /**
   * Creates a new HTTP server instance.
   * @description Creates a server that logs incoming requests and responds with JSON.
   * @returns Configured HTTP server
   */
  private createServer(): Server {
    return createServer((req: IncomingMessage, res: ServerResponse) => {
      console.log(
        `-> Incoming request: ${req.method} ${req.url} | Keys: ${Object.keys(req).join(', ')}`
      )
      res.end(JSON.stringify({ message: 'OK', method: req.method, url: req.url }))
    })
  }

  /**
   * Gets the server instance, creating it if necessary.
   * @description Returns the existing server or creates a new one.
   * @returns HTTP server instance
   */
  public getServer(): Server {
    this.server ??= this.createServer()
    return this.server
  }

  /**
   * Starts the HTTP server on the specified port.
   * @description Starts the server if not already running and resolves when ready.
   * @param port - Port number to listen on (default: 3000)
   * @returns Promise that resolves when server is started
   */
  public async start(port: number = 3000): Promise<void> {
    if (this.isRunning) {
      console.log('Server is already running')
      return
    }
    return new Promise<void>((resolve: () => void) => {
      const server: Server = this.getServer()
      server.listen(port, (): void => {
        this.isRunning = true
        console.log(`Server started on port ${port}`)
        resolve()
      })
    })
  }

  /**
   * Stops the HTTP server.
   * @description Gracefully stops the server if it's running and resolves when stopped.
   * @returns Promise that resolves when server is stopped
   */
  public async stop(): Promise<void> {
    if (!this.isRunning || !this.server) {
      console.log('Server is not running')
      return
    }
    return new Promise<void>((resolve: () => void) => {
      this.server?.close(() => {
        this.isRunning = false
        console.log('Server stopped')
        resolve()
      })
    })
  }
}

/**
 * Starts the HTTP server using the singleton instance.
 * @description Convenience function to start the server on the default port.
 * @returns Promise that resolves when server is started
 */
export function startServer(): Promise<void> {
  return ServerUtils.getInstance().start()
}

/**
 * Stops the HTTP server using the singleton instance.
 * @description Convenience function to stop the running server.
 * @returns Promise that resolves when server is stopped
 */
export function stopServer(): Promise<void> {
  return ServerUtils.getInstance().stop()
}
