export {};

// Because extension content scripts run in isolated worlds, inject a script tag
// to execute trackx code in the actual page context
//  ↳ https://stackoverflow.com/a/9517879
//  ↳ https://github.com/barbushin/javascript-errors-notifier/blob/7d2fe60f9c44676706eaba6b44ce3e9a0beb949d/content.js#L170-L173

// const script = document.createElement('script');
// script.crossOrigin = '';
// script.src = chrome.runtime.getURL('trackx.js');
// document.documentElement.appendChild(script);
// script.remove();

// TODO: Would be nice to use the script.src technique but it results in the
// script loading late and missing out on very early errors and the 'message'
// event is sent before the listener is registered
const script = document.createElement('script');
script.crossOrigin = '';
script.textContent = process.env.TRACKX_CODE!;
document.documentElement.appendChild(script);
script.remove();

// Content scripts can't use the chrome.tabs APIs so we have to get information
// about the current tab from the background page and then send it to the
// injected trackx script (which can't use chrome.* APIs at all) via postMessage
// because the trackx script and content script are considered cross-origin
chrome.runtime.sendMessage('tab', (tab: chrome.tabs.Tab | undefined) => {
  globalThis.postMessage({ __tab: tab }, globalThis.location.origin);
});
