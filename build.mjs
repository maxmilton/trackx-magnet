/* eslint-disable import/extensions, import/no-extraneous-dependencies */

import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import manifest from './manifest.config.js';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';
const dir = path.resolve(); // no __dirname in node ESM

/** @param {Error|null} err */
function handleErr(err) {
  if (err) throw err;
}

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    platform: 'browser',
    target: ['chrome88'],
    define: {
      'process.env.APP_RELEASE': JSON.stringify(manifest.version_name),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    banner: { js: '"use strict";' },
    bundle: true,
    minify: !dev,
    sourcemap: dev,
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
