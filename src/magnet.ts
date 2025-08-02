/**
 * Context script for capturing errors in the browser and sending them to the
 * service script.
 *
 * Runs in the context of the page (not the extension) so it has access to the
 * same instance of `window`, `document`, etc. as the page.
 */

/* eslint-disable @typescript-eslint/no-confusing-void-expression */

import type { EventMeta } from "trackx/types";
import { type CaptureData, EventType } from "./types.ts";

declare const addEventListener: Window["addEventListener"];
declare const postMessage: Window["postMessage"];

// TODO: Check how custom errors are handled. The structured clone algorithm
// spec says non-standard error names should be set to "Error". It would be
// better to send the actual error name.
//  ↳ https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#error_types

const capture = (type: number, error: unknown, extra?: EventMeta): void =>
  // FIXME: Send via postMessage fails when error is or contains DOM nodes or
  // a function reference (due to the structured clone algorithm).
  // ↳ https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone
  postMessage({
    x_x: true,
    $$type: type,
    $$error: error,
    $$extra: extra,
  } satisfies CaptureData);

addEventListener("error", (event) =>
  capture(EventType.UNHANDLED_ERROR, event.error),
);
addEventListener("unhandledrejection", (event) =>
  capture(EventType.UNHANDLED_REJECTION, event.reason),
);

// eslint-disable-next-line no-console
console.error = new Proxy(console.error, {
  apply(target, thisArg, args) {
    if (args[0] instanceof Error) {
      capture(EventType.CONSOLE_ERROR, args[0], { rest: args.slice(1) });
    } else {
      capture(EventType.CONSOLE_ERROR, args);
    }
    target.apply(thisArg, args);
  },
});
