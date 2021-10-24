/* eslint-disable @typescript-eslint/no-var-requires, import/no-extraneous-dependencies */

// https://developer.chrome.com/docs/extensions/mv2/manifest/
// https://developer.chrome.com/docs/extensions/reference/

const { gitRef } = require('git-ref');
const blocklist = require('./src/blocklist.json');
const pkg = require('./package.json');

/** @type {chrome.runtime.Manifest} */
const manifest = {
  manifest_version: 2, // v3 restricts injecting JS so we need v2
  name: 'TrackX Magnet',
  description: 'Collect error samples from web pages using the trackx client.',
  version: pkg.version,
  version_name: process.env.GITHUB_REF
    ? process.env.GITHUB_REF.replace('refs/tags/v', '')
    : gitRef().replace(/^v/, ''),
  icons: {
    16: 'icon16.png',
    48: 'icon48.png',
    128: 'icon128.png',
  },
  permissions: ['<all_urls>', 'tabs', 'webRequest', 'webRequestBlocking'],
  background: {
    scripts: ['background.js'],
    // persistence required to use the chrome.webRequest API
    persistent: true,
  },
  content_scripts: [
    {
      all_frames: true,
      exclude_globs: blocklist.map((word) => `*${word}*`),
      js: ['content.js'],
      matches: ['<all_urls>'],
      run_at: 'document_start',
    },
  ],
  incognito: 'not_allowed', // give users some privacy
  offline_enabled: true,
  content_security_policy:
    "default-src 'self' https://api.trackx.app;"
    + 'report-uri https://api.trackx.app/v1/pxdfcbscygy/report;',

  // https://chrome.google.com/webstore/detail/trackx-magnet/nmdlenjlhfgjbmljgopgmigoljgmnpae
  key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr1dkiK1jFYwT+kh89LJlQ+0Bo5CYWS6+Ix+GgGKhBx9tVJ9WpDU2yaU1HA362z/hOvQOrj6I45nP652Dji8IiLhqKyirzpR1CSBOnLK0Z47yJAN08dM+p+kL1NuwYtZl4ycwtqclK5YYBaF/y8tAEJ//rxWqXo3E/hOhi+IqgnA3GydNnn0tMDG2ZdBgcp77P8k3OZJwseQ9TxLfe788MB8LR9E5Zlwl8mLyyEA8dr8HkRS2AaLlebgI/FKSbi6aDvp0K0L7xUJtbq8QwfS0Pvu2rBXhOeY8HmLaW9/Ya50tRI9CAq1/oRI6pbGh6N9EbMjeXlttjsbnKXYs2a+4WQIDAQAB',
};

module.exports = manifest;
