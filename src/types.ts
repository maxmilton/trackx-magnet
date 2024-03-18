import type { EventMeta } from 'trackx/types';

export interface CaptureData {
  /** Identifies this as our extension's event. */
  // biome-ignore lint/style/useNamingConvention: less likely to collide with other extensions
  x_x: boolean;
  $$type: number;
  $$error: unknown;
  $$extra?: EventMeta | undefined;
}
