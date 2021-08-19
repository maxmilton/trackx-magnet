/* eslint-disable import/extensions, import/no-extraneous-dependencies */

import esbuild from 'esbuild';
import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import manifest from './manifest.config.js';

// @ts-expect-error - valid in node ESM
const require = createRequire(import.meta.url);

const mode = process.env.NODE_ENV;
const dev = mode === 'development';
const dir = path.resolve(); // no __dirname in node ESM

const TRACKX_API_REPORT_ENDPOINT = 'https://api.trackx.app/v1/pxdfcbscygy/event';
const TRACKX_API_PING_ENDPOINT = 'https://api.trackx.app/v1/pxdfcbscygy/ping';

const trackxClientJs = fs
  .readFileSync(require.resolve('trackx'), 'utf8')
  // rename global namespace to prevent overriding an app's trackx instance
  .replace('var trackx=', 'var __trackx=')
  .replace('\n//# sourceMappingURL=index.js.map\n', '');

/** @param {Error|null} err */
function handleErr(err) {
  if (err) throw err;
}

// Content script
esbuild
  .build({
    entryPoints: ['src/content.ts'],
    outfile: 'dist/content.js',
    platform: 'browser',
    target: ['chrome91'],
    define: {
      'process.env.APP_RELEASE': JSON.stringify(manifest.version_name),
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.TRACKX_CLIENT_JS': JSON.stringify(trackxClientJs),
      'process.env.TRACKX_API_PING_ENDPOINT': JSON.stringify(
        TRACKX_API_PING_ENDPOINT,
      ),
      'process.env.TRACKX_API_REPORT_ENDPOINT': JSON.stringify(
        TRACKX_API_REPORT_ENDPOINT,
      ),
    },
    bundle: true,
    minify: !dev,
    watch: dev,
    logLevel: 'debug',
  })
  .catch(handleErr);

// Background script
esbuild
  .build({
    entryPoints: ['src/background.ts'],
    outfile: 'dist/background.js',
    platform: 'browser',
    target: ['chrome91'],
    define: {
      'process.env.APP_RELEASE': JSON.stringify(manifest.version_name),
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.TRACKX_API_PING_ENDPOINT': JSON.stringify(
        TRACKX_API_PING_ENDPOINT,
      ),
      'process.env.TRACKX_API_REPORT_ENDPOINT': JSON.stringify(
        TRACKX_API_REPORT_ENDPOINT,
      ),
    },
    banner: { js: '"use strict";' },
    bundle: true,
    minify: !dev,
    watch: dev,
    logLevel: 'debug',
  })
  .catch(handleErr);

// Extension manifest
fs.writeFile(
  path.join(dir, 'dist', 'manifest.json'),
  JSON.stringify(manifest),
  handleErr,
);
