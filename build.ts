// TODO: Firefox support for manifest v3, esp. content_scripts "world".

import * as terser from 'terser';
import { createManifest } from './manifest.config';
import blocklist from './src/blocklist.json' with { type: 'json' };

// FIXME: Add docs explaining how to change the API endpoint. It's not possible
// to change without recompiling because the extension CSP is static.
const API_ENDPOINT =
  Bun.env.API_ENDPOINT || 'https://api.trackx.app/v1/pxdfcbscygy';
const API_ORIGIN = new URL(API_ENDPOINT).origin;

const firefox = Bun.env.FIREFOX_BUILD;
const mode = Bun.env.NODE_ENV;
const dev = mode === 'development';

console.time('prebuild');
await Bun.$`rm -rf dist`;
await Bun.$`cp -r static dist`;
console.timeEnd('prebuild');

// Extension manifest
console.time('manifest');
const manifest = createManifest({ API_ENDPOINT, API_ORIGIN });
const release = manifest.version_name ?? manifest.version;

if (firefox) {
  manifest.version_name = undefined;
  manifest.key = undefined;
}

await Bun.write('dist/manifest.json', JSON.stringify(manifest));
console.timeEnd('manifest');

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
console.log(out);

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
console.log(out2);

// consistent mangled names across files
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
