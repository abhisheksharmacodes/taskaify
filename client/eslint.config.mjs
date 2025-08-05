// eslint.config.js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 1. Add a separate configuration object at the beginning for global ignores
  {
    ignores: [
      'node_modules/',
      'dist/',
      'public/',
      'src/', // This will now correctly ignore your src/ directory
      // Add any other specific files or folders you want to ignore here
      // e.g., 'next-env.d.ts', '.*next/*' etc.
    ],
  },
  // 2. Spread your compatibility configurations after the ignores
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }),
  // If you have any other custom configurations, they would go here
];

export default eslintConfig;
