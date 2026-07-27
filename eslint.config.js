import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    name: 'randsa/ignores',
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '.firebase/**',
      'functions/lib/**',
      'build/**',
      '.chrome-*/**',
      '*.min.js',
    ],
  },
  {
    name: 'randsa/language-options',
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    name: 'randsa/vue-typescript',
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  {
    name: 'randsa/practical-project-rules',
    files: ['src/**/*.{ts,vue}', 'vite.config.ts'],
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-useless-assignment': 'warn',
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'vue/require-default-prop': 'off',
    },
  },
  {
    name: 'randsa/firebase-functions',
    files: ['functions/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    name: 'randsa/service-worker',
    files: ['public/firebase-messaging-sw.js'],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
  eslintConfigPrettier
)
