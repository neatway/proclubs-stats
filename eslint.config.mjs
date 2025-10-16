import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Disable the img element warning - we'll use img for external CDN images with fallbacks
      "@next/next/no-img-element": "off",
      // Allow any types during development - will be replaced with Zod validation
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
