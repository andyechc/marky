module.exports = {
  root: true,
  env: { browser: true, es2022: true },

  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],

  ignorePatterns: ['dist', 'node_modules', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],

  rules: {
    // This is a plain-JSX codebase, not TypeScript, so prop-types annotations
    // would be pure noise. Types live in JSDoc where useful.
    'react/prop-types': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },

  overrides: [
    {
      // Providers and hook modules necessarily export both a component and the
      // hook that reads it, which is exactly what this rule warns about. It only
      // matters for fast refresh of component-only files.
      files: ['src/context/**/*.jsx', 'src/hooks/**/*.js'],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
  ],

  overrides: [
    {
      // Config files run in Node, not the browser.
      files: ['*.config.js', '*.config.cjs', '.eslintrc.cjs'],
      env: { node: true, browser: false },
    },
    {
      files: ['scripts/**/*.mjs'],
      env: { node: true, browser: false },
      rules: { 'no-console': 'off' },
    },
  ],
}