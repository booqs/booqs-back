module.exports = {
  env: {
    browser: true,
    es6: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    "prefer-const": "off",
    "@typescript-eslint/member-delimiter-style": ["error", {
      "multiline": {
        "delimiter": "comma",
        "requireLast": true
      },
      "singleline": {
        "delimiter": "comma",
        "requireLast": false
      },
    }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-unused-vars": ["error", {
      "args": "none",
      "ignoreRestSiblings": true,
      "varsIgnorePattern": "^_+$"
    }],
    "no-unused-vars": "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "no-inner-declarations": "off",
    "space-before-function-paren": "off",
    "indent": "off",
    "semi": ["error", "never"],
    "quotes": ["error", "single"],
    "generator-star-spacing": ["error", "after"],
    "comma-dangle": ["error", "always-multiline"],
    "no-unneeded-ternary": "off",
  },
}
