/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { TestService } from '@salesforce/apex-node';
import {
  Flags,
  loglevel,
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
  SfCommand,
  Ux,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { RunResult, TestReporter } from '../../../reporters/index.js';
import { codeCoverageFlag, resultFormatFlag } from '../../../flags.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'report');
export default class Test extends SfCommand<RunResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly deprecateAliases = true;
  public static readonly aliases = ['force:apex:test:report'];

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
    'output-dir': Flags.directory({
      aliases: ['outputdir', 'output-directory'],
      deprecateAliases: true,
      char: 'd',
      summary: messages.getMessage('flags.output-dir.summary'),
    }),
    'result-format': resultFormatFlag,
  };

  public async run(): Promise<RunResult> {
    const { flags } = await this.parse(Test);

    // add listener for errors
    process.on('uncaughtException', (err) => {
      throw messages.createError('apexLibErr', [err.message]);
    });

    const conn = flags['target-org'].getConnection(flags['api-version']);

    const testService = new TestService(conn);
    const result = await testService.reportAsyncResults(flags['test-run-id'], flags['code-coverage']);

    const testReporter = new TestReporter(new Ux({ jsonEnabled: this.jsonEnabled() }), conn, this.config.bin);

    return testReporter.report(result, {
      'output-dir': flags['output-dir'],
      'result-format': flags['result-format'],
      json: flags.json,
      'code-coverage': flags['code-coverage'],
    });
  }
}
