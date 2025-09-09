/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
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

export default class Test extends SfCommand<RunResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly deprecateAliases = true;
  public static readonly aliases = ['force:logic:test:report'];


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
    })
  };

  public async run(): Promise<RunResult> {
    const { flags } = await this.parse(Test);

    // Use shared business logic
    return TestGetBase.execute({
      connection: flags['target-org'].getConnection(flags['api-version']),
      testRunId: flags['test-run-id'],
      codeCoverage: flags['code-coverage'],
      outputDir: flags['output-dir'],
      resultFormat: flags['result-format'],
      json: flags.json,
      detailedCoverage: flags['detailed-coverage'],
      concise: flags.concise,
      jsonEnabled: this.jsonEnabled(),
      isUnifiedLogic: true
    });
  }
}
