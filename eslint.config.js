// eslint.config.js
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import globals from 'globals'

export default [
  {
    // This replaces --ignore-path .gitignore
    ignores: ['**/dev-dist/**','**/dist/**', '**/node_modules/**', '**/public/**'],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  skipFormatting,
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    rules: {
      // Your custom rules here
    }
  },
  {
    // One-off admin scripts run under Node (not the Vite/browser app) — see
    // scripts/migrate-user-admin-flags.md.
    files: ['scripts/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node
    }
  }
]