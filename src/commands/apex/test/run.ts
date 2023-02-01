/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
  ApexTestRunResultStatus,
  CancellationTokenSource,
  HumanReporter,
  JUnitReporter,
  ResultFormat,
  TapReporter,
  TestLevel,
  TestResult,
  TestRunIdResult,
  TestService,
} from '@salesforce/apex-node';
import {
  Flags,
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
  SfCommand,
} from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';
import { AnyJson, Optional } from '@salesforce/ts-types';
import { Duration } from '@salesforce/kit';

import { buildOutputDirConfig, RunResult, JsonReporter } from '../../../reporters';
import { buildDescription, FAILURE_EXIT_CODE, resultFormat } from '../../../utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.load('@salesforce/plugin-apex', 'run', [
  'apexLibErr',
  'apexTestReportFormatHint',
  'classNamesDescription',
  'classSuiteTestErr',
  'codeCoverageDescription',
  'commandDescription',
  'detailedCoverageDescription',
  'jsonDescription',
  'logLevelDescription',
  'logLevelLongDescription',
  'longDescription',
  'missingReporterErr',
  'outputDirectoryDescription',
  'outputDirHint',
  'resultFormatLongDescription',
  'runTestReportCommand',
  'suiteNamesDescription',
  'syncClassErr',
  'synchronousDescription',
  'testLevelDescription',
  'testLevelErr',
  'testResultProcessErr',
  'testsDescription',
  'verboseDescription',
  'waitDescription',
  'warningMessage',
]);

