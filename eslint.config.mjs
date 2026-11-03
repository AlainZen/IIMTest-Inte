// @ts-check
import prettierConfig from 'eslint-config-prettier'
import withNuxt from './.nuxt/eslint.config.mjs'

// Prettier s'occupe de la mise en forme, ESLint de la qualité du code.
export default withNuxt(
  prettierConfig,
  { rules: { 'no-console': 'error', 'no-debugger': 'error' } },
  // Les scripts lancés à la main ont le droit d'écrire dans la console.
  { files: ['scripts/**'], rules: { 'no-console': 'off' } },
)
