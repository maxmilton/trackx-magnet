/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */

// https://developer.chrome.com/docs/extensions/mv3/manifest/
// https://developer.chrome.com/docs/extensions/mv2/manifest/
// https://developer.chrome.com/docs/extensions/reference/
// https://developer.chrome.com/docs/extensions/mv3/devguide/

const { gitRef } = require('git-ref');
const pkg = require('./package.json');

/** @type {chrome.runtime.Manifest} */
const manifest = {
  manifest_version: 3,
  name: 'harvest-errors',
  description: 'Collect errors from web pages with the trackx client',
  version: pkg.version,
  version_name: gitRef(),
  icons: {
    16: 'icon16.png',
    48: 'icon48.png',
    128: 'icon128.png',
  },
  host_permissions: ['*://*/*'],
  content_scripts: [
    {
      matches: ['*://*/*'],
      js: ['index.js'],
    },
  ],
  incognito: 'spanning',
  // @ts-expect-error - new format in manifest v3
  content_security_policy: {
    extension_pages:
      "default-src 'self';"
      + "connect-src 'self' https://api.trackx.app;"
      // FIXME: CSP exception reports not sent, is it supported in extensions?
      + 'report-uri https://api.trackx.app/v1/pxdfcbscygy/report;',
  },
};

module.exports = manifest;
