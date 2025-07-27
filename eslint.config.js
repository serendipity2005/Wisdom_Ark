import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';
// +
import react from 'eslint-plugin-react';
import prettier from 'eslint-config-prettier';

export default tseslint.config([
  globalIgnores(['dist']),
  //全局忽略文件
  {
    ignores: [
      'dist/**/*',
      'build/**/*',
      'node_modules/**/*',
      '*.config.js',
      '*.config.ts',
      'coverage/**/*',
      '.next/**/*',
      '.nuxt/**/*',
      'uno.config.ts',
    ],
  },

  // {
  //   files: ['**/*.{ts,tsx}'],
  //   extends: [
  //     js.configs.recommended,
  //     tseslint.configs.recommended,
  //     reactHooks.configs['recommended-latest'],
  //     reactRefresh.configs.vite,
  //   ],
  //   languageOptions: {
  //     ecmaVersion: 2020,
  //     globals: globals.browser,
  //   },
  // },
  //基础js/ts配置
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  // React 专用配置
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    extends: [
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
    ],
    rules: {
      // React Hooks 规则
      ...reactHooks.configs.recommended.rules,

      // React Refresh 规则
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // React 规则优化
      'react/prop-types': 'off', // TypeScript 已提供类型检查
      'react/react-in-jsx-scope': 'off', // React 17+ 不需要
      'react/jsx-uses-react': 'off', // React 17+ 不需要
      'react/jsx-no-target-blank': 'warn',
      'react/jsx-key': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // TypeScript 专用规则
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // '@typescript-eslint/no-unused-vars': [
      //   'error',
      //   {
      //     argsIgnorePattern: '^_',
      //     varsIgnorePattern: '^_',
      //     caughtErrorsIgnorePattern: '^_',
      //   },
      // ], //未使用变量使用_下划线
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
    },
  },
  prettier,
]);
