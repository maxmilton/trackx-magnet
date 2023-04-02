/* eslint-disable no-param-reassign */

import * as trackx from 'trackx/modern';
import './experimental-reports';
import { decycle } from './utils';

// Increase max stack frames for v8
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

    payload.meta.details =
      Object.keys(details).length > 0 ? decycle(details) : '';
  }

  payload.meta.ctor ??= (() => {
    try {
      // @ts-expect-error - Access unknown in a try/catch for safety
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
trackx.meta.referrer = document.referrer;
const ancestors = globalThis.location.ancestorOrigins;
trackx.meta.ancestors = (ancestors?.length && [...ancestors]) || '';
trackx.meta.embedded = (() => {
  try {
    return globalThis.frameElement?.nodeName || '';
  } catch {
    // Catch SecurityError when parent is cross-origin
    return 'cross-origin';
  }
})();

const screenWidth = globalThis.screen.width;
trackx.meta.screen_size =
  screenWidth < 576
    ? 'XS'
    : screenWidth < 992
    ? 'S'
    : screenWidth < 1440
    ? 'M'
    : screenWidth < 3840
    ? 'L'
    : 'XL';

if (process.env.NODE_ENV !== 'production') {
  trackx.meta.NODE_ENV = process.env.NODE_ENV || 'NULL';
}

// This script is likely to run before the document has been parsed so wait for
// the DOM to be generated before trying to access it
setTimeout(() => {
  trackx.meta.title = document.title;
});

const handleMessage = ({
  data,
  origin,
}: MessageEvent<{ __tab?: chrome.tabs.Tab | undefined }>) => {
  if (
    origin === globalThis.location.origin &&
    typeof data === 'object' &&
    '__tab' in data
  ) {
    const tab = data.__tab;

    if (tab) {
      trackx.meta.tab_title = tab.title;
      trackx.meta.tab_url = tab.url;

      trackx.ping();
    } else {
      // Disable sending trackx events -- but keep in mind an event could be
      // captured before this point because we can't get the tab URL and title
      // synchronously inside a page script
      disabled = true;
    }

    globalThis.removeEventListener('message', handleMessage);
  }
};

globalThis.addEventListener('message', handleMessage);
