import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
  // Enforce no-console rule: Use pino instead of console methods
  {
    rules: {
      "no-console": "error",
    },
  },
  // Allow console in test setup files for mocking purposes
  {
    files: ["jest.setup.ts", "jest.setup.js"],
    rules: {
      "no-console": "off",
    },
  },
]);

export default eslintConfig;
