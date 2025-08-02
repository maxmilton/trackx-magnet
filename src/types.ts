/* eslint-disable @typescript-eslint/no-namespace */

import type { EventMeta } from "trackx/types";

declare global {
  namespace NodeJS {
    // Environment variables defined in build.ts
    interface ProcessEnv {
      API_ENDPOINT: string;
      API_ORIGIN: string;
      APP_RELEASE: string;
      BLOCKLIST_REGEX_STR: string;
    }
  }
}

export interface CaptureData {
  /** Identifies this as our extension's event. */
  x_x: boolean;
  $$type: number;
  $$error: unknown;
  $$extra?: EventMeta | undefined;
}

// Same as https://github.com/maxmilton/trackx/blob/master/packages/trackx/src/modern.ts#L27-L30
export const enum EventType {
  UNHANDLED_ERROR = 1,
  UNHANDLED_REJECTION = 2,
  CONSOLE_ERROR = 3,
}
