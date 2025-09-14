/*
 * Copyright 2025, Salesforce, Inc.
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

import {
  Flags,
  loglevel,
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
  SfCommand,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { RunResult } from '../../../reporters/index.js';
import { codeCoverageFlag, resultFormatFlag } from '../../../flags.js';
import { TestGetBase } from '../../../shared/TestGetBase.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'logicgettest');

export default class TestLogic extends SfCommand<RunResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
    'test-run-id': Flags.salesforceId({
      deprecateAliases: true,
      aliases: ['testrunid'],
      char: 'i',
      summary: messages.getMessage('flags.test-run-id.summary'),
      required: true,
      startsWith: '707',
      length: 'both',
    }),
    'code-coverage': codeCoverageFlag,
    'detailed-coverage': Flags.boolean({
      summary: messages.getMessage('flags.detailed-coverage.summary'),
      dependsOn: ['code-coverage'],
    }),
    'output-dir': Flags.directory({
      aliases: ['outputdir', 'output-directory'],
      deprecateAliases: true,
      char: 'd',
      summary: messages.getMessage('flags.output-dir.summary'),
    }),
    'result-format': resultFormatFlag,
    concise: Flags.boolean({
      summary: messages.getMessage('flags.concise.summary'),
    }),
  };

  public async run(): Promise<RunResult> {
    const { flags } = await this.parse(TestLogic);

    return TestGetBase.execute({
      connection: flags['target-org'].getConnection(flags['api-version']),
      testRunId: flags['test-run-id'],
      codeCoverage: flags['code-coverage'],
      outputDir: flags['output-dir'],
      resultFormat: flags['result-format'],
      json: flags.json,
      detailedCoverage: false,
      concise: flags.concise,
      jsonEnabled: this.jsonEnabled(),
      isUnifiedLogic: true,
    });
  }
}
