/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Messages } from '@salesforce/core';
import { arrayWithDeprecation, Flags } from '@salesforce/sf-plugins-core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'flags');

export const resultFormatFlag = Flags.string({
  deprecateAliases: true,
  aliases: ['resultformat'],
  char: 'r',
  summary: messages.getMessage('flags.result-format.summary'),
  options: ['human', 'tap', 'junit', 'json'] as const,
  default: 'human',
});

export const codeCoverageFlag = Flags.boolean({
  aliases: ['codecoverage'],
  deprecateAliases: true,
  char: 'c',
  summary: messages.getMessage('flags.code-coverage.summary'),
});

export const testCategoryFlag = arrayWithDeprecation({
  char: 'g',
  summary: messages.getMessage('flags.test-category.summary'),
  description: messages.getMessage('flags.test-category.description'),
  options: ['Agent', 'Apex', 'Flow'],
});
