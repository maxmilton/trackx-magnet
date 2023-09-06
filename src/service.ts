/* eslint-disable no-restricted-globals */
/* eslint unicorn/no-await-expression-member: "warn" */

import type { ClientType, EventMeta, EventType } from 'trackx/types';
import type { CaptureData } from './types';

void fetch(`${process.env.API_ENDPOINT}/ping`, {
  method: 'POST',
  keepalive: true,
  mode: 'no-cors',
});

const FALLBACK_LOCK_TTL = 1800; // seconds; 30 minutes
const RETRY_LIMIT = 2;
const TIMEOUT_MS = 60_000; // 60 seconds

const listen: Window['addEventListener'] = addEventListener;

const blocklistMatch = () =>
  new RegExp(process.env.BLOCKLIST_REGEX_STR!, 'i').test(
    document.title + location.href,
  );

const send = async (
  route: 'event' | 'report',
  contentType: string,
  body: object,
  attempt = 0,
) => {
  if (
    attempt < RETRY_LIMIT &&
    !blocklistMatch() &&
    !(Date.now() < (await chrome.storage.local.get('lock')).lock)
  ) {
    const abort = new AbortController();
    setTimeout(() => abort.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${process.env.API_ENDPOINT}/${route}`, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': contentType },
        body: JSON.stringify(body),
        signal: abort.signal,
      });

      if (res.status === 429) {
        await chrome.storage.local.set({
          lock:
            Date.now() +
            (+res.headers.get('retry-after')! || FALLBACK_LOCK_TTL) * 1000,
        });
      } else if (res.status !== 200) {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw undefined;
      }
    } catch {
      void send(route, contentType, body, attempt + 1);
    }
  }
};

const sendEvent = (type: EventType, error: unknown, extraMeta?: EventMeta) => {
  const ex = (error != null && typeof error === 'object' ? error : {}) as Error;
  let message = (ex.message || error) as string;

  try {
    message = String(message);
  } catch {
    // Protect against primitive string conversion fail e.g., Object.create(null)
    message = Object.prototype.toString.call(message);
  }

  void send('event', 'application/json', {
    name: ex.name,
    message,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing, unicorn/error-message
    stack: ex.stack || new Error().stack,
    type,
    uri: location.href,
    meta: {
      _c: '_' as ClientType.Custom,
      _v: '0.0.0',
      // NODE_ENV: process.env.NODE_ENV ?? 'NULL',
      agent: 'trackx-magnet',
      release: process.env.APP_RELEASE,
      ancestors: [...location.ancestorOrigins],
      embedded: (() => {
        try {
          return frameElement?.nodeName ?? '';
        } catch {
          // Catch SecurityError when parent is cross-origin
          return 'cross-origin';
        }
      })(),
      ...extraMeta,
    },
  });
};

const sendReport = (body: object) => {
  void send('report', 'application/reports+json', body);
};

listen(
  'message',
  ({ data, source }: MessageEvent<CaptureData | undefined>) => {
    if (
      source === window &&
      data &&
      typeof data === 'object' &&
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      data.x_x === 0
    ) {
      sendEvent(data.$$type, data.$$error, data.$$extra);
    }
  },
  false,
);

// TODO: Verify this works (move to magnet.ts?)
listen('securitypolicyviolation', (event) => {
  const body: Record<string, unknown> = {};

  for (const key of [
    'blockedURI',
    'columnNumber',
    'disposition',
    'documentURI',
    'effectiveDirective',
    'lineNumber',
    'originalPolicy',
    'referrer',
    'sample',
    'sourceFile',
    'statusCode',
    'violatedDirective',
  ] as const) {
    body[key] = event[key];
  }

  sendReport([{ body, type: 'csp-violation', url: location.href }]);
});

// https://developer.mozilla.org/en-US/docs/Web/API/ReportingObserver
// https://web.dev/reporting-observer/
if ('ReportingObserver' in globalThis) {
  // TODO: Verify this works (keep in mind it's blocked in Brave)
  new ReportingObserver(sendReport, { buffered: true }).observe();
}
