// https://developer.chrome.com/docs/extensions/mv2/manifest/
// https://developer.chrome.com/docs/extensions/reference/

import pkg from './package.json' assert { type: 'json' };

function gitRef() {
  return Bun.spawnSync([
    'git',
    'describe',
    '--always',
    '--dirty=-dev',
    '--broken',
  ])
    .stdout.toString()
    .trim()
    .replace(/^v/, '');
}

interface CreateManifestOptions {
  API_ENDPOINT: string;
  API_ORIGIN: string;
}

export const createManifest = (
  { API_ENDPOINT, API_ORIGIN }: CreateManifestOptions,
  debug = !process.env.CI,
): chrome.runtime.ManifestV3 => ({
  manifest_version: 3,
  name: 'TrackX Magnet',
  description: pkg.description,
  homepage_url: pkg.homepage,
  version: pkg.version.split('-')[0],
  // shippable releases should not have a named version
  version_name: debug ? gitRef() : undefined,
  icons: {
    16: 'icon16.png',
    48: 'icon48.png',
    128: 'icon128.png',
  },
  permissions: [
    'storage', // https://developer.chrome.com/docs/extensions/reference/storage/
  ],
  host_permissions: ['*://*/*'],
  content_scripts: [
    {
      all_frames: true,
      matches: ['<all_urls>'],
      run_at: 'document_start',
      js: ['service.js'],
    },
    // FIXME: Not supported in Firefox
    {
      // https://developer.chrome.com/docs/extensions/reference/scripting/#type-ExecutionWorld
      world: 'MAIN',
      all_frames: true,
      matches: ['<all_urls>'],
      run_at: 'document_start',
      js: ['magnet.js'],
    },
  ],
  incognito: 'not_allowed', // give users some privacy
  // FIXME: Is this actually used anywhere now? Remove?
  content_security_policy: {
    extension_pages: [
      "default-src 'none'",
      "script-src 'self'",
      `connect-src ${API_ORIGIN}`,
      `report-uri ${API_ENDPOINT}/report`,
      '',
    ].join(';'),
  },
  // https://chrome.google.com/webstore/detail/trackx-magnet/nmdlenjlhfgjbmljgopgmigoljgmnpae
  key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr1dkiK1jFYwT+kh89LJlQ+0Bo5CYWS6+Ix+GgGKhBx9tVJ9WpDU2yaU1HA362z/hOvQOrj6I45nP652Dji8IiLhqKyirzpR1CSBOnLK0Z47yJAN08dM+p+kL1NuwYtZl4ycwtqclK5YYBaF/y8tAEJ//rxWqXo3E/hOhi+IqgnA3GydNnn0tMDG2ZdBgcp77P8k3OZJwseQ9TxLfe788MB8LR9E5Zlwl8mLyyEA8dr8HkRS2AaLlebgI/FKSbi6aDvp0K0L7xUJtbq8QwfS0Pvu2rBXhOeY8HmLaW9/Ya50tRI9CAq1/oRI6pbGh6N9EbMjeXlttjsbnKXYs2a+4WQIDAQAB',
});
