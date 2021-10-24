import * as trackx from 'trackx';

// Capture the values for things trackx overrides before setup
const oldOnerror = globalThis.onerror;
const oldOnunhandledrejection = globalThis.onunhandledrejection;
// eslint-disable-next-line no-console
const oldConsoleError = console.error;

trackx.setup(`${process.env.API_BASE_URL!}/event`, (payload, reason) => {
  if (!payload.meta.details && reason != null && typeof reason === 'object') {
    const details: Record<string, unknown> = {};

    // eslint-disable-next-line guard-for-in
    for (const key in reason) {
      details[key] = (reason as Record<string, unknown>)[key] ?? null;
    }

    // eslint-disable-next-line no-param-reassign
    payload.meta.details = details;
    // @ts-expect-error - FIXME: TS 4.5 correctly knowns reason is not null, remove this comment
    // eslint-disable-next-line no-param-reassign
    payload.meta.ctor = reason.constructor?.name;
  }

  return payload;
});
trackx.meta.agent = 'trackx-magnet';
trackx.meta.release = process.env.APP_RELEASE;
trackx.meta.context = 'content';
trackx.meta.title = document.title;
trackx.meta.referrer = document.referrer;

// window.parent may be undefined in cross-origin frames due to browser security
if (globalThis.parent) {
  const urls = [];
  let parent: Window = window;

  // eslint-disable-next-line no-cond-assign
  while ((parent = parent.parent) !== window.top) {
    urls.push(parent.location.href);
  }

  // trackx.meta.parent_url = globalThis.parent.location.href;
  trackx.meta.parent_url = urls.join(' |> ') || undefined;
  trackx.meta.parent_title = globalThis.parent.document.title || undefined;
}

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

      // XXX: By default the trackx client uses an Image + setting its src in
      // order to send the ping which is great for general purpose use but
      // it is blocking; instead here we use fetch + keepalive which yields a
      // similar result but is async so it shouldn't slow down extension
      // users web browsing at all
      void fetch(`${process.env.API_BASE_URL!}/ping?sid=${trackx.sid}`, {
        method: 'POST',
        mode: 'no-cors',
        credentials: 'omit',
        keepalive: true,
      });
    } else {
      // Kill trackx; remove its triggers and restore original values

      // NOTE: It's possible for an error to get through before this point
      // but there's no way to check the tab URL and title against the block
      // list synchronously without adding the block list in the content
      // script (which is something we definitely want to avoid) or pausing
      // the page JS execution (which would be a horrible UX).

      globalThis.onerror = oldOnerror;
      globalThis.onunhandledrejection = oldOnunhandledrejection;
      // eslint-disable-next-line no-console
      console.error = oldConsoleError;
    }

    globalThis.removeEventListener('message', handleMessage);
  }
};

globalThis.addEventListener('message', handleMessage);
