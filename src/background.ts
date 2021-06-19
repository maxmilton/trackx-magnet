import * as trackx from 'trackx';

trackx.setup('https://api.trackx.app/v1/pxdfcbscygy/event');
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
