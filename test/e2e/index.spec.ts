import { expect, test } from "./fixtures.ts";

test("has extension ID", ({ extensionId }) => {
  expect(extensionId).toBeTruthy();
  expect(extensionId).toMatch(/^[a-z]{32}$/);
});
