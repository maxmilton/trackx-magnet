// import * as trackx from 'trackx/modern';
import blocklist from './blocklist.json';

const NEL_HEADER_VALUE = '{"report_to":"default","max_age":1440}';

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

function modifyCSPHeader(header: string): string {
  let newHeader = header;
  const connectSrcIndex = newHeader.indexOf('connect-src');
  const defaultSrcIndex = newHeader.indexOf('default-src');

  if (connectSrcIndex !== -1) {
    // add to existing connect-src directive
    const nextSemiIndex = newHeader.indexOf(';', connectSrcIndex);
    newHeader = `${newHeader.slice(
      0,
      nextSemiIndex !== -1 ? nextSemiIndex : undefined,
    )} ${process.env.API_ORIGIN!}${
      nextSemiIndex !== -1 ? newHeader.slice(nextSemiIndex) : ''
    }`;
  } else if (defaultSrcIndex !== -1) {
    // add to existing default-src directive
    const nextSemiIndex = newHeader.indexOf(';', defaultSrcIndex);
    newHeader = `${newHeader.slice(
      0,
      nextSemiIndex !== -1 ? nextSemiIndex : undefined,
    )} ${process.env.API_ORIGIN!}${
      nextSemiIndex !== -1 ? newHeader.slice(nextSemiIndex) : ''
    }`;
  }

  const reportUriIndex = newHeader.indexOf('report-uri');
  if (reportUriIndex === -1) {
    // add new report-uri directive
    newHeader += `; report-uri ${process.env.API_ENDPOINT!}/report;`;
  }

  return newHeader;
}

function modifyReportingEndpointsHeader(header: string): string {
  let newHeader = header;
  const defaultIndex = newHeader.indexOf('default=');

  if (defaultIndex !== -1) {
    const nextCommaIndex = newHeader.indexOf(',', defaultIndex);

    // replace existing default endpoint
    newHeader = `${newHeader.slice(0, defaultIndex)}default="${process.env
      .API_ENDPOINT!}/report"${
      nextCommaIndex !== -1 ? newHeader.slice(nextCommaIndex) : ''
    }`;
  } else {
    // add new default endpoint
    newHeader += `, default="${process.env.API_ENDPOINT!}/report"`;
  }

  return newHeader;
}

function modifyReportToHeader(header: string): string {
  // FIXME: Replace existing default endpoint or add new default endpoint
  return header;
}

// Modify CSP header if present to allow connecting to the TrackX API
// https://github.com/GoogleChrome/chrome-extensions-samples/blob/e716678b67fd30a5876a552b9665e9f847d6d84b/mv2-archive/extensions/no_cookies/background.js
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const responseHeaders = details.responseHeaders || [];
    let hasReportingEndpoints;
    let hasReportTo;
    let hasNEL;

    for (const header of responseHeaders) {
      switch (header.name) {
        case 'content-security-policy':
        case 'content-security-policy-report-only':
          header.value = modifyCSPHeader(header.value!);
          break;
        case 'reporting-endpoints':
          hasReportingEndpoints = true;
          header.value = modifyReportingEndpointsHeader(header.value!);
          break;
        case 'report-to':
          hasReportTo = true;
          header.value = modifyReportToHeader(header.value!);
          break;
        case 'nel':
          hasNEL = true;
          header.value = NEL_HEADER_VALUE;
          break;
        default:
          break;
      }
    }

    if (!hasReportingEndpoints) {
      responseHeaders.push({
        name: 'reporting-endpoints',
        value: `default="${process.env.API_ENDPOINT!}/report"`,
      });
    }

    if (!hasReportTo) {
      responseHeaders.push({
        name: 'report-to',
        value: `${process.env.API_ENDPOINT!}/report`,
      });
    }

    if (!hasNEL) {
      responseHeaders.push({
        name: 'nel',
        value: NEL_HEADER_VALUE,
      });
    }

    return { responseHeaders };
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
