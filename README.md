[![ci](https://github.com/maxmilton/trackx-magnet/actions/workflows/ci.yml/badge.svg)](https://github.com/maxmilton/trackx-magnet/actions/workflows/ci.yml)

# trackx-magnet ![](./static/icon48.png)

A browser extension to collect error data samples for [TrackX](https://github.com/maxmilton/trackx) development.

View event reports at <https://dash.trackx.app/projects/trackx-magnet>.

### Features

- Inject [trackx client](https://github.com/maxmilton/trackx/tree/master/packages/client) into visited web pages
  - Send error report events on captured errors
  - Send a session ping (to count error-free sessions)
- Modify [CSP headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) to allow connecting to a TrackX API
- Preserve privacy — Don't inject client or send anything when specific data matches our [curated block list](https://github.com/maxmilton/trackx-magnet/blob/master/src/blocklist.json) (phrases related to logins, banking, porn, etc.)

### TODO

- Customisable Track API URL (without needing to recompile the extension)
- User maintained block list + easily add the current URL origin to it

## How to install

Verified testers can install directly from the Chrome Web Store:

[![Add to Chrome](https://storage.googleapis.com/chrome-gcs-uploader.appspot.com/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/mPGKYBIR2uCP0ApchDXE.png)](https://chrome.google.com/webstore/detail/trackx-magnet/nmdlenjlhfgjbmljgopgmigoljgmnpae)

### Manual local install

1. Download the latest release's `chrome-extension.zip` file from <https://github.com/maxmilton/trackx-magnet/releases>
1. Open <chrome://extensions>
1. Enable developer mode
1. Depending on your OS:
   1. Windows/macOS: Drag .zip file into the page
   1. Linux: Unzip then click "load unpacked" button and select the directory

## Browser support

Up-to-date versions of Google Chrome and other Chromium based browsers (e.g. Brave, Edge).

## Bugs

Please report any bugs you encounter on the [GitHub issue tracker](https://github.com/maxmilton/trackx-magnet/issues).

## License

MIT license. See [LICENSE](https://github.com/maxmilton/trackx-magnet/blob/master/LICENSE).

The [magnet icon](https://github.com/twitter/twemoji/blob/master/assets/svg/1f9f2.svg) is from [twitter/twemoji](https://github.com/twitter/twemoji) which is licensed CC-BY 4.0.

---

© 2021 [Max Milton](https://maxmilton.com)
