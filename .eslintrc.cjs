const OFF = 0;
const WARN = 1;
const ERROR = 2;

/** @type {import('eslint/lib/shared/types').ConfigData & { parserOptions: import('@typescript-eslint/types').ParserOptions }} */
module.exports = {
  root: true,
  reportUnusedDisableDirectives: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
  extends: [
    'eslint:recommended',
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:unicorn/recommended',
  ],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': ERROR,
    '@typescript-eslint/no-confusing-void-expression': WARN,
    '@typescript-eslint/no-non-null-assertion': WARN,
    'import/prefer-default-export': OFF,
    'no-restricted-syntax': OFF,
    'no-void': OFF,
    'unicorn/no-abusive-eslint-disable': WARN,
    'unicorn/no-null': OFF,
    'unicorn/prefer-module': WARN,
    'unicorn/prefer-top-level-await': WARN,
    'unicorn/prevent-abbreviations': OFF,

    /* Covered by biome formatter */
    '@typescript-eslint/indent': OFF,
    'function-paren-newline': OFF,
    'implicit-arrow-linebreak': OFF,
    'max-len': OFF,
    'object-curly-newline': OFF,
    'operator-linebreak': OFF,
    'unicorn/no-nested-ternary': OFF,

    /* Performance and byte savings */
    'no-plusplus': OFF,
    // bad browser support and slower
    'unicorn/prefer-string-replace-all': OFF,
    // byte savings (esbuild minify doesn't currently automatically remove)
    'unicorn/switch-case-braces': [ERROR, 'avoid'],
  },
  overrides: [
    {
      files: ['*.spec.ts', '*.test.ts', 'build.ts', '*.config.ts', '*.d.ts'],
      rules: {
        'import/no-extraneous-dependencies': OFF,
      },
    },
  ],
};
