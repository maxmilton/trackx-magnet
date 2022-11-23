import blocklist from './blocklist.json';

const REPORT_TO_HEADER_VALUE = `{"max_age":1440,"endpoints":[{"url":"${process
  .env.API_ENDPOINT!}/report"}]}`;
const NEL_HEADER_VALUE = '{"max_age":1440,"report_to":"default"}';

const reBlockList = new RegExp(blocklist.join('|'), 'i');

function modifyCSPHeader(header: string): string {
  let newHeader = header;
  const connectSrcIndex = newHeader.indexOf('connect-src');
  const defaultSrcIndex = newHeader.indexOf('default-src');

  if (connectSrcIndex !== -1) {
    // add to existing connect-src directive
    const nextSemiIndex = newHeader.indexOf(';', connectSrcIndex);
    newHeader = `${newHeader.slice(
      0,
      nextSemiIndex === -1 ? undefined : nextSemiIndex,
    )} ${process.env.API_ORIGIN!}${
      nextSemiIndex === -1 ? '' : newHeader.slice(nextSemiIndex)
    }`;
  } else if (defaultSrcIndex !== -1) {
    // add to existing default-src directive
    const nextSemiIndex = newHeader.indexOf(';', defaultSrcIndex);
    newHeader = `${newHeader.slice(
      0,
      nextSemiIndex === -1 ? undefined : nextSemiIndex,
    )} ${process.env.API_ORIGIN!}${
      nextSemiIndex === -1 ? '' : newHeader.slice(nextSemiIndex)
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

  if (defaultIndex === -1) {
    // add new default endpoint
    newHeader += `, default="${process.env.API_ENDPOINT!}/report"`;
  } else {
    const nextCommaIndex = newHeader.indexOf(',', defaultIndex);

    // replace existing default endpoint
    newHeader = `${newHeader.slice(0, defaultIndex)}default="${process.env
      .API_ENDPOINT!}/report"${
      nextCommaIndex === -1 ? '' : newHeader.slice(nextCommaIndex)
    }`;
  }

  return newHeader;
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
          header.value = REPORT_TO_HEADER_VALUE;
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
        value: REPORT_TO_HEADER_VALUE,
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
