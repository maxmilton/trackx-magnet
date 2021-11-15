// import * as trackx from 'trackx/modern';
import blocklist from './blocklist.json';

const reBlockList = new RegExp(blocklist.join('|'), 'i');

// trackx.setup(
//   `${process.env.API_ENDPOINT!}`,
//   // Don't send reports with data that match block list
//   (data) => (reBlockList.test(
//     [
//       data.uri,
//       data.meta.title,
//       data.meta.parent_url,
//       data.meta.parent_title,
//       data.meta.tab_url,
//       data.meta.tab_title,
//     ].join(','),
//   )
//     ? null
//     : data),
// );
// trackx.meta.agent = 'trackx-magnet';
// trackx.meta.release = process.env.APP_RELEASE;
// trackx.meta.context = 'background';

// if (process.env.NODE_ENV !== 'production') {
//   trackx.meta.NODE_ENV = process.env.NODE_ENV || 'NULL';
// }

// chrome.webRequest.onErrorOccurred.addListener(
//   (event) => {
//     if (event.tabId === -1) {
//       trackx.sendEvent(
//         new Error(event.error),
//         {
//           context: 'webrequest',
//           details: { ...event },
//         },
//         true,
//       );
//     } else {
//       // @ts-expect-error - tab may be undefined when no matching tab id
//       chrome.tabs.get(event.tabId, (tab = {}) => {
//         const error = chrome.runtime.lastError;
//         if (error?.message?.startsWith('No tab with id') === false) {
//           // eslint-disable-next-line no-console
//           console.error(error);
//         }

//         trackx.sendEvent(
//           new Error(event.error),
//           {
//             context: 'webrequest',
//             tab_pending_url: tab.pendingUrl,
//             tab_url: tab.url,
//             tab_title: tab.title,
//             tab_active: tab.active,
//             tab_highlighted: tab.highlighted,
//             details: { ...event },
//           },
//           true,
//         );
//       });
//     }
//   },
//   {
//     urls: ['<all_urls>'],
//   },
// );

// Modify CSP header if present to allow connecting to the TrackX API
// https://github.com/GoogleChrome/chrome-extensions-samples/blob/e716678b67fd30a5876a552b9665e9f847d6d84b/mv2-archive/extensions/no_cookies/background.js
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const headers = details.responseHeaders;

    if (headers) {
      for (const header of headers) {
        if (header.name === 'content-security-policy') {
          const val = header.value!;
          const connectSrcIndex = val.indexOf('connect-src');
          const defaultSrcIndex = val.indexOf('default-src');
          const reportUriIndex = val.indexOf('report-uri');

          if (connectSrcIndex !== -1) {
            // add to existing connect-src directive
            const nextSemiIndex = val.indexOf(';', connectSrcIndex);
            header.value = `${val.slice(
              0,
              nextSemiIndex !== -1 ? nextSemiIndex : undefined,
            )} ${process.env.API_ORIGIN!}${
              nextSemiIndex !== -1 ? val.slice(nextSemiIndex) : ''
            }`;
          } else if (defaultSrcIndex !== -1) {
            // add to existing default-src directive
            const nextSemiIndex = val.indexOf(';', defaultSrcIndex);
            header.value = `${val.slice(
              0,
              nextSemiIndex !== -1 ? nextSemiIndex : undefined,
            )} ${process.env.API_ORIGIN!}${
              nextSemiIndex !== -1 ? val.slice(nextSemiIndex) : ''
            }`;
          }

          if (reportUriIndex === -1) {
            // add new report-uri directive
            header.value += `;report-uri ${process.env.API_ENDPOINT!}/report`;
          }

          break;
        }
      }
    }

    return { responseHeaders: headers };
  },
  { urls: ['<all_urls>'] },
  [
    'blocking',
    'responseHeaders',
    // 'extraHeaders',
  ],
);

chrome.runtime.onMessage.addListener((req, { tab }, reply) => {
  if (req === 'tab' && tab) {
    if (reBlockList.test(`${tab.url!} ${tab.title!}`)) {
      // Empty response when tab data matches a word on the block list
      reply();
    } else {
      reply(tab);
    }
  }
});
