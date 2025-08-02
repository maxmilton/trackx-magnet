import "@maxmilton/test-utils/extend";

import { setupDOM } from "@maxmilton/test-utils/dom";

const noop = () => {};

function setupMocks(): void {
  // @ts-expect-error - noop stub
  global.performance.mark = noop;
  // @ts-expect-error - noop stub
  global.performance.measure = noop;

  global.chrome = {
    storage: {
      // @ts-expect-error - partial mock
      local: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve(),
      },
    },
  };
}

export function reset(): void {
  setupDOM({
    url: "chrome-extension://nmdlenjlhfgjbmljgopgmigoljgmnpae/",
  });
  setupMocks();
}

reset();
