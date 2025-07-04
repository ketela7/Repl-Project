# ESLint Rules Directory

This directory has been cleaned up. Custom ESLint rules have been removed in favor of using standard ESLint configurations.

The project now uses:
- Standard ESLint rules from `eslint.config.mjs`
- Strict configuration from `.eslintrc.strict.js`
- Built-in TypeScript and React rules

For linting, use the standard npm scripts:
```bash
npm run lint
npm run lint:fix