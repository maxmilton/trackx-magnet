import type * as TrackX from 'trackx';

declare global {
  // added using inject script element technique + process.env.TRACKX_CLIENT_JS
  var __trackx: typeof TrackX; // eslint-disable-line
}

const init = () => {
  __trackx.setup('https://api.trackx.app/v1/pxdfcbscygy/event');
  __trackx.meta._agent = 'harvest-errors';
  __trackx.meta._ctx = 'content';
  __trackx.meta._release = process.env.APP_RELEASE;
  __trackx.meta.top_url = window.top.location.href;

  if (process.env.NODE_ENV !== 'production') {
    __trackx.meta.NODE_ENV = process.env.NODE_ENV || 'NULL';
  }
};

const script = document.createElement('script');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
script.textContent = `${process.env.TRACKX_CLIENT_JS!};(${init.toString()})()`;
(document.head || document.documentElement).appendChild(script);
script.remove();
