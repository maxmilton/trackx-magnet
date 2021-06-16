import { addMeta, setup } from 'trackx';

setup('https://api.trackx.app/v1/pxdfcbscygy/event');
addMeta('release', process.env.APP_RELEASE);
addMeta('agent', 'harvest-errors');

if (process.env.NODE_ENV !== 'production') {
  addMeta('NODE_ENV', process.env.NODE_ENV);
}
