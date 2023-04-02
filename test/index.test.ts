import { test } from 'uvu';
import * as assert from 'uvu/assert';

test('placeholder', () => {
  assert.is(1 + 2, 3);
});

test.run();

// <iframe srcdoc="<!DOCTYPE html><script>console.log(globalThis.frameElement?.nodeName)</script>"></iframe>
