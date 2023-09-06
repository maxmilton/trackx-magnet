import type { EventMeta } from 'trackx/types';

export interface CaptureData {
  /** Identifies this as our extension's event. */
  x_x: 0;
  $$type: number;
  $$error: unknown;
  $$extra?: EventMeta | undefined;
}
