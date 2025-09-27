import type { FetchOptions, FetchRequestBody, FetchResponse } from '@interfaces/index'
import { httpMethods } from '@constants/index'

/**
 * HTTP method factory utilities.
 * @description Creates HTTP method handlers with consistent behavior.
 */
export class HttpMethods {
  /**
   * Creates a GET request handler.
   * @description Factory method for GET requests.
   * @param requestHandler - Core request handler function
   * @returns GET request method
   */
  static createGet<T = unknown>(
    requestHandler: (
      method: string,
      url: string,
      options: FetchOptions
    ) => Promise<FetchResponse<T>>
  ) {
    return async (url: string, options: FetchOptions = {}): Promise<FetchResponse<T>> => {
      return requestHandler(httpMethods.GET, url, options)
    }
  }

  /**
   * Creates a POST request handler.
   * @description Factory method for POST requests with body support.
   * @param requestHandler - Core request handler function
   * @param createRequestOptions - Function to create request options with body
   * @returns POST request method
   */
  static createPost<T = unknown>(
    requestHandler: (
      method: string,
      url: string,
      options: FetchOptions
    ) => Promise<FetchResponse<T>>,
    createRequestOptions: (options: FetchOptions, body?: FetchRequestBody) => FetchOptions
  ) {
    return async (
      url: string,
      body?: FetchRequestBody,
      options: FetchOptions = {}
    ): Promise<FetchResponse<T>> => {
      return requestHandler(httpMethods.POST, url, createRequestOptions(options, body))
    }
  }

  /**
   * Creates a PUT request handler.
   * @description Factory method for PUT requests with body support.
   * @param requestHandler - Core request handler function
   * @param createRequestOptions - Function to create request options with body
   * @returns PUT request method
   */
  static createPut<T = unknown>(
    requestHandler: (
      method: string,
      url: string,
      options: FetchOptions
    ) => Promise<FetchResponse<T>>,
    createRequestOptions: (options: FetchOptions, body?: FetchRequestBody) => FetchOptions
  ) {
    return async (
      url: string,
      body?: FetchRequestBody,
      options: FetchOptions = {}
    ): Promise<FetchResponse<T>> => {
      return requestHandler(httpMethods.PUT, url, createRequestOptions(options, body))
    }
  }

  /**
   * Creates a PATCH request handler.
   * @description Factory method for PATCH requests with body support.
   * @param requestHandler - Core request handler function
   * @param createRequestOptions - Function to create request options with body
   * @returns PATCH request method
   */
  static createPatch<T = unknown>(
    requestHandler: (
      method: string,
      url: string,
      options: FetchOptions
    ) => Promise<FetchResponse<T>>,
    createRequestOptions: (options: FetchOptions, body?: FetchRequestBody) => FetchOptions
  ) {
    return async (
      url: string,
      body?: FetchRequestBody,
      options: FetchOptions = {}
    ): Promise<FetchResponse<T>> => {
      return requestHandler(httpMethods.PATCH, url, createRequestOptions(options, body))
    }
  }

  /**
   * Creates a DELETE request handler.
   * @description Factory method for DELETE requests.
   * @param requestHandler - Core request handler function
   * @returns DELETE request method
   */
  static createDelete<T = unknown>(
    requestHandler: (
      method: string,
      url: string,
      options: FetchOptions
    ) => Promise<FetchResponse<T>>
  ) {
    return async (url: string, options: FetchOptions = {}): Promise<FetchResponse<T>> => {
      return requestHandler(httpMethods.DELETE, url, options)
    }
  }

  /**
   * Creates a HEAD request handler.
   * @description Factory method for HEAD requests.
   * @param requestHandler - Core request handler function
   * @returns HEAD request method
   */
  static createHead<T = unknown>(
    requestHandler: (
      method: string,
      url: string,
      options: FetchOptions
    ) => Promise<FetchResponse<T>>
  ) {
    return async (url: string, options: FetchOptions = {}): Promise<FetchResponse<T>> => {
      return requestHandler(httpMethods.HEAD, url, options)
    }
  }

  /**
   * Creates an OPTIONS request handler.
   * @description Factory method for OPTIONS requests.
   * @param requestHandler - Core request handler function
   * @returns OPTIONS request method
   */
  static createOptions<T = unknown>(
    requestHandler: (
      method: string,
      url: string,
      options: FetchOptions
    ) => Promise<FetchResponse<T>>
  ) {
    return async (url: string, options: FetchOptions = {}): Promise<FetchResponse<T>> => {
      return requestHandler(httpMethods.OPTIONS, url, options)
    }
  }

  /**
   * Creates a TRACE request handler.
   * @description Factory method for TRACE requests.
   * @param requestHandler - Core request handler function
   * @returns TRACE request method
   */
  static createTrace<T = unknown>(
    requestHandler: (
      method: string,
      url: string,
      options: FetchOptions
    ) => Promise<FetchResponse<T>>
  ) {
    return async (url: string, options: FetchOptions = {}): Promise<FetchResponse<T>> => {
      return requestHandler(httpMethods.TRACE, url, options)
    }
  }
}
