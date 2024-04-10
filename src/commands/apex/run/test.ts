/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { CancellationTokenSource, TestLevel, TestResult, TestRunIdResult, TestService } from '@salesforce/apex-node';
import {
  arrayWithDeprecation,
  Flags,
  loglevel,
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
  SfCommand,
  Ux,
} from '@salesforce/sf-plugins-core';
import { Messages, PollingClient, SfError } from '@salesforce/core';
import { Duration } from '@salesforce/kit';
import { RunResult, TestReporter } from '../../../reporters/index.js';
import { resultFormat } from '../../../utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'runtest');

export const TestLevelValues = ['RunLocalTests', 'RunAllTestsInOrg', 'RunSpecifiedTests'];
export type RunCommandResult = RunResult | TestRunIdResult;
const exclusiveTestSpecifiers = ['class-names', 'suite-names', 'tests'];
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
    'class-names': arrayWithDeprecation({
      deprecateAliases: true,
      aliases: ['classnames'],
      char: 'n',
      summary: messages.getMessage('flags.class-names.summary'),
      description: messages.getMessage('flags.class-names.description'),
      exclusive: exclusiveTestSpecifiers.filter((specifier) => specifier !== 'class-names'),
    }),
    'result-format': Flags.string({
      deprecateAliases: true,
      aliases: ['resultformat'],
      char: 'r',
      summary: messages.getMessage('flags.result-format.summary'),
      options: resultFormat,
      default: 'human',
    }),
    'suite-names': arrayWithDeprecation({
      deprecateAliases: true,
      aliases: ['suitenames'],
      char: 's',
      summary: messages.getMessage('flags.suite-names.summary'),
      description: messages.getMessage('flags.suite-names.description'),
      exclusive: exclusiveTestSpecifiers.filter((specifier) => specifier !== 'suite-names'),
    }),
    tests: arrayWithDeprecation({
      char: 't',
      summary: messages.getMessage('flags.tests.summary'),
      description: messages.getMessage('flags.tests.description'),
      exclusive: exclusiveTestSpecifiers.filter((specifier) => specifier !== 'tests'),
    }),
    // we want to pass `undefined` to the API
    // eslint-disable-next-line sf-plugin/flag-min-max-default
    wait: Flags.duration({
      unit: 'minutes',
      char: 'w',
      summary: messages.getMessage('flags.wait.summary'),
      min: 0,
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

    const testLevel = await validateFlags(
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

    // NOTE: This is a *bug*. Synchronous test runs should throw an error when multiple test classes are specified
    // This was re-introduced due to https://github.com/forcedotcom/salesforcedx-vscode/issues/3154
    // Address with W-9163533
    const result =
      flags.synchronous && testLevel === TestLevel.RunSpecifiedTests
        ? await this.runTest(testService, flags, testLevel)
        : await this.runTestAsynchronous(testService, flags, testLevel);

    if (this.cancellationTokenSource.token.isCancellationRequested) {
      throw new SfError('Cancelled');
    }

    if ('summary' in result) {
      const testReporter = new TestReporter(new Ux({ jsonEnabled: this.jsonEnabled() }), conn, this.config.bin);
      return testReporter.report(result, flags);
    } else {
      // Tests were ran asynchronously or the --wait timed out.
      // Log the proper 'apex get test' command for the user to run later
      this.log(messages.getMessage('runTestReportCommand', [this.config.bin, result.testRunId, conn.getUsername()]));
      this.info(messages.getMessage('runTestSyncInstructions'));

      if (flags['output-dir']) {
        // testService writes a file with just the test run id in it to test-run-id.txt
        // github.com/forcedotcom/salesforcedx-apex/blob/c986abfabee3edf12f396f1d2e43720988fa3911/src/tests/testService.ts#L245-L246
        await testService.writeResultFiles(result, { dirPath: flags['output-dir'] }, flags['code-coverage']);
      }

      return result;
    }
  }

  private async runTest(
    testService: TestService,
    flags: {
      tests?: string[];
      'class-names'?: string[];
      'code-coverage'?: boolean;
    },
    testLevel: TestLevel
  ): Promise<TestResult> {
    const payload = {
      ...(await testService.buildSyncPayload(testLevel, flags.tests?.join(','), flags['class-names']?.join(','))),
      skipCodeCoverage: !flags['code-coverage'],
    };
    return testService.runTestSynchronous(
      payload,
      flags['code-coverage'],
      this.cancellationTokenSource.token
    ) as Promise<TestResult>;
  }

  private async runTestAsynchronous(
    testService: TestService,
    flags: {
      tests?: string[];
      'class-names'?: string[];
      'suite-names'?: string[];
      'code-coverage'?: boolean;
      synchronous?: boolean;
      'result-format'?: string;
      json?: boolean;
      wait?: Duration;
    },
    testLevel: TestLevel
  ): Promise<TestRunIdResult> {
    const payload = {
      ...(await testService.buildAsyncPayload(
        testLevel,
        flags.tests?.join(','),
        flags['class-names']?.join(','),
        flags['suite-names']?.join(',')
      )),
      skipCodeCoverage: !flags['code-coverage'],
    };

    // cast as TestRunIdResult because we're building an async payload which will return an async result
    const testRun = (await testService.runTestAsynchronous(
      payload,
      flags['code-coverage'],
      true,
      undefined,
      this.cancellationTokenSource.token
    )) as TestRunIdResult;

    if (flags.wait && flags.wait.minutes > 0 && !(flags.synchronous && !this.jsonEnabled())) {
      // polling for the results
      const pollingClient = await PollingClient.create({
        frequency: Duration.seconds(1),
        timeout: flags.wait,
        timeoutErrorName: 'ApexRunTestTimeout',
        poll: async () => {
          const poll = await testService.asyncService.checkRunStatus(testRun.testRunId);

          return poll.testsComplete
            ? {
                completed: true,
                payload: await testService.reportAsyncResults(
                  testRun.testRunId,
                  flags['code-coverage'],
                  this.cancellationTokenSource.token
                ),
              }
            : {
                completed: false,
                payload: poll.testRunSummary,
              };
        },
      });
      let result: TestRunIdResult;
      try {
        result = await pollingClient.subscribe();
      } catch (e) {
        if ((e as Error).name === 'ApexRunTestTimeout') {
          result = testRun;
        } else throw SfError.wrap(e as Error);
      }

      return result;
    } else {
      return testRun;
    }
  }
}

const validateFlags = async (
  classNames?: string[],
  suiteNames?: string[],
  tests?: string[],
  synchronous?: boolean,
  testLevel?: TestLevel
): Promise<TestLevel> => {
  if (synchronous && (Boolean(suiteNames) || (classNames?.length && classNames.length > 1))) {
    return Promise.reject(new Error(messages.getMessage('syncClassErr')));
  }

  if (
    (Boolean(tests) || Boolean(classNames) || suiteNames) &&
    testLevel &&
    testLevel.toString() !== 'RunSpecifiedTests'
  ) {
    return Promise.reject(new Error(messages.getMessage('testLevelErr')));
  }

  if (testLevel) {
    return testLevel;
  }
  if (Boolean(classNames) || Boolean(suiteNames) || tests) {
    return TestLevel.RunSpecifiedTests;
  }
  return TestLevel.RunLocalTests;
};
