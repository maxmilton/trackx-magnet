/* eslint-disable no-param-reassign */
/* eslint-disable unicorn/no-nested-ternary */

import * as trackx from 'trackx/modern';
// import * as trackx from '../node_modules/trackx/src/modern';

// Increase max stack frames for v8 and IE
Error.stackTraceLimit = 40;

let disabled: boolean;

trackx.setup(process.env.API_ENDPOINT!, (payload, reason) => {
  if (disabled) return null;

  if (!payload.meta.details && reason != null && typeof reason === 'object') {
    const details: Record<string, unknown> = {};

    // eslint-disable-next-line guard-for-in
    for (const key in reason) {
      details[key] = (reason as Record<string, unknown>)[key] ?? null;
    }

    payload.meta.details = details.length ? details : '';
  }

  payload.meta.ctor ??= (() => {
    try {
      // @ts-expect-error - access unknown in a try/catch for safety
      return reason.constructor.name; // eslint-disable-line
    } catch {
      // No op
      return '';
    }
  })();
  payload.meta.proto ??= Object.prototype.toString.call(reason);

  return payload;
});
trackx.meta.agent = 'trackx-magnet';
trackx.meta.release = process.env.APP_RELEASE;
trackx.meta.context = 'content';
trackx.meta.title = document.title;
trackx.meta.referrer = document.referrer;
const ancestors = globalThis.location.ancestorOrigins;
trackx.meta.ancestors = (ancestors?.length && [...ancestors]) || '';
trackx.meta.embedded = (() => {
  try {
    return window.frameElement?.nodeName;
  } catch {
    // SecurityError when parent is cross-origin
    return 'cross-origin';
  }
})() || '';

// https://github.com/plausible/analytics/blob/086d4de74e7b29ed85d1f88067eff4c8598fa71a/tracker/src/plausible.js#L53
// https://github.com/plausible/analytics/blob/7a02aae2a562efd39f11fa405c0f084c4d59e8cc/lib/plausible_web/controllers/api/external_controller.ex#L255-L258
// low accuracy but interesting data point
const width = window.innerWidth;
trackx.meta.screen_size = width < 576
  ? 'Mobile'
  : width < 992
    ? 'Tablet'
    : width < 1440
      ? 'Laptop'
      : 'Desktop';

if (process.env.NODE_ENV !== 'production') {
  trackx.meta.NODE_ENV = process.env.NODE_ENV || 'NULL';
}

const handleMessage = ({
  data,
  origin,
}: MessageEvent<{ __tab?: chrome.tabs.Tab | undefined }>) => {
  if (
    origin === globalThis.location.origin
    && typeof data === 'object'
    && '__tab' in data
  ) {
    const tab = data.__tab;

    if (tab) {
      trackx.meta.tab_url = tab.url;
      trackx.meta.tab_title = tab.title;

      trackx.ping();
    } else {
      // Disable sending trackx events
      // NOTE: An event could get captured before this point because we can't
      // get the tab URL and title synchronously inside a page script
      disabled = true;
    }

    globalThis.removeEventListener('message', handleMessage);
  }
};

globalThis.addEventListener('message', handleMessage);
