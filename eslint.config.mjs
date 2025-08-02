import js from "@eslint/js";
import mm from "@maxmilton/eslint-config";
import unicorn from "eslint-plugin-unicorn";
import ts from "typescript-eslint";

const OFF = 0;
const ERROR = 2;

export default ts.config(
  js.configs.recommended,
  ts.configs.strictTypeChecked,
  ts.configs.stylisticTypeChecked,
  unicorn.configs.recommended,
  mm.configs.recommended,
  {
    linterOptions: {
      reportUnusedDisableDirectives: ERROR,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      quotes: [ERROR, "double", { avoidEscape: true }],

      // prefer to clearly separate Bun and DOM
      "unicorn/prefer-global-this": OFF,

      /* Performance and byte savings */
      // byte savings
      "no-plusplus": OFF,
      // forEach is often faster (in Chrome and Bun but not Firefox)
      "unicorn/no-array-for-each": OFF,
      // bad browser support and slower
      "unicorn/prefer-string-replace-all": OFF,
      // byte savings (minification doesn't currently automatically remove)
      "unicorn/switch-case-braces": [ERROR, "avoid"],
    },
  },
  { ignores: ["**/*.bak", "coverage/**", "dist/**"] },
);
