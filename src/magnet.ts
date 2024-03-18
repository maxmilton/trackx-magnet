/**
 * Context script for capturing errors in the browser and sending them to the
 * service script.
 *
 * Runs in the context of the page (not the extension) so it has access to the
 * same instance of `window`, `document`, etc. as the page.
 */

/* eslint-disable @typescript-eslint/no-confusing-void-expression */

import type { EventMeta } from 'trackx/types';
import type { CaptureData } from './types';

// TODO: Fix bun types overriding dom types
declare let addEventListener: Window['addEventListener'];
declare let postMessage: Window['postMessage'];

// Same as https://github.com/maxmilton/trackx/blob/master/packages/trackx/src/modern.ts#L27-L30
// TODO: Use enum once bun support inlining them; https://github.com/oven-sh/bun/issues/2945
// const enum EventType {
//   UnhandledError = 1,
//   UnhandledRejection = 2,
//   ConsoleError = 3,
// }
const EventTypeUnhandledError = 1;
const EventTypeUnhandledRejection = 2;
const EventTypeConsoleError = 3;

// TODO: Check how custom errors are handled. The structured clone algorithm
// spec says non-standard error names should be set to "Error". It would be
// better to send the actual error name.
//  ↳ https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#error_types

const capture = (type: number, error: unknown, extra?: EventMeta): void =>
  // FIXME: Send via postMessage fails when error is or contains DOM nodes or
  // a function reference (due to the structured clone algorithm).
  // ↳ https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone
  postMessage({
    // biome-ignore lint/style/useNamingConvention: less likely to collide with other extensions
    x_x: true,
    $$type: type,
    $$error: error,
    $$extra: extra,
  } satisfies CaptureData);

addEventListener('error', (event) =>
  capture(EventTypeUnhandledError, event.error),
);
addEventListener('unhandledrejection', (event) =>
  capture(EventTypeUnhandledRejection, event.reason),
);

// eslint-disable-next-line no-console
console.error = new Proxy(console.error, {
  apply(target, thisArg, args) {
    if (args[0] instanceof Error) {
      capture(EventTypeConsoleError, args[0], { rest: args.slice(1) });
    } else {
      capture(EventTypeConsoleError, args);
    }
    target.apply(thisArg, args);
  },
});
