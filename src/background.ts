import * as trackx from 'trackx';
import blocklist from './blocklist.json';

const reBlock = new RegExp(blocklist.join('|'), 'i');

// eslint-disable-next-line no-underscore-dangle
trackx.setup('https://api.trackx.app/v1/pxdfcbscygy/event', (data) => (reBlock.test(data.url! + (data.meta!._topurl as string)) ? null : data));
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
      // eslint-disable-next-line no-restricted-globals
      _topurl: top.location.href,
    },
    true,
  ),
  {
    urls: ['<all_urls>'],
  },
);
