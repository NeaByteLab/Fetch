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
import type { PeerCertificate } from 'node:tls'
import { createHash } from 'node:crypto'
import { URL } from 'node:url'
import https from 'node:https'

/**
 * SSL certificate extraction utilities.
 * @description Extracts SSL certificates and returns public key hash.
 * @note This utility is only available in Node.js environments, not in browsers.
 */
export class ExtractSSL {
  /**
   * Processes SSL certificate from target URL.
   * @description Connects to target URL and extracts SSL certificate public key hash.
   * @param targetUrl - The target URL to extract SSL from
   * @returns Promise with hash string or null if failed
   */
  static async process(targetUrl: string): Promise<string | null> {
    if (typeof window !== 'undefined') {
      throw new FetchError(errorMessages.SSL_BROWSER_NOT_SUPPORTED, undefined, undefined, targetUrl)
    }
    try {
      const { hostname, port }: { hostname: string; port: string } = new URL(targetUrl)
      const portNumber: number = port ? parseInt(port, 10) : 443
      return await new Promise<string | null>((resolve: (result: string | null) => void) => {
        const options: https.RequestOptions = {
          hostname,
          port: portNumber,
          path: '/',
          method: 'GET',
          agent: new https.Agent({
            checkServerIdentity: (_host: string, cert: PeerCertificate): Error | undefined => {
              try {
                const rawCert: Buffer | undefined = cert.raw
                if (rawCert == undefined) {
                  resolve(null)
                  return undefined
                }
                const derPubKey: Buffer | null = this.extractDerPublicKey(rawCert)
                if (derPubKey) {
                  resolve(createHash('sha256').update(derPubKey).digest('base64'))
                } else {
                  const publicKey: Buffer | undefined = cert.pubkey
                  if (publicKey) {
                    resolve(createHash('sha256').update(publicKey).digest('base64'))
                  } else {
                    resolve(null)
                  }
                }
                return undefined
              } catch {
                resolve(null)
                return undefined
              }
            }
          })
        }
        const req: ReturnType<typeof https.request> = https.request(options)
        req.on('error', () => {
          resolve(null)
        })
        req.setTimeout(5000, () => {
          req.destroy()
          resolve(null)
        })
        req.end()
      })
    } catch {
      return null
    }
  }

  /**
   * Extracts DER-encoded public key from raw certificate.
   * @description Parses the certificate to find and extract the DER-encoded public key.
   * @param rawCert - Raw DER-encoded certificate
   * @returns DER-encoded public key or null if not found
   */
  private static extractDerPublicKey(rawCert: Buffer): Buffer | null {
    try {
      const patterns: { pattern: Buffer; length: number }[] = [
        {
          pattern: Buffer.from([
            0x30, 0x59, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, 0x06,
            0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x03, 0x42, 0x00
          ]),
          length: 91
        },
        {
          pattern: Buffer.from([
            0x30, 0x59, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, 0x06,
            0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x03, 0x41, 0x00
          ]),
          length: 91
        },
        {
          pattern: Buffer.from([
            0x30, 0x82, 0x01, 0x22, 0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d,
            0x01, 0x01, 0x01, 0x05, 0x00, 0x03, 0x82, 0x01, 0x0f, 0x00
          ]),
          length: 294
        }
      ]
      for (const { pattern, length } of patterns) {
        const patternStart: number = rawCert.indexOf(pattern)
        if (patternStart !== -1) {
          const derPubKey: Buffer = rawCert.subarray(patternStart, patternStart + length)
          if (derPubKey.length === length) {
            return derPubKey
          }
        }
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Validates SSL pinning for the given URL.
   * @description Checks if the server's SSL certificate matches any of the provided pins.
   * @param url - The URL to validate
   * @param pins - Array of SSL pin hashes (max 20)
   * @throws {FetchError} If SSL pinning validation fails
   */
  static async validate(url: string, pins: string[]): Promise<void> {
    if (typeof window !== 'undefined') {
      throw new FetchError(errorMessages.SSL_BROWSER_NOT_SUPPORTED, undefined, undefined, url)
    }
    const maxPins: number = 20
    const limitedPins: string[] = pins.slice(0, maxPins)
    if (limitedPins.length === 0) {
      return
    }
    try {
      const certHash: string | null = await this.process(url)
      if (certHash == null || certHash === '') {
        throw new FetchError(
          errorMessages.SSL_CERTIFICATE_EXTRACTION_FAILED,
          undefined,
          undefined,
          url
        )
      }
      const isValidPin: boolean = limitedPins.some((pin: string) => {
        return certHash.slice(0, 44) === pin.slice(0, 44)
      })
      if (!isValidPin) {
        throw new FetchError(errorMessages.SSL_PINNING_VALIDATION_FAILED, undefined, undefined, url)
      }
    } catch (error) {
      if (error instanceof FetchError) {
        throw error
      }
      throw new FetchError(
        `${errorMessages.SSL_PINNING_VALIDATION_ERROR}: ${error instanceof Error ? error.message : errorMessages.UNKNOWN_ERROR}`,
        undefined,
        undefined,
        url
      )
    }
  }
}
