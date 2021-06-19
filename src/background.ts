import * as trackx from 'trackx';
import blocklist from './blocklist.json';

const reBlockList = new RegExp(blocklist.join('|'), 'i');

trackx.setup(
  'https://api.trackx.app/v1/pxdfcbscygy/event',
  // prevent sending event reports which match our block list
  (data) => (reBlockList.test(
    `${data.url!}-${data.meta!.initiator as string}-${
      data.meta!.url as string
    }`,
  )
    ? null
    : data),
);
trackx.meta.release = process.env.APP_RELEASE;
trackx.meta.agent = 'harvest-errors';

if (process.env.NODE_ENV !== 'production') {
  trackx.meta.NODE_ENV = process.env.NODE_ENV || 'NULL';
}

chrome.webRequest.onErrorOccurred.addListener(
  (event) => trackx.sendEvent(
    new Error(event.error),
    {
      ...event,
      _from: 'webrequest',
    },
    true,
  ),
  {
    urls: ['<all_urls>'],
  },
);
