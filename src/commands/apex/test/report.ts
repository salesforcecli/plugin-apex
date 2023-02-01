/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
  ApexTestRunResultStatus,
  HumanReporter,
  JUnitReporter,
  ResultFormat,
  TapReporter,
  TestResult,
  TestService,
} from '@salesforce/apex-node';
import {
  Flags,
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
  SfCommand,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { buildOutputDirConfig, RunResult, JsonReporter } from '../../../reporters';
import { buildDescription, FAILURE_EXIT_CODE, resultFormat } from '../../../utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.load('@salesforce/plugin-apex', 'report', [
  'apexLibErr',
  'apexTestReportFormatHint',
  'codeCoverageDescription',
  'commandDescription',
  'jsonDescription',
  'logLevelDescription',
  'logLevelLongDescription',
  'longDescription',
  'outputDirectoryDescription',
  'outputDirHint',
  'resultFormatLongDescription',
  'testResultProcessErr',
  'testRunIdDescription',
  'verboseDescription',
  'waitDescription',
]);
export default class Report extends SfCommand<RunResult> {
  public static readonly summary = buildDescription(
    messages.getMessage('commandDescription'),
    messages.getMessage('longDescription')
  );
  public static readonly description = buildDescription(
    messages.getMessage('commandDescription'),
    messages.getMessage('longDescription')
  );
  public static longDescription = messages.getMessage('longDescription');
  public static readonly examples = [
    '$ sfdx apex:test:report -i <test run id>',
    '$ sfdx apex:test:report -i <test run id> -r junit',
    '$ sfdx apex:test:report -i <test run id> -c --json',
    '$ sfdx apex:test:report -i <test run id> -c -d <path to outputdir> -u me@myorg',
  ];
  public static readonly deprecateAliases = true;
  public static readonly aliases = ['force:apex:test:report'];

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    'test-run-id': Flags.salesforceId({
      deprecateAliases: true,
      aliases: ['testrunid'],
      char: 'i',
      summary: messages.getMessage('testRunIdDescription'),
      required: true,
      startsWith: '707',
      length: 'both',
    }),
    'code-coverage': Flags.boolean({
      aliases: ['codecoverage'],
      deprecateAliases: true,
      char: 'c',
      summary: messages.getMessage('codeCoverageDescription'),
    }),
    'output-dir': Flags.string({
      aliases: ['outputdir', 'output-directory'],
      deprecateAliases: true,
      char: 'd',
      summary: messages.getMessage('outputDirectoryDescription'),
    }),
    'result-format': Flags.enum({
      deprecateAliases: true,
      aliases: ['resultformat'],
      char: 'r',
      summary: messages.getMessage('resultFormatLongDescription'),
      options: resultFormat,
    }),
  };

  public async run(): Promise<RunResult> {
    const { flags } = await this.parse(Report);

    // add listener for errors
    process.on('uncaughtException', (err) => {
      throw messages.createError('apexLibErr', [err.message]);
    });

    // org is guaranteed by requiresUsername field
    const conn = flags['target-org'].getConnection(flags['api-version']);

    const testService = new TestService(conn);
    const result = await testService.reportAsyncResults(flags['test-run-id'], flags['code-coverage']);
    const jsonOutput = this.formatResultInJson(result);

    if (flags['output-dir']) {
      const outputDirConfig = buildOutputDirConfig(
        result,
        jsonOutput,
        flags['output-dir'],
        flags['result-format'] as ResultFormat,
        true
      );

      await testService.writeResultFiles(result, outputDirConfig, flags['code-coverage']);
    }

    try {
      if (result.summary.outcome === ApexTestRunResultStatus.Failed) {
        process.exitCode = FAILURE_EXIT_CODE;
      }
      switch (flags['result-format']) {
        case 'tap':
          this.logTap(result, flags['target-org'].getUsername() as string);
          break;
        case 'junit':
          this.logJUnit(result);
          break;
        case 'json':
          // when --json flag is specified, we should log CLI json format
          if (!flags.json) {
            this.styledJSON({
              status: process.exitCode,
              result: jsonOutput,
            } as AnyJson);
          }
          break;
        default:
          this.logHuman(result, true, flags['output-dir']);
      }
    } catch (e) {
      this.styledJSON(jsonOutput as AnyJson);
      const msg = messages.getMessage('testResultProcessErr', [(e as Error).message]);
      this.error(msg);
    }
    process.exitCode ??= 0;
    return jsonOutput;
  }

  private logHuman(result: TestResult, detailedCoverage: boolean, outputDir?: string): void {
    if (outputDir) {
      this.log(messages.getMessage('outputDirHint', [outputDir]));
    }
    const humanReporter = new HumanReporter();
    const output = humanReporter.format(result, detailedCoverage);
    this.log(output);
  }

  private logTap(result: TestResult, username: string): void {
    const reporter = new TapReporter();
    const hint = this.formatReportHint(result, username);
    this.log(reporter.format(result, [hint]));
  }

  private logJUnit(result: TestResult): void {
    const reporter = new JUnitReporter();
    this.log(reporter.format(result));
  }

  private formatResultInJson(result: TestResult): RunResult {
    try {
      const reporter = new JsonReporter();
      return reporter.format(result);
    } catch (e) {
      this.styledJSON(result);
      const msg = messages.getMessage('testResultProcessErr', [(e as Error).message]);
      this.error(msg);
      throw e;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private formatReportHint(result: TestResult, username: string): string {
    let reportArgs = `-i ${result.summary.testRunId}`;

    if (username) {
      reportArgs += ` -o ${username}`;
    }
    return messages.getMessage('apexTestReportFormatHint', [reportArgs]);
  }
}
