/* eslint-disable @typescript-eslint/no-confusing-void-expression, no-restricted-globals */

import type { EventMeta } from 'trackx/types';
import type { CaptureData } from './types';

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

const listen: Window['addEventListener'] = addEventListener;

const capture = (type: number, error: unknown, extra?: EventMeta): void =>
  postMessage(
    {
      x_x: 0,
      $$type: type,
      $$error: error,
      $$extra: extra,
    } satisfies CaptureData,
    '*',
  );

listen('error', (event) => capture(EventTypeUnhandledError, event.error));
listen('unhandledrejection', (event) =>
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
