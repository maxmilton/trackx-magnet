import * as trackx from 'trackx';
import blocklist from './blocklist.json';

const reBlockList = new RegExp(blocklist.join('|'), 'i');

trackx.setup(
  'https://api.trackx.app/v1/pxdfcbscygy/event',
  // prevent sending reports with data that match words from the block list
  (data) => (reBlockList.test(
    `${data.url!}-${data.meta!.initiator as string}-${
      data.meta!.url as string
    }`,
  )
    ? null
    : data),
);
trackx.meta._agent = 'harvest-errors';
trackx.meta._ctx = 'background';
trackx.meta._release = process.env.APP_RELEASE;

if (process.env.NODE_ENV !== 'production') {
  trackx.meta.NODE_ENV = process.env.NODE_ENV || 'NULL';
}

chrome.webRequest.onErrorOccurred.addListener(
  (event) => trackx.sendEvent(
    new Error(event.error),
    {
      ...event,
      _ctx: 'webrequest',
    },
    true,
  ),
  {
    urls: ['<all_urls>'],
  },
);
