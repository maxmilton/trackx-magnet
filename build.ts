/* eslint-disable no-await-in-loop, no-console */

// TODO: Firefox support for manifest v3, esp. content_scripts "world".

import * as swc from "@swc/core";
import type { BuildArtifact } from "bun";
import { createManifest } from "./manifest.config.ts";
import blocklist from "./src/blocklist.json" with { type: "json" };

function assert(ok: boolean): asserts ok {
  if (!ok) throw new Error("assertion failure");
}

// TODO: Add docs explaining how to change the API endpoint. It's not possible
// to change without recompiling because the extension CSP is static.

// eslint-disable-next-line prefer-destructuring
const API_ENDPOINT = Bun.env.API_ENDPOINT;
const API_ORIGIN = new URL(API_ENDPOINT).origin;

assert(
  API_ENDPOINT.startsWith("https://") || API_ENDPOINT.startsWith("http://"),
);

const firefox = Bun.env.FIREFOX_BUILD;
const mode = Bun.env.NODE_ENV;
const dev = mode === "development";

console.time("prebuild");
await Bun.$`rm -rf dist`;
await Bun.$`cp -r static dist`;
console.timeEnd("prebuild");

// Extension manifest
console.time("manifest");
const manifest = createManifest({ API_ENDPOINT, API_ORIGIN });
const release = manifest.version_name ?? manifest.version;

if (firefox) {
  manifest.version_name = undefined;
  manifest.key = undefined;
}

await Bun.write("dist/manifest.json", JSON.stringify(manifest));
console.timeEnd("manifest");

// In-page injected content script (same execution context as page)
console.time("build:magnet");
const out1 = await Bun.build({
  entrypoints: ["src/magnet.ts"],
  outdir: "dist",
  target: "browser",
  format: "iife", // error tracking must not mutate global state
  // define: {
  //   'process.env.NODE_ENV': JSON.stringify(mode),
  // },
  minify: !dev,
  sourcemap: dev ? "linked" : "none",
});
console.timeEnd("build:magnet");

// Content script (isolated execution context)
console.time("build:service");
const out2 = await Bun.build({
  entrypoints: ["src/service.ts"],
  outdir: "dist",
  target: "browser",
  define: {
    "process.env.API_ENDPOINT": JSON.stringify(API_ENDPOINT),
    "process.env.API_ORIGIN": JSON.stringify(API_ORIGIN),
    "process.env.APP_RELEASE": JSON.stringify(release),
    "process.env.BLOCKLIST_REGEX_STR": JSON.stringify(blocklist.join("|")),
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
  minify: !dev,
  sourcemap: dev ? "linked" : "none",
});
console.timeEnd("build:service");

// // consistent mangled names across files
// const nameCache = {};

// async function minifyJS(artifact: BuildArtifact) {
//   const source = await artifact.text();
//   const result = await swc.minify(source, {
//     ecma: 2020,
//     module: true,
//     nameCache,
//     compress: {
//       // Prevent functions being inlined
//       reduce_funcs: false,
//       // XXX: Comment out to keep performance markers in non-dev builds for debugging
//       pure_funcs: ['performance.mark', 'performance.measure'],
//       // Inline `new RegExp`
//       unsafe: true,
//       passes: 3,
//     },
//     mangle: {
//       properties: {
//         regex: /^\$\$/,
//       },
//     },
//   });
//
//   await Bun.write(artifact.path, result.code!);
// }

async function minifyJS(artifacts: BuildArtifact[]) {
  for (const artifact of artifacts) {
    if (artifact.path.endsWith(".js") || artifact.path.endsWith(".mjs")) {
      const source = await artifact.text();
      const result = await swc.minify(source, {
        ecma: 2020,
        module: true,
        compress: {
          reduce_funcs: false,
          unsafe: true, // inline `new RegExp`
          passes: 3,
          // XXX: Comment out to keep performance markers for debugging
          pure_funcs: ["performance.mark", "performance.measure"],
        },
        mangle: {
          props: {
            regex: String.raw`^\$\$`,
          },
        },
      });
      await Bun.write(artifact.path, result.code);
    }
  }
}

if (!dev) {
  console.time("minify");
  await minifyJS(out1.outputs);
  await minifyJS(out2.outputs);
  console.timeEnd("minify");
}
