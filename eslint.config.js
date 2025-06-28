// Minimal ESLint config for Replit performance
const { FlatCompat } = require('@eslint/eslintrc')
const compat = new FlatCompat({
  baseDirectory: __dirname,
})

module.exports = [
  ...compat.extends('next/core-web-vitals'),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
]