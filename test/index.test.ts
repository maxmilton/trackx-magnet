import { test } from 'uvu';
import * as assert from 'uvu/assert';

test('placeholder', () => {
  assert.is(1 + 2, 3);
});

test.run();

// eslint-disable-next-line max-len
// <iframe srcdoc="<!DOCTYPE html><script>console.log(window.frameElement.nodeName)</script>"></iframe>
