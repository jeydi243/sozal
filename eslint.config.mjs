// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'vue/first-attribute-linebreak': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/html-closing-bracket-newline': 'off',
    '@stylistic/indent': 'off',
    'vue/html-indent': 'off',
    '@stylistic/member-delimiter-style': 'off',
    '@stylistic/quotes': 'off',
    '@stylistic/semi': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@stylistic/keyword-spacing': 'off',
    'prefer-const': 'off',
    'vue/html-quotes': 'off',
    '@stylistic/comma-dangle': 'off',
    'vue/block-tag-newline': 'off',
    '@stylistic/eol-last': 'off',
    '@stylistic/no-multiple-empty-lines': 'off',
    'vue/padding-line-between-blocks': 'off',
    '@stylistic/arrow-parens': 'off',
    '@stylistic/no-trailing-spaces': 'off',
    'vue/operator-linebreak': 'off',
    'vue/html-self-closing': 'off',
    'vue/html-closing-bracket-spacing': 'off',
    '@stylistic/space-before-blocks': 'off',
    'vue/comma-dangle': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/require-explicit-emits': 'off'
  }
})
