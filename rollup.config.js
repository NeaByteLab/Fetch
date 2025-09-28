/**
 * Rollup configuration for multiple module formats.
 * @description Builds ESM, CJS, and UMD formats with TypeScript compilation and minification.
 * @fileoverview Rollup configuration with TypeScript and multiple outputs
 */

import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import dts from 'rollup-plugin-dts'

/**
 * External dependencies for bundling.
 * @description Dependencies that should not be bundled.
 */
const external = [
  'node:fs',
  'node:tls',
  'node:crypto',
  'node:url',
  'node:https',
  'fs',
  'tls',
  'crypto',
  'url',
  'https'
]
/**
 * Base plugin configuration for all builds.
 * @description Core plugins for TypeScript compilation and module resolution.
 */
const plugins = [
  resolve({
    preferBuiltins: true,
    exportConditions: ['node', 'browser', 'import', 'require', 'default']
  }),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
    declarationMap: false,
    sourceMap: false,
    exclude: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**', '**/test/**']
  }),
  terser({
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn', 'console.error']
    },
    mangle: false,
    format: {
      comments: false
    }
  })
]
/**
 * Minified plugin configuration for production builds.
 * @description Includes base plugins plus Terser for minification.
 */
const minifyPlugins = [
  ...plugins,
  terser({
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn', 'console.error'],
      passes: 2,
      unsafe: true,
      unsafe_comps: true,
      unsafe_math: true,
      unsafe_proto: true
    },
    mangle: {
      reserved: ['Fetch', 'default', 'FetchError', 'createHeaders']
    },
    format: {
      comments: false
    }
  })
]

/**
 * Rollup build configurations for multiple module formats.
 * @description Build configurations for ESM, CJS, and UMD formats.
 */
export default [
  /**
   * Full ESM Build.
   * @description Complete API build for modern bundlers.
   */
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: false,
      exports: 'named'
    },
    external,
    plugins
  },
  /**
   * Minified ESM Build.
   * @description Minified ESM build for production.
   */
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.min.js',
      format: 'esm',
      sourcemap: false,
      exports: 'named'
    },
    external,
    plugins: minifyPlugins
  },

  /**
   * CommonJS Build.
   * @description Node.js compatible build.
   */
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: false,
      exports: 'named'
    },
    external,
    plugins
  },

  /**
   * Minified CommonJS Build.
   * @description Minified CommonJS build for production.
   */
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs.min.js',
      format: 'cjs',
      sourcemap: false,
      exports: 'named'
    },
    external,
    plugins: minifyPlugins
  },
  /**
   * UMD Build.
   * @description Universal module definition for browser global usage.
   */
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'Fetch',
      sourcemap: false,
      exports: 'named',
      globals: {
        'node:fs': 'fs',
        'node:tls': 'tls',
        'node:crypto': 'crypto',
        'node:url': 'url',
        'node:https': 'https',
        fs: 'fs',
        tls: 'tls',
        crypto: 'crypto',
        url: 'url',
        https: 'https'
      }
    },
    external: external,
    plugins
  },

  /**
   * Minified UMD Build.
   * @description Minified UMD build for production.
   */
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.min.js',
      format: 'umd',
      name: 'Fetch',
      sourcemap: false,
      exports: 'named',
      globals: {
        'node:fs': 'fs',
        'node:tls': 'tls',
        'node:crypto': 'crypto',
        'node:url': 'url',
        'node:https': 'https',
        fs: 'fs',
        tls: 'tls',
        crypto: 'crypto',
        url: 'url',
        https: 'https'
      }
    },
    external: external,
    plugins: minifyPlugins
  },

  /**
   * TypeScript Declaration Files.
   * @description Generates TypeScript declaration files.
   */
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm'
    },
    external,
    plugins: [
      dts({
        tsconfig: './tsconfig.json',
        respectExternal: true
      })
    ]
  }
]