export const TestLevelValues = ['RunLocalTests', 'RunAllTestsInOrg', 'RunSpecifiedTests'];
export type RunCommandResult = RunResult | TestRunIdResult;
export default class Run extends SfCommand<RunCommandResult> {
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
    '$ sfdx force:apex:test:run',
    '$ sfdx force:apex:test:run -n "MyClassTest,MyOtherClassTest" -r human',
    '$ sfdx force:apex:test:run -s "MySuite,MyOtherSuite" -c -v --json',
    '$ sfdx force:apex:test:run -t "MyClassTest.testCoolFeature,MyClassTest.testAwesomeFeature,AnotherClassTest,namespace.TheirClassTest.testThis" -r human',
    '$ sfdx force:apex:test:run -l RunLocalTests -d <path to outputdir> -u me@my.org',
  ];
  public static readonly deprecateAliases = true;
  public static readonly aliases = ['force:apex:test:run'];

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
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
    'test-level': Flags.enum({
      deprecateAliases: true,
      aliases: ['testlevel'],
      char: 'l',
      summary: messages.getMessage('testLevelDescription'),
      options: TestLevelValues,
    }),
    'class-names': Flags.string({
      deprecateAliases: true,
      aliases: ['classnames'],
      char: 'n',
      summary: messages.getMessage('classNamesDescription'),
    }),
    'result-format': Flags.enum({
      deprecateAliases: true,
      aliases: ['resultformat'],
      char: 'r',
      summary: messages.getMessage('resultFormatLongDescription'),
      options: resultFormat,
    }),
    'suite-names': Flags.string({
      deprecateAliases: true,
      aliases: ['suitenames'],
      char: 's',
      summary: messages.getMessage('suiteNamesDescription'),
    }),
    tests: Flags.string({
      char: 't',
      summary: messages.getMessage('testsDescription'),
    }),
    wait: Flags.duration({
      unit: 'minutes',
      char: 'w',
      summary: messages.getMessage('waitDescription'),
    }),
    synchronous: Flags.boolean({
      char: 'y',
      summary: messages.getMessage('synchronousDescription'),
    }),
    'detailed-coverage': Flags.boolean({
      deprecateAliases: true,
      aliases: ['detailedcoverage'],
      char: 'v',
      summary: messages.getMessage('detailedCoverageDescription'),
      dependsOn: ['code-coverage'],
    }),
  };

  protected cancellationTokenSource = new CancellationTokenSource();

  public async run(): Promise<RunCommandResult> {
    const { flags } = await this.parse(Run);

    await this.validateFlags(
      flags['code-coverage'],
      flags['result-format'],
      flags['class-names'],
      flags['suite-names'],
      flags.tests,
      flags.synchronous,
      flags['test-level'] as TestLevel
    );

    if (flags['output-dir']) {
      this.warn(messages.getMessage('warningMessage'));
    }

    // add listener for errors
    process.on('uncaughtException', (err) => {
      throw messages.createError('apexLibErr', [err.message]);
    });

    // graceful shutdown
    const exitHandler = async (): Promise<void> => {
      await this.cancellationTokenSource.asyncCancel();
      process.exit();
    };

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on('SIGINT', exitHandler);
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on('SIGTERM', exitHandler);

    const testLevel = this.getTestLevelFromFlags(
      flags['class-names'],
      flags['suite-names'],
      flags['tests'],
      flags['test-level'] as TestLevel
    );

    const conn = flags['target-org'].getConnection(flags['api-version']);
    const testService = new TestService(conn);
    let result: TestResult | TestRunIdResult;

    // NOTE: This is a *bug*. Synchronous test runs should throw an error when multiple test classes are specified
    // This was re-introduced due to https://github.com/forcedotcom/salesforcedx-vscode/issues/3154
    // Address with W-9163533
    if (flags.synchronous && testLevel === TestLevel.RunSpecifiedTests) {
      const payload = await testService.buildSyncPayload(testLevel, flags.tests, flags['class-names']);
      payload.skipCodeCoverage = !flags['code-coverage'];
      result = (await testService.runTestSynchronous(
        payload,
        flags['code-coverage'],
        this.cancellationTokenSource.token
      )) as TestResult;
    } else {
      const payload = await testService.buildAsyncPayload(
        testLevel,
        flags.tests,
        flags['class-names'],
        flags['suite-names']
      );

      payload.skipCodeCoverage = !flags['code-coverage'];
      const reporter = undefined;
      result = await testService.runTestAsynchronous(
        payload,
        flags['code-coverage'],
        this.shouldImmediatelyReturn(flags.synchronous, flags['result-format'], flags.json, flags.wait),
        reporter,
        this.cancellationTokenSource.token
      );
    }

    if (this.cancellationTokenSource.token.isCancellationRequested) {
      // return null;
      throw new SfError('Cancelled');
    }

    if (flags['output-dir']) {
      const jsonOutput = this.formatResultInJson(result);
      const outputDirConfig = buildOutputDirConfig(
        result,
        jsonOutput,
        flags['output-dir'],
        flags['result-format'] as Optional<ResultFormat>,
        flags['detailed-coverage'],
        flags.synchronous
      );

      await testService.writeResultFiles(result, outputDirConfig, flags['code-coverage']);
    }

    try {
      if ((result as TestResult).summary && (result as TestResult).summary.outcome === ApexTestRunResultStatus.Failed) {
        process.exitCode = FAILURE_EXIT_CODE;
      }
      switch (flags['result-format']) {
        case 'human':
          this.logHuman(result as TestResult, flags['detailed-coverage'], flags['output-dir']);
          break;
        case 'tap':
          this.logTap(result as TestResult);
          break;
        case 'junit':
          this.logJUnit(result as TestResult);
          break;
        case 'json':
          // when --json flag is specified, we should log CLI json format
          if (!flags.json) {
            this.styledJSON({
              status: process.exitCode,
              result: this.formatResultInJson(result),
            } as AnyJson);
          }
          break;
        default:
          if (flags.synchronous || flags.wait) {
            this.logHuman(result as TestResult, flags['detailed-coverage'], flags['output-dir']);
          } else {
            const id = (result as TestRunIdResult).testRunId;
            this.log(messages.getMessage('runTestReportCommand', [id, flags['target-org'].getUsername()]));
          }
      }
    } catch (e) {
      this.styledJSON(result);
      const msg = messages.getMessage('testResultProcessErr', [(e as Error).message]);
      this.error(msg);
    }

    return this.formatResultInJson(result);
  }

  // eslint-disable-next-line class-methods-use-this
  public async validateFlags(
    codeCoverage?: boolean,
    resultFormatFlag?: string,
    classNames?: string,
    suiteNames?: string,
    tests?: string,
    synchronous?: boolean,
    testLevel?: TestLevel
  ): Promise<void> {
    if (codeCoverage && !resultFormatFlag) {
      return Promise.reject(new Error(messages.getMessage('missingReporterErr')));
    }

    if ((classNames && (suiteNames || tests)) || (suiteNames && tests)) {
      return Promise.reject(new Error(messages.getMessage('classSuiteTestErr')));
    }

    if (synchronous && (suiteNames || (classNames && classNames.split(',').length > 1))) {
      return Promise.reject(new Error(messages.getMessage('syncClassErr')));
    }

    if ((tests || classNames || suiteNames) && testLevel && testLevel !== 'RunSpecifiedTests') {
      return Promise.reject(new Error(messages.getMessage('testLevelErr')));
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private getTestLevelFromFlags(
    classNames?: string,
    suiteNames?: string,
    tests?: string,
    testLevelFlag?: TestLevel
  ): TestLevel {
    let testLevel: TestLevel;
    if (testLevelFlag) {
      testLevel = testLevelFlag;
    } else if (classNames || suiteNames || tests) {
      testLevel = TestLevel.RunSpecifiedTests;
    } else {
      testLevel = TestLevel.RunLocalTests;
    }

    return testLevel;
  }

  private logHuman(result: TestResult, detailedCoverage: boolean, outputDir?: string): void {
    if (outputDir) {
      this.log(messages.getMessage('outputDirHint', [outputDir]));
    }
    const humanReporter = new HumanReporter();
    const output = humanReporter.format(result, detailedCoverage);
    this.log(output);
  }

  private logTap(result: TestResult): void {
    const reporter = new TapReporter();
    const hint = this.formatReportHint(result);
    this.log(reporter.format(result, [hint]));
  }

  private logJUnit(result: TestResult): void {
    const reporter = new JUnitReporter();
    this.log(reporter.format(result));
  }

  private formatResultInJson(result: TestResult | TestRunIdResult): RunResult | TestRunIdResult {
    try {
      const reporter = new JsonReporter();
      return (result as TestResult).summary ? reporter.format(result as TestResult) : (result as TestRunIdResult);
    } catch (e) {
      this.styledJSON(result);
      const msg = messages.getMessage('testResultProcessErr', [(e as Error).message]);
      this.error(msg);
      throw e;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private formatReportHint(result: TestResult, username?: string): string {
    let reportArgs = `-i ${result.summary.testRunId}`;
    if (username) {
      reportArgs += ` -o ${username}`;
    }
    return messages.getMessage('apexTestReportFormatHint', [reportArgs]);
  }

  /**
   * Handles special exceptions where we don't want to return early
   * with the testRunId.
   **/
  // eslint-disable-next-line class-methods-use-this
  private shouldImmediatelyReturn(
    synchronous?: boolean,
    resultFormatFlag?: string,
    json?: boolean,
    wait?: Duration
  ): boolean {
    if (resultFormatFlag !== undefined) {
      return false;
    }

    // when the user has explictly asked to wait for results, but didn't give a format
    if (wait) {
      return false;
    }

    // historical expectation to wait for results from a synchronous test run
    return !(synchronous && !json);
  }
}
