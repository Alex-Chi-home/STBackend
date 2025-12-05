import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  // Базовые рекомендации ESLint
  eslint.configs.recommended,

  // Игнорируемые файлы
  {
    ignores: ["dist/**", "node_modules/**", "*.js", "*.mjs"],
  },

  // Конфигурация для TypeScript файлов
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: {
        // Node.js globals
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      prettier: prettier,
    },
    rules: {
      // TypeScript правила
      ...tseslint.configs.recommended.rules,

      // Отключаем конфликтующие правила (Prettier управляет форматированием)
      ...eslintConfigPrettier.rules,

      // Prettier как ESLint правило
      "prettier/prettier": "error",

      // TypeScript специфичные правила
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Общие правила
      "no-console": "error", // Запрещаем console.log
      "no-unused-vars": "off", // Используем @typescript-eslint/no-unused-vars
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
    },
  },
];
