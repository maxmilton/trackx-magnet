/* eslint-disable import/extensions, import/no-extraneous-dependencies, no-console */

import esbuild from 'esbuild';
import fs from 'fs/promises';
import path from 'path';
import createManifest from './manifest.config.js';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';
const dir = path.resolve(); // no __dirname in node ESM

// TODO: It's not possible to change this without recompiling the extension
// because of the extension CSP is static, so provide documentation about how
// to compile
const API_ENDPOINT = process.env.API_ENDPOINT || 'https://api.trackx.app/v1/pxdfcbscygy';
const API_ORIGIN = new URL(API_ENDPOINT).origin;

const manifest = createManifest({
  API_ENDPOINT,
  API_ORIGIN,
});
const release = manifest.version_name || manifest.version;

if (process.env.FIREFOX_BUILD) {
  delete manifest.version_name;
  delete manifest.key;
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

// TrackX client script
const out = await esbuild
  .build({
    entryPoints: ['src/trackx.ts'],
    // outfile: 'dist/trackx.js',
    platform: 'browser',
    target: ['es2021'],
    define: {
      'process.env.API_ENDPOINT': JSON.stringify(API_ENDPOINT),
      'process.env.APP_RELEASE': JSON.stringify(release),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    banner: { js: '"use strict";' },
    bundle: true,
    minify: !dev,
    sourcemap: dev && 'inline',
    watch: dev,
    metafile: !dev && process.stdout.isTTY,
    write: false,
    logLevel: 'debug',
  })
  .then(analyzeMeta);

// Content script
await esbuild
  .build({
    entryPoints: ['src/content.ts'],
    outfile: 'dist/content.js',
    platform: 'browser',
    target: ['es2021'],
    define: {
      'process.env.APP_RELEASE': JSON.stringify(release),
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.TRACKX_CODE': JSON.stringify(out.outputFiles?.[0].text),
    },
    banner: { js: '"use strict";' },
    bundle: true,
    minify: !dev,
    sourcemap: dev && 'inline',
    watch: dev,
    metafile: !dev && process.stdout.isTTY,
    logLevel: 'debug',
  })
  .then(analyzeMeta);

// Background script
await esbuild
  .build({
    entryPoints: ['src/background.ts'],
    outfile: 'dist/background.js',
    platform: 'browser',
    target: ['es2021'],
    define: {
      'process.env.API_ENDPOINT': JSON.stringify(API_ENDPOINT),
      'process.env.API_ORIGIN': JSON.stringify(API_ORIGIN),
      'process.env.APP_RELEASE': JSON.stringify(release),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    banner: { js: '"use strict";' },
    bundle: true,
    minify: !dev,
    sourcemap: dev && 'inline',
    legalComments: 'external',
    watch: dev,
    metafile: !dev && process.stdout.isTTY,
    logLevel: 'debug',
  })
  .then(analyzeMeta);

// Extension manifest
await fs.writeFile(
  path.join(dir, 'dist', 'manifest.json'),
  JSON.stringify(manifest),
);
