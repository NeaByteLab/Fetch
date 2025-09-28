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

import { FetchError } from '@interfaces/index'
import { errorMessages } from '@constants/index'

/**
 * Request validation utilities.
 * @description Validates request parameters and configuration.
 */
export class RequestValidator {
  /**
   * Validates request parameters and configuration.
   * @description Checks URL validity, retries, timeout, and download configuration.
   * @param url - Request URL to validate
   * @param config - Request configuration to validate
   * @throws {FetchError} On validation failure
   */
  static validateRequest(
    url: string,
    config: {
      retries: number
      timeout: number
      download: boolean
      filename?: string
    }
  ): void {
    if (typeof url !== 'string' || url.trim() === '') {
      throw new FetchError(errorMessages.URL_INVALID, undefined, undefined, url)
    }
    if (config.retries < 0) {
      throw new FetchError(errorMessages.RETRIES_NON_NEGATIVE, undefined, undefined, url)
    }
    if (config.timeout < 0) {
      throw new FetchError(errorMessages.TIMEOUT_NON_NEGATIVE, undefined, undefined, url)
    }
    if (config.download && (config.filename === undefined || config.filename.trim() === '')) {
      throw new FetchError(errorMessages.FILENAME_REQUIRED, undefined, undefined, url)
    }
  }
}
