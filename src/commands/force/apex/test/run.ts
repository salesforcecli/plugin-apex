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
import { Messages, Org, SfError } from '@salesforce/core';
import { AnyJson, Optional } from '@salesforce/ts-types';
import { buildOutputDirConfig, RunResult, JsonReporter } from '../../../../reporters';
import { buildDescription, FAILURE_EXIT_CODE, logLevels, resultFormat } from '../../../../utils';

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

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    loglevel: Flags.enum({
      summary: messages.getMessage('logLevelDescription'),
      description: messages.getMessage('logLevelLongDescription'),
      default: 'warn',
      options: logLevels,
    }),
    'api-version': orgApiVersionFlagWithDeprecations,
    codecoverage: Flags.boolean({
      char: 'c',
      summary: messages.getMessage('codeCoverageDescription'),
    }),
    outputdir: Flags.string({
      char: 'd',
      summary: messages.getMessage('outputDirectoryDescription'),
    }),
    testlevel: Flags.enum({
      char: 'l',
      summary: messages.getMessage('testLevelDescription'),
      options: TestLevelValues,
    }),
    classnames: Flags.string({
      char: 'n',
      summary: messages.getMessage('classNamesDescription'),
    }),
    resultformat: Flags.enum({
      char: 'r',
      summary: messages.getMessage('resultFormatLongDescription'),
      options: resultFormat,
    }),
    suitenames: Flags.string({
      char: 's',
      summary: messages.getMessage('suiteNamesDescription'),
    }),
    tests: Flags.string({
      char: 't',
      summary: messages.getMessage('testsDescription'),
    }),
    wait: Flags.string({
      char: 'w',
      summary: messages.getMessage('waitDescription'),
    }),
    synchronous: Flags.boolean({
      char: 'y',
      summary: messages.getMessage('synchronousDescription'),
    }),
    verbose: Flags.boolean({
      summary: messages.getMessage('verboseDescription'),
    }),
    detailedcoverage: Flags.boolean({
      char: 'v',
      summary: messages.getMessage('detailedCoverageDescription'),
      dependsOn: ['codecoverage'],
    }),
  };

  protected cancellationTokenSource = new CancellationTokenSource();
  private flags: {
    'target-org': Org;
    loglevel: string;
    'api-version': string | undefined;
    codecoverage: boolean;
    outputdir: string | undefined;
    testlevel: string | undefined;
    classnames: string | undefined;
    resultformat: string | undefined;
    suitenames: string | undefined;
    tests: string | undefined;
    wait: string | undefined;
    synchronous: boolean;
    verbose: boolean;
    detailedcoverage: boolean;
  } & { json: boolean | undefined };

  public async run(): Promise<RunCommandResult> {
    const { flags } = await this.parse(Run);
    this.flags = flags;

    await this.validateFlags();

    if (flags.outputdir) {
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

    const testLevel = this.getTestLevelfromFlags();

    const conn = flags['target-org'].getConnection(flags['api-version']);
    const testService = new TestService(conn);
    let result: TestResult | TestRunIdResult;

    // NOTE: This is a *bug*. Synchronous test runs should throw an error when multiple test classes are specified
    // This was re-introduced due to https://github.com/forcedotcom/salesforcedx-vscode/issues/3154
    // Address with W-9163533
    if (flags.synchronous && testLevel === TestLevel.RunSpecifiedTests) {
      const payload = await testService.buildSyncPayload(testLevel, flags.tests, flags.classnames);
      payload.skipCodeCoverage = !flags.codecoverage;
      result = (await testService.runTestSynchronous(
        payload,
        flags.codecoverage,
        this.cancellationTokenSource.token
      )) as TestResult;
    } else {
      const payload = await testService.buildAsyncPayload(testLevel, flags.tests, flags.classnames, flags.suitenames);

      payload.skipCodeCoverage = !flags.codecoverage;
      const reporter = undefined;
      result = await testService.runTestAsynchronous(
        payload,
        flags.codecoverage,
        this.shouldImmediatelyReturn(),
        reporter,
        this.cancellationTokenSource.token
      );
    }

    if (this.cancellationTokenSource.token.isCancellationRequested) {
      // return null;
      throw new SfError('Cancelled');
    }

    if (flags.outputdir) {
      const jsonOutput = this.formatResultInJson(result);
      const outputDirConfig = buildOutputDirConfig(
        result,
        jsonOutput,
        flags.outputdir,
        flags.resultformat as Optional<ResultFormat>,
        flags.detailedcoverage,
        flags.synchronous
      );

      await testService.writeResultFiles(result, outputDirConfig, flags.codecoverage);
    }

    try {
      if ((result as TestResult).summary && (result as TestResult).summary.outcome === ApexTestRunResultStatus.Failed) {
        process.exitCode = FAILURE_EXIT_CODE;
      }
      switch (flags.resultformat) {
        case 'human':
          this.logHuman(result as TestResult, flags.detailedcoverage, flags.outputdir);
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
            this.logHuman(result as TestResult, flags.detailedcoverage, flags.outputdir);
          } else {
            const id = (result as TestRunIdResult).testRunId;
            this.log(messages.getMessage('runTestReportCommand', [id, this.flags['target-org'].getUsername()]));
          }
      }
    } catch (e) {
      this.styledJSON(result);
      const msg = messages.getMessage('testResultProcessErr', [(e as Error).message]);
      this.error(msg);
    }

    return this.formatResultInJson(result);
  }

  public async validateFlags(): Promise<void> {
    if (this.flags.codecoverage && !this.flags.resultformat) {
      return Promise.reject(new Error(messages.getMessage('missingReporterErr')));
    }

    if (
      (this.flags.classnames && (this.flags.suitenames || this.flags.tests)) ||
      (this.flags.suitenames && this.flags.tests)
    ) {
      return Promise.reject(new Error(messages.getMessage('classSuiteTestErr')));
    }

    if (
      this.flags.synchronous &&
      (this.flags.suitenames || (this.flags.classnames && this.flags.classnames.split(',').length > 1))
    ) {
      return Promise.reject(new Error(messages.getMessage('syncClassErr')));
    }

    if (
      (this.flags.tests || this.flags.classnames || this.flags.suitenames) &&
      this.flags.testlevel &&
      this.flags.testlevel !== 'RunSpecifiedTests'
    ) {
      return Promise.reject(new Error(messages.getMessage('testLevelErr')));
    }
  }

  private getTestLevelfromFlags(): TestLevel {
    let testLevel: TestLevel;
    if (this.flags.testlevel) {
      testLevel = this.flags.testlevel as TestLevel;
    } else if (this.flags.classnames || this.flags.suitenames || this.flags.tests) {
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

  private formatReportHint(result: TestResult): string {
    let reportArgs = `-i ${result.summary.testRunId}`;
    if (this.flags['target-org']) {
      reportArgs += ` -o ${this.flags['target-org'].getUsername() as string}`;
    }
    return messages.getMessage('apexTestReportFormatHint', [reportArgs]);
  }

  /**
   * Handles special exceptions where we don't want to return early
   * with the testRunId.
   **/
  private shouldImmediatelyReturn(): boolean {
    if (this.flags.resultformat !== undefined) {
      return false;
    }

    // when the user has explictly asked to wait for results, but didn't give a format
    if (this.flags.wait) {
      return false;
    }

    // historical expectation to wait for results from a synchronous test run
    return !(this.flags.synchronous && !this.flags.json);
  }
}
