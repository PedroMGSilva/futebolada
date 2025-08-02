import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // Ignore common folders
  globalIgnores([".react-router/", ".idea/", "build/"]),

  // Base ESLint recommended
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
  },

  // Node.js globals for backend/server files
  {
    files: ["server.js", "app/.server/**/*.{js,ts}"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Browser globals for frontend files (e.g., React)
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: { globals: globals.browser },
  },

  // TypeScript config
  tseslint.configs.recommended,

  // React JSX runtime
  pluginReact.configs.flat["jsx-runtime"],

  // Disable conflicting Prettier rules
  eslintConfigPrettier,
]);
