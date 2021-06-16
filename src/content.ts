import type * as TrackX from 'trackx';

declare global {
  // added using inject script element technique + process.env.TRACKX_CLIENT_JS
  var trackx: typeof TrackX; // eslint-disable-line no-var, vars-on-top
}

function init() {
  trackx.setup('https://api.trackx.app/v1/pxdfcbscygy/event');
  trackx.addMeta('release', process.env.APP_RELEASE);
  trackx.addMeta('agent', 'harvest-errors');
  trackx.addMeta('top_url', window.top.location.href);

  if (process.env.NODE_ENV !== 'production') {
    trackx.addMeta('NODE_ENV', process.env.NODE_ENV);
  }
}

const script = document.createElement('script');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
script.textContent = `${process.env.TRACKX_CLIENT_JS!};(${init.toString()}())`;
(document.head || document.documentElement).appendChild(script);
script.remove();
