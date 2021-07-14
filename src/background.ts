import * as trackx from 'trackx';
import blocklist from './blocklist.json';

const reBlockList = new RegExp(blocklist.join('|'), 'i');

trackx.setup(
  'https://api.trackx.app/v1/pxdfcbscygy/event',
  // prevent sending reports with data that match words from the block list
  (data) => (reBlockList.test(
    [
      data.url,
      data.meta!.initiator,
      data.meta!.url,
      data.meta!.tab_url,
      data.meta!.tab_title,
    ].join('-'),
  )
    ? null
    : data),
);
trackx.meta._agent = 'harvest-errors';
trackx.meta._release = process.env.APP_RELEASE;
trackx.meta._ctx = 'background';

if (process.env.NODE_ENV !== 'production') {
  trackx.meta.NODE_ENV = process.env.NODE_ENV || 'NULL';
}

chrome.webRequest.onErrorOccurred.addListener(
  (event) => {
    if (event.tabId === -1) {
      trackx.sendEvent(
        new Error(event.error),
        {
          _ctx: 'webrequest',
          ...event,
        },
        true,
      );
    } else {
      // @ts-expect-error - tab may be undefined when no matching tab id
      chrome.tabs.get(event.tabId, (tab = {}) => {
        const error = chrome.runtime.lastError;
        if (error?.message?.startsWith('No tab with id') === false) {
          // eslint-disable-next-line no-console
          console.error(error);
        }

        trackx.sendEvent(
          new Error(event.error),
          {
            _ctx: 'webrequest',
            ...event,
            tab_pending_url: tab.pendingUrl,
            tab_url: tab.url,
            tab_title: tab.title,
            tab_active: tab.active,
            tab_highlighted: tab.highlighted,
          },
          true,
        );
      });
    }
  },
  {
    urls: ['<all_urls>'],
  },
);

chrome.runtime.onMessage.addListener((req, { tab }, reply) => {
  if (req === 'tab' && tab) {
    if (reBlockList.test(`${tab.url!}-${tab.title!}`)) {
      // empty response when tab data matches a word on the block list
      reply();
    } else {
      reply(tab);
    }
  }
});
