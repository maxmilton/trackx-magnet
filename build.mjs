/* eslint-disable import/extensions, import/no-extraneous-dependencies, no-console */

import esbuild from 'esbuild';
import { decodeUTF8, encodeUTF8, writeFiles } from 'esbuild-minify-templates';
import fs from 'fs/promises';
import path from 'path';
import { createManifest } from './manifest.config.mjs';

// TODO: It's not possible to change this without recompiling the extension
// because of the extension CSP is static. Provide documentation about how
// to compile a custom build.
const API_ENDPOINT =
  process.env.API_ENDPOINT || 'https://api.trackx.app/v1/pxdfcbscygy';
const API_ORIGIN = new URL(API_ENDPOINT).origin;

const firefox = process.env.FIREFOX_BUILD;
const mode = process.env.NODE_ENV;
const dev = mode === 'development';
const dir = path.resolve(); // loose alternative to __dirname in node ESM
const manifest = createManifest({ API_ENDPOINT, API_ORIGIN });
const release = manifest.version_name || manifest.version;
const target = firefox ? ['firefox91'] : ['chrome102']; // Firefox ESR and Chrome stable

if (firefox) {
  delete manifest.version_name;
  delete manifest.key;
}

/** @type {esbuild.Plugin} */
const analyzeMeta = {
  name: 'analyze-meta',
  setup(build) {
    if (!build.initialOptions.metafile) return;

    build.onEnd(
      (result) =>
        result.metafile &&
        build.esbuild.analyzeMetafile(result.metafile).then(console.log),
    );
  },
};

/** @type {esbuild.Plugin} */
const minifyJS = {
  name: 'minify-js',
  setup(build) {
    if (!build.initialOptions.minify) return;

    build.onEnd(async (result) => {
      if (result.outputFiles) {
        for (let index = 0; index < result.outputFiles.length; index += 1) {
          const file = result.outputFiles[index];

          if (path.extname(file.path) !== '.js') return;

          // eslint-disable-next-line no-await-in-loop
          const out = await build.esbuild.transform(decodeUTF8(file.contents), {
            loader: 'js',
            minify: true,
            // target: build.initialOptions.target,
          });

          // eslint-disable-next-line no-param-reassign
          result.outputFiles[index].contents = encodeUTF8(out.code);
        }
      }
    });
  },
};

// Extension manifest
await fs.writeFile(
  path.join(dir, 'dist', 'manifest.json'),
  JSON.stringify(manifest),
);

// TrackX client script
const out = await esbuild.build({
  entryPoints: ['src/trackx.ts'],
  outfile: 'dist/trackx.js',
  platform: 'browser',
  target,
  define: {
    'process.env.API_ENDPOINT': JSON.stringify(API_ENDPOINT),
    'process.env.APP_RELEASE': JSON.stringify(release),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  plugins: [analyzeMeta, minifyJS],
  bundle: true,
  minify: !dev,
  sourcemap: dev && 'inline',
  metafile: !dev && process.stdout.isTTY,
  write: false,
  logLevel: 'debug',
});

// Content script
await esbuild.build({
  entryPoints: ['src/content.ts'],
  outfile: 'dist/content.js',
  platform: 'browser',
  target,
  define: {
    'process.env.APP_RELEASE': JSON.stringify(release),
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env.TRACKX_CODE': JSON.stringify(
      decodeUTF8(out.outputFiles[0].contents),
    ),
  },
  plugins: [analyzeMeta, minifyJS, writeFiles()],
  bundle: true,
  minify: !dev,
  sourcemap: dev,
  write: dev,
  metafile: !dev && process.stdout.isTTY,
  logLevel: 'debug',
});

// Background script
await esbuild.build({
  entryPoints: ['src/background.ts'],
  outfile: 'dist/background.js',
  platform: 'browser',
  target,
  define: {
    'process.env.API_ENDPOINT': JSON.stringify(API_ENDPOINT),
    'process.env.API_ORIGIN': JSON.stringify(API_ORIGIN),
    'process.env.APP_RELEASE': JSON.stringify(release),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  plugins: [analyzeMeta, minifyJS, writeFiles()],
  bundle: true,
  minify: !dev,
  sourcemap: dev,
  write: dev,
  metafile: !dev && process.stdout.isTTY,
  logLevel: 'debug',
});
