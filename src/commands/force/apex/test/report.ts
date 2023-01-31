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
import { buildOutputDirConfig, RunResult, JsonReporter } from '../../../../reporters';
import { buildDescription, FAILURE_EXIT_CODE, logLevels, resultFormat } from '../../../../utils';

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
  'warningMessage',
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
    '$ sfdx force:apex:test:report -i <test run id>',
    '$ sfdx force:apex:test:report -i <test run id> -r junit',
    '$ sfdx force:apex:test:report -i <test run id> -c --json',
    '$ sfdx force:apex:test:report -i <test run id> -c -d <path to outputdir> -u me@myorg',
  ];
  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    testrunid: Flags.string({
      char: 'i',
      // todo:validate flag
      summary: messages.getMessage('testRunIdDescription'),
      required: true,
    }),
    loglevel: Flags.enum({
      summary: messages.getMessage('logLevelDescription'),
      description: messages.getMessage('logLevelLongDescription'),
      default: 'warn',
      options: logLevels,
    }),
    codecoverage: Flags.boolean({
      char: 'c',
      summary: messages.getMessage('codeCoverageDescription'),
    }),
    outputdir: Flags.string({
      char: 'd',
      summary: messages.getMessage('outputDirectoryDescription'),
    }),
    resultformat: Flags.enum({
      char: 'r',
      summary: messages.getMessage('resultFormatLongDescription'),
      options: resultFormat,
    }),
    wait: Flags.string({
      char: 'w',
      summary: messages.getMessage('waitDescription'),
    }),
    verbose: Flags.boolean({
      summary: messages.getMessage('verboseDescription'),
    }),
  };

  public async run(): Promise<RunResult> {
    const { flags } = await this.parse(Report);

    if (flags.outputdir) {
      this.warn(messages.getMessage('warningMessage'));
    }

    // add listener for errors
    process.on('uncaughtException', (err) => {
      throw messages.createError('apexLibErr', [err.message]);
    });

    // org is guaranteed by requiresUsername field
    const conn = flags['target-org'].getConnection(flags['api-version']);

    const testService = new TestService(conn);
    const result = await testService.reportAsyncResults(flags.testrunid, flags.codecoverage);
    const jsonOutput = this.formatResultInJson(result);

    if (flags.outputdir) {
      const outputDirConfig = buildOutputDirConfig(
        result,
        jsonOutput,
        flags.outputdir,
        flags.resultformat as ResultFormat,
        true
      );

      await testService.writeResultFiles(result, outputDirConfig, flags.codecoverage);
    }

    try {
      if (result.summary.outcome === ApexTestRunResultStatus.Failed) {
        process.exitCode = FAILURE_EXIT_CODE;
      }
      switch (flags.resultformat) {
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
          this.logHuman(result, true, flags.outputdir);
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
