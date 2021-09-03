import type * as TrackX from 'trackx';

declare global {
  // Added using inject script element technique + process.env.TRACKX_CLIENT_JS
  var __trackx: typeof TrackX; // eslint-disable-line
}

const init = () => {
  // Capture the values for things trackx overrides before setup
  const oldOnerror = window.onerror;
  const oldOnunhandledrejection = window.onunhandledrejection;
  // eslint-disable-next-line no-console
  const oldConsoleError = console.error;

  __trackx.setup(`${process.env.API_BASE_URL!}/event`);
  __trackx.meta._agent = 'trackx-harvester';
  __trackx.meta._release = process.env.APP_RELEASE;
  __trackx.meta._ctx = 'content';
  __trackx.meta.title = document.title;

  // window.top may be undefined in cross-origin frames due to browser security
  __trackx.meta.top_url = window.top?.location.href;
  __trackx.meta.top_title = window.top?.document.title;

  if (process.env.NODE_ENV !== 'production') {
    __trackx.meta.NODE_ENV = process.env.NODE_ENV || 'NULL';
  }

  const handleMessage = ({ data, origin }: MessageEvent) => {
    if (
      origin === window.location.origin
      && typeof data === 'object'
      && '__tab' in data
    ) {
      const tab = (data as { __tab: chrome.tabs.Tab | undefined }).__tab;

      if (tab) {
        __trackx.meta.tab_url = tab.url;
        __trackx.meta.tab_title = tab.title;

        void fetch(
          `${process.env.API_BASE_URL!}/ping?sid=${
            sessionStorage.t__x as string
          }`,
          {
            method: 'POST',
            mode: 'no-cors',
            credentials: 'omit',
            keepalive: true,
          },
        );
      } else {
        // Kill trackx; remove its triggers and restore original values

        // NOTE: It's possible for an error to get through before this point
        // but there's no way to check the tab URL and title against the block
        // list synchronously without adding the block list in the content
        // script (which is something we definitely want to avoid) or pausing
        // the page JS execution (which would be a horrible UX).

        window.onerror = oldOnerror;
        window.onunhandledrejection = oldOnunhandledrejection;
        // eslint-disable-next-line no-console
        console.error = oldConsoleError;
      }

      window.removeEventListener('message', handleMessage);
    }
  };

  window.addEventListener('message', handleMessage);
};

// Because extension content scripts run in isolated worlds, inject a script tag
// to execute trackx code in the actual page context
//  ↳ Inspired by https://github.com/barbushin/javascript-errors-notifier/blob/7d2fe60f9c44676706eaba6b44ce3e9a0beb949d/content.js#L170-L173
const script = document.createElement('script');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
script.textContent = `${process.env.TRACKX_CLIENT_JS!};(${init.toString()})()`;
document.documentElement.appendChild(script);
script.remove();

// Since content scripts can't use the chrome.tabs API, we need to get tab data
// from the background script and then send it to the real page via postMessage
// because the page and content script are considered cross-origin
chrome.runtime.sendMessage('tab', (tab: chrome.tabs.Tab | undefined) => {
  window.postMessage({ __tab: tab }, window.location.origin);
});
