/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { CancellationTokenSource, TestLevel, TestResult, TestRunIdResult, TestService } from '@salesforce/apex-node';
import {
  Flags,
  loglevel,
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
  SfCommand,
  Ux,
} from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';
import { Duration } from '@salesforce/kit';

import { RunResult, TestReporter } from '../../../reporters';
import { resultFormat } from '../../../utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.load('@salesforce/plugin-apex', 'runtest', [
  'apexLibErr',
  'flags.class-names.summary',
  'flags.class-names.description',
  'classSuiteTestErr',
  'flags.code-coverage.summary',
  'flags.detailed-coverage.summary',
  'description',
  'missingReporterErr',
  'flags.output-dir.summary',
  'outputDirHint',
  'flags.result-format.summary',
  'runTestReportCommand',
  'flags.suite-names.summary',
  'flags.suite-names.description',
  'syncClassErr',
  'flags.synchronous.summary',
  'flags.test-level.summary',
  'flags.test-level.description',
  'testLevelErr',
  'testResultProcessErr',
  'flags.tests.summary',
  'flags.tests.description',
  'flags.wait.summary',
  'summary',
  'examples',
]);

export const TestLevelValues = ['RunLocalTests', 'RunAllTestsInOrg', 'RunSpecifiedTests'];
export type RunCommandResult = RunResult | TestRunIdResult;
export default class Test extends SfCommand<RunCommandResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly deprecateAliases = true;
  public static readonly aliases = ['force:apex:test:run'];

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
    'code-coverage': Flags.boolean({
      aliases: ['codecoverage'],
      deprecateAliases: true,
      char: 'c',
      summary: messages.getMessage('flags.code-coverage.summary'),
    }),
    'output-dir': Flags.directory({
      aliases: ['outputdir', 'output-directory'],
      deprecateAliases: true,
      char: 'd',
      summary: messages.getMessage('flags.output-dir.summary'),
    }),
    'test-level': Flags.string({
      deprecateAliases: true,
      aliases: ['testlevel'],
      char: 'l',
      summary: messages.getMessage('flags.test-level.summary'),
      description: messages.getMessage('flags.test-level.description'),
      options: TestLevelValues,
    }),
    'class-names': Flags.string({
      deprecateAliases: true,
      aliases: ['classnames'],
      char: 'n',
      summary: messages.getMessage('flags.class-names.summary'),
      description: messages.getMessage('flags.class-names.description'),
    }),
    'result-format': Flags.string({
      deprecateAliases: true,
      aliases: ['resultformat'],
      char: 'r',
      summary: messages.getMessage('flags.result-format.summary'),
      options: resultFormat,
    }),
    'suite-names': Flags.string({
      deprecateAliases: true,
      aliases: ['suitenames'],
      char: 's',
      summary: messages.getMessage('flags.suite-names.summary'),
      description: messages.getMessage('flags.suite-names.description'),
    }),
    tests: Flags.string({
      char: 't',
      summary: messages.getMessage('flags.tests.summary'),
      description: messages.getMessage('flags.tests.description'),
    }),
    wait: Flags.duration({
      unit: 'minutes',
      char: 'w',
      summary: messages.getMessage('flags.wait.summary'),
    }),
    synchronous: Flags.boolean({
      char: 'y',
      summary: messages.getMessage('flags.synchronous.summary'),
    }),
    'detailed-coverage': Flags.boolean({
      deprecateAliases: true,
      aliases: ['detailedcoverage'],
      char: 'v',
      summary: messages.getMessage('flags.detailed-coverage.summary'),
      dependsOn: ['code-coverage'],
    }),
  };

  protected cancellationTokenSource = new CancellationTokenSource();

  public async run(): Promise<RunCommandResult> {
    const { flags } = await this.parse(Test);

    const testLevel = await this.validateFlags(
      flags['code-coverage'],
      flags['result-format'],
      flags['class-names'],
      flags['suite-names'],
      flags.tests,
      flags.synchronous,
      flags['test-level'] as TestLevel
    );

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

    const conn = flags['target-org'].getConnection(flags['api-version']);
    const testService = new TestService(conn);
    let result: TestResult | TestRunIdResult;

    // NOTE: This is a *bug*. Synchronous test runs should throw an error when multiple test classes are specified
    // This was re-introduced due to https://github.com/forcedotcom/salesforcedx-vscode/issues/3154
    // Address with W-9163533
    if (flags.synchronous && testLevel === TestLevel.RunSpecifiedTests) {
      result = await this.runTest(testService, flags, testLevel);
    } else {
      result = await this.runTestAsynchronous(testService, flags, testLevel);
    }

    if (this.cancellationTokenSource.token.isCancellationRequested) {
      throw new SfError('Cancelled');
    }

    // check to make sure we have a TestResult
    if ((result as TestResult).summary) {
      result = result as TestResult;
      const testReporter = new TestReporter(new Ux({ jsonEnabled: this.jsonEnabled() }), conn, this.config.bin);

      return testReporter.report(result, {
        wait: flags.wait,
        'output-dir': flags['output-dir'],
        'result-format': flags['result-format'],
        'detailed-coverage': flags['detailed-coverage'],
        synchronous: flags.synchronous,
        json: flags.json,
        codeCoverage: flags['code-coverage'],
      });
    } else {
      // async test run
      result = result as TestRunIdResult;
      this.log(messages.getMessage('runTestReportCommand', [this.config.bin, result.testRunId, conn.getUsername()]));
      return result;
    }
  }

  // eslint-disable-next-line class-methods-use-this,complexity
  public async validateFlags(
    codeCoverage?: boolean,
    resultFormatFlag?: string,
    classNames?: string,
    suiteNames?: string,
    tests?: string,
    synchronous?: boolean,
    testLevel?: TestLevel
  ): Promise<TestLevel> {
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

    let test: TestLevel;
    if (testLevel) {
      test = testLevel;
    } else if (classNames || suiteNames || tests) {
      test = TestLevel.RunSpecifiedTests;
    } else {
      test = TestLevel.RunLocalTests;
    }

    return test;
  }

  private async runTest(
    testService: TestService,
    flags: {
      tests?: string;
      'class-names'?: string;
      'code-coverage'?: boolean;
    },
    testLevel: TestLevel
  ): Promise<TestResult> {
    const payload = await testService.buildSyncPayload(testLevel, flags.tests, flags['class-names']);
    payload.skipCodeCoverage = !flags['code-coverage'];
    return (await testService.runTestSynchronous(
      payload,
      flags['code-coverage'],
      this.cancellationTokenSource.token
    )) as TestResult;
  }

  private async runTestAsynchronous(
    testService: TestService,
    flags: {
      tests?: string;
      'class-names'?: string;
      'suite-names'?: string;
      'code-coverage'?: boolean;
      synchronous?: boolean;
      'result-format'?: string;
      json?: boolean;
      wait?: Duration;
    },
    testLevel: TestLevel
  ): Promise<TestRunIdResult> {
    const payload = await testService.buildAsyncPayload(
      testLevel,
      flags.tests,
      flags['class-names'],
      flags['suite-names']
    );

    payload.skipCodeCoverage = !flags['code-coverage'];
    return testService.runTestAsynchronous(
      payload,
      flags['code-coverage'],
      this.shouldImmediatelyReturn(flags.synchronous, flags['result-format'], flags.json, flags.wait),
      undefined,
      this.cancellationTokenSource.token
    ) as Promise<TestRunIdResult>;
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
