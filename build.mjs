// TODO: Fix types and remove these lint exceptions once typescript-eslint can handle js/mjs
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable import/extensions, import/no-extraneous-dependencies */

import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import manifest from './manifest.config.js';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';
const dir = path.resolve(); // no __dirname in node ESM

// TODO: Allow customising this at runtime so users don't need to run a build
// when they want to change the API endpoint
//  ↳ May be tricky to get settings data in content scripts because we need the
//    script to init `trackx` ASAP to collect page load errors, however, the
//    `chrome.storage` API is async
const API_BASE_URL = 'https://api.trackx.app/v1/pxdfcbscygy';

/** @param {Error|null} err */
function handleErr(err) {
  if (err) throw err;
}

/**
 * @param {esbuild.BuildResult} buildResult
 * @returns {Promise<esbuild.BuildResult>}
 */
async function analyzeMeta(buildResult) {
  if (buildResult.metafile) {
    console.log(await esbuild.analyzeMetafile(buildResult.metafile));
  }

  return buildResult;
}

// Content script
esbuild
  .build({
    entryPoints: ['src/content.ts'],
    outfile: 'dist/content.js',
    platform: 'browser',
    target: ['es2020'],
    define: {
      'process.env.APP_RELEASE': JSON.stringify(manifest.version_name),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    banner: { js: '"use strict";' },
    bundle: true,
    minify: !dev,
    sourcemap: dev && 'inline',
    watch: dev,
    metafile: process.stdout.isTTY,
    logLevel: 'debug',
  })
  .then(analyzeMeta)
  .catch(handleErr);

// TrackX client script
esbuild
  .build({
    entryPoints: ['src/trackx.ts'],
    outfile: 'dist/trackx.js',
    platform: 'browser',
    target: ['es2020'],
    define: {
      'process.env.API_BASE_URL': JSON.stringify(API_BASE_URL),
      'process.env.APP_RELEASE': JSON.stringify(manifest.version_name),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    banner: { js: '"use strict";' },
    bundle: true,
    minify: !dev,
    sourcemap: dev && 'inline',
    watch: dev,
    metafile: process.stdout.isTTY,
    logLevel: 'debug',
  })
  .then(analyzeMeta)
  .catch(handleErr);

// Background script
esbuild
  .build({
    entryPoints: ['src/background.ts'],
    outfile: 'dist/background.js',
    platform: 'browser',
    target: ['es2020'],
    define: {
      'process.env.API_BASE_URL': JSON.stringify(API_BASE_URL),
      'process.env.API_ORIGIN': JSON.stringify(new URL(API_BASE_URL).origin),
      'process.env.APP_RELEASE': JSON.stringify(manifest.version_name),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    banner: { js: '"use strict";' },
    bundle: true,
    minify: !dev,
    sourcemap: dev && 'inline',
    legalComments: 'external',
    watch: dev,
    metafile: process.stdout.isTTY,
    logLevel: 'debug',
  })
  .then(analyzeMeta)
  .catch(handleErr);

// Extension manifest
fs.writeFile(
  path.join(dir, 'dist', 'manifest.json'),
  JSON.stringify(manifest),
  handleErr,
);
