/* eslint-disable import/no-extraneous-dependencies */

// https://developer.chrome.com/docs/extensions/mv2/manifest/
// https://developer.chrome.com/docs/extensions/reference/

import { gitRef } from 'git-ref';
import pkg from './package.json' assert { type: 'json' };
import blocklist from './src/blocklist.json' assert { type: 'json' };

/**
 * @param {object} opts
 * @param {string} opts.API_ENDPOINT
 * @param {string} opts.API_ORIGIN
 * @returns {chrome.runtime.Manifest}
 */
export const createManifest = (opts) => ({
  manifest_version: 2, // v3 restricts injecting inline scripts and webRequestBlocking so we need v2
  name: 'TrackX Magnet',
  description: 'Collect error samples from web pages using the trackx client.',
  version: pkg.version,
  version_name: process.env.GITHUB_REF ? undefined : gitRef().replace(/^v/, ''),
  icons: {
    16: 'icon16.png',
    48: 'icon48.png',
    128: 'icon128.png',
  },
  // permissions: ['<all_urls>', 'tabs', 'webRequest', 'webRequestBlocking'],
  permissions: ['<all_urls>', 'webRequest', 'webRequestBlocking'],
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
  // web_accessible_resources: ['trackx.js'],
  incognito: 'not_allowed', // give users some privacy
  content_security_policy: [
    "default-src 'none'",
    "script-src 'self'",
    `connect-src ${opts.API_ORIGIN}`,
    `report-uri ${opts.API_ENDPOINT}/report`,
    '',
  ].join(';'),

  // https://chrome.google.com/webstore/detail/trackx-magnet/nmdlenjlhfgjbmljgopgmigoljgmnpae
  key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr1dkiK1jFYwT+kh89LJlQ+0Bo5CYWS6+Ix+GgGKhBx9tVJ9WpDU2yaU1HA362z/hOvQOrj6I45nP652Dji8IiLhqKyirzpR1CSBOnLK0Z47yJAN08dM+p+kL1NuwYtZl4ycwtqclK5YYBaF/y8tAEJ//rxWqXo3E/hOhi+IqgnA3GydNnn0tMDG2ZdBgcp77P8k3OZJwseQ9TxLfe788MB8LR9E5Zlwl8mLyyEA8dr8HkRS2AaLlebgI/FKSbi6aDvp0K0L7xUJtbq8QwfS0Pvu2rBXhOeY8HmLaW9/Ya50tRI9CAq1/oRI6pbGh6N9EbMjeXlttjsbnKXYs2a+4WQIDAQAB',
});
