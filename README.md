[![ci](https://github.com/maxmilton/trackx-harvester/actions/workflows/ci.yml/badge.svg)](https://github.com/maxmilton/trackx-harvester/actions/workflows/ci.yml)

# trackx-harvester ![](./static/icon48.png)

Browser extension to collect error and ping data samples for [TrackX](https://github.com/maxmilton/trackx) development. The extension injects the [trackx client](https://github.com/maxmilton/trackx/tree/master/packages/client) into all web visited pages, except those with a URL or title which match a word in a curated block list (for user privacy).

Event reports can be viewed at <https://dash.trackx.app/projects/trackx-harvester>.

## How to install

Verified testers can install directly from the Chrome Web Store:

[![Add to Chrome](https://storage.googleapis.com/chrome-gcs-uploader.appspot.com/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/mPGKYBIR2uCP0ApchDXE.png)](https://chrome.google.com/webstore/detail/trackx-harvester/nmdlenjlhfgjbmljgopgmigoljgmnpae)

### Manual local install

1. Download the latest release's `chrome-extension.zip` file from <https://github.com/maxmilton/trackx-harvester/releases>
1. Open <chrome://extensions>
1. Enable developer mode
1. Depending on your OS:
   1. Windows/macOS: Drag .zip file into the page
   1. Linux: Unzip then click "load unpacked" button and select the directory

## Browser support

Up-to-date versions of Google Chrome and other Chromium based browsers (e.g. Brave, Edge).

## Bugs

Please report any bugs you encounter on the [GitHub issue tracker](https://github.com/maxmilton/trackx-harvester/issues).

## License

Private; closed source. For internal use only.

The extension's [magnet icon](https://github.com/twitter/twemoji/blob/master/assets/svg/1f9f2.svg) is from [twitter/twemoji](https://github.com/twitter/twemoji) which is licensed CC-BY 4.0.

---

© 2021 [Max Milton](https://maxmilton.com)
