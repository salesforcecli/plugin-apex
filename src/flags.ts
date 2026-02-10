/*
 * Copyright 2026, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Messages } from '@salesforce/core';
import { Flags } from '@salesforce/sf-plugins-core';

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
