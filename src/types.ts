/* eslint-disable @typescript-eslint/no-namespace */

import type { EventMeta } from 'trackx/types';

declare global {
  // biome-ignore lint/style/noNamespace: inject process.env vars
  namespace NodeJS {
    // Add environment variables defined in build.ts
    interface ProcessEnv {
      // biome-ignore lint/style/useNamingConvention: global env var constant
      API_ENDPOINT: string;
      // biome-ignore lint/style/useNamingConvention: global env var constant
      API_ORIGIN: string;
      // biome-ignore lint/style/useNamingConvention: global env var constant
      APP_RELEASE: string;
      // biome-ignore lint/style/useNamingConvention: global env var constant
      BLOCKLIST_REGEX_STR: string;
    }
  }
}

export interface CaptureData {
  /** Identifies this as our extension's event. */
  // biome-ignore lint/style/useNamingConvention: less likely to collide with other extensions
  x_x: boolean;
  $$type: number;
  $$error: unknown;
  $$extra?: EventMeta | undefined;
}
