/* eslint-disable @typescript-eslint/no-var-requires, import/no-extraneous-dependencies */

// https://developer.chrome.com/docs/extensions/mv2/manifest/
// https://developer.chrome.com/docs/extensions/reference/

const { gitRef } = require('git-ref');
const pkg = require('./package.json');

/** @type {chrome.runtime.Manifest} */
const manifest = {
  manifest_version: 2, // v3 restricts injecting JS so we need v2
  name: 'harvest-errors',
  description: 'Collect errors from web pages with the trackx client.',
  version: pkg.version,
  version_name: gitRef(),
  icons: {
    16: 'icon16.png',
    48: 'icon48.png',
    128: 'icon128.png',
  },
  permissions: ['<all_urls>', 'webRequest'],
  background: {
    scripts: ['background.js'],
  },
  content_scripts: [
    {
      all_frames: true,
      js: ['content.js'],
      matches: ['<all_urls>'],
      run_at: 'document_start',
    },
  ],
  incognito: 'spanning',
  offline_enabled: true,
  content_security_policy:
    "default-src 'self';"
    + "connect-src 'self' https://api.trackx.app;"
    // FIXME: CSP exception reports are not sent, not supported in extensions?
    + 'report-uri https://api.trackx.app/v1/pxdfcbscygy/report;',
};

module.exports = manifest;
