[![ci](https://github.com/maxmilton/harvest-errors/actions/workflows/ci.yml/badge.svg)](https://github.com/maxmilton/harvest-errors/actions/workflows/ci.yml)

# harvest-errors ![](./static/icon48.png)

Browser extension which injects the [trackx client](https://github.com/maxmilton/trackx/tree/master/packages/client) into all web pages and collects errors. Useful to collect error samples for TrackX development.

Event reports are sent automatically and can be viewed at <https://dash.trackx.app/projects/harvest-errors>.

## How to install

Verified testers can install directly from the Chrome Web Store:

[![Add to Chrome](https://storage.googleapis.com/chrome-gcs-uploader.appspot.com/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/mPGKYBIR2uCP0ApchDXE.png)](https://chrome.google.com/webstore/detail/harvest-errors/nmdlenjlhfgjbmljgopgmigoljgmnpae)

### Manual local install

1. Download the latest release's `.zip` file from <https://github.com/maxmilton/harvest-errors/releases>
1. Open <chrome://extensions>
1. Enable developer mode
1. Depending on your OS:
   1. Windows/macOS: Drag .zip file into the page
   1. Linux: Unzip then click "load unpacked" button and select the directory

## Browser support

Up-to-date versions of Google Chrome and other Chromium based browsers (e.g. Brave, Edge).

## Bugs

Please report any bugs you encounter on the [GitHub issue tracker](https://github.com/maxmilton/harvest-errors/issues).

## References

- <https://github.com/barbushin/javascript-errors-notifier>

## TODO

- Create a basic settings UI + add storage permission
- Add setting to customise the API endpoint e.g., for local development
  - May be tricky to get settings data in content scripts because we need the script to init `trackx` ASAP to collect page load errors, however, the `chrome.storage` API is async

## License

Private; closed source. For internal use only.

The extension's [magnet icon](https://github.com/twitter/twemoji/blob/master/assets/svg/1f9f2.svg) is from [twitter/twemoji](https://github.com/twitter/twemoji) which is licensed CC-BY 4.0.

---

© 2021 [Max Milton](https://maxmilton.com)
