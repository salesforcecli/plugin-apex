/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
module.exports = {
  extends: ['eslint-config-salesforce-typescript', 'eslint-config-salesforce-license'],
  rules: {
    '@typescript-eslint/member-ordering': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/restrict-template-expressions': 'warn',
    '@typescript-eslint/no-misused-promises': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/ban-types': 'warn',
    'class-methods-use-this': 'warn',
    'no-prototype-builtins': 'warn',
    'no-case-declarations': 'warn',
    radix: 'warn',
    '@typescript-eslint/switch-exhaustiveness-check': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
  },
};
