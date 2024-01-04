/* eslint-disable no-console */

import * as terser from 'terser';
import { createManifest } from './manifest.config';
import blocklist from './src/blocklist.json' assert { type: 'json' };

// TODO: It's not possible to change this without recompiling the extension
// because of the extension CSP is static. Provide documentation about how
// to compile a custom build.
const API_ENDPOINT =
  process.env.API_ENDPOINT ?? 'https://api.trackx.app/v1/pxdfcbscygy';
const API_ORIGIN = new URL(API_ENDPOINT).origin;

const mode = Bun.env.NODE_ENV;
const dev = mode === 'development';
const manifest = createManifest({ API_ENDPOINT, API_ORIGIN });
const release = manifest.version_name ?? manifest.version;

// TODO: Firefox support for manifest v3, esp. content_scripts "world".
if (process.env.FIREFOX_BUILD) {
  delete manifest.version_name;
  delete manifest.key;
}

// Extension manifest
await Bun.write('dist/manifest.json', JSON.stringify(manifest));

// In-page injected content script (same execution context as page)
console.time('build');
const out = await Bun.build({
  entrypoints: ['src/magnet.ts'],
  outdir: 'dist',
  target: 'browser',
  // FIXME: Use iife once bun supports it.
  // format: 'iife', // error tracking must not mutate global state!!
  // define: {
  //   'process.env.NODE_ENV': JSON.stringify(mode),
  // },
  minify: !dev,
  sourcemap: dev ? 'external' : 'none',
});
console.timeEnd('build');

// Content script (isolated execution context)
console.time('build2');
const out2 = await Bun.build({
  entrypoints: ['src/service.ts'],
  outdir: 'dist',
  target: 'browser',
  define: {
    'process.env.API_ENDPOINT': JSON.stringify(API_ENDPOINT),
    'process.env.API_ORIGIN': JSON.stringify(API_ORIGIN),
    'process.env.APP_RELEASE': JSON.stringify(release),
    'process.env.BLOCKLIST_REGEX_STR': JSON.stringify(blocklist.join('|')),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  minify: !dev,
  sourcemap: dev ? 'external' : 'none',
});
console.timeEnd('build2');

console.log(out, out2);

const nameCache = {};

async function minifyJS(artifact: Blob & { path: string }) {
  let source = await artifact.text();

  // Improve joining vars; terser doesn't do this so we do it manually
  source = source.replaceAll('const ', 'let ');

  const result = await terser.minify(source, {
    ecma: 2020,
    module: true,
    nameCache,
    compress: {
      // Prevent functions being inlined
      reduce_funcs: false,
      // XXX: Comment out to keep performance markers in non-dev builds for debugging
      pure_funcs: ['performance.mark', 'performance.measure'],
      // Inline `new RegExp`
      unsafe: true,
      passes: 3,
    },
    mangle: {
      properties: {
        regex: /^\$\$/,
      },
    },
  });

  await Bun.write(artifact.path, result.code!);
}

if (!dev) {
  console.time('minify');
  await minifyJS(out.outputs[0]);
  await minifyJS(out2.outputs[0]);
  console.timeEnd('minify');
}
