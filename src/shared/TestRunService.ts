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

import { CancellationTokenSource, TestLevel, TestResult, TestRunIdResult, TestService } from '@salesforce/apex-node';
import { Ux } from '@salesforce/sf-plugins-core';
import { Messages, SfError, Connection } from '@salesforce/core';
import { Duration } from '@salesforce/kit';
import { RunResult, TestReporter } from '../reporters/index.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'runtestcommon');

export const TestLevelValues = ['RunLocalTests', 'RunAllTestsInOrg', 'RunSpecifiedTests'];
export type RunCommandResult = RunResult | TestRunIdResult;

export type TestRunFlags = {
  'code-coverage'?: boolean;
  'output-dir'?: string;
  'test-level'?: string;
  'class-names'?: string[];
  'suite-names'?: string[];
  tests?: string[];
  wait?: Duration;
  synchronous?: boolean;
  'detailed-coverage'?: boolean;
  concise?: boolean;
  'result-format'?: string;
  json?: boolean;
  'test-category'?: string[];
  'poll-interval'?: Duration;
};

export type TestRunConfig = {
  commandType: 'apex' | 'logic';
  exclusiveTestSpecifiers: string[];
  binName: string;
};

export type TestRunContext = {
  flags: TestRunFlags;
  config: TestRunConfig;
  connection: Connection;
  jsonEnabled: boolean;
  cancellationToken: CancellationTokenSource;
  log: (message: string) => void;
  info: (message: string) => void;
};

/**
 * Shared service for running tests with command-specific behavior
 */
export class TestRunService {
  public static async runTestCommand(context: TestRunContext): Promise<RunCommandResult> {
    const { flags, config, connection, cancellationToken } = context;

    const testLevel = await TestRunService.validateFlags(
      flags['class-names'],
      flags['suite-names'],
      flags.tests,
      flags.synchronous,
      flags['test-level'] as TestLevel,
      flags['test-category'],
      config
    );

    const testService = new TestService(connection);

    // NOTE: This is a *bug*. Synchronous test runs should throw an error when multiple test classes are specified
    // This was re-introduced due to https://github.com/forcedotcom/salesforcedx-vscode/issues/3154
    // Address with W-9163533
    const result =
      flags.synchronous && testLevel === TestLevel.RunSpecifiedTests
        ? await TestRunService.runTest(testService, flags, testLevel, config, cancellationToken)
        : await TestRunService.runTestAsynchronous(testService, flags, testLevel, config, cancellationToken);

    if (cancellationToken.token.isCancellationRequested) {
      throw new SfError('Cancelled');
    }

    if ('summary' in result) {
      const testReporter = new TestReporter(new Ux({ jsonEnabled: context.jsonEnabled }), connection);
      const reportFlags = {
        ...flags,
        concise: flags.concise ?? false,
        ...(config.commandType === 'logic' ? { isUnifiedLogic: true } : {}),
      };
      return testReporter.report(result, reportFlags);
    } else {
      // Tests were ran asynchronously or the --wait timed out.
      // Log the proper 'get test' command for the user to run later
      TestRunService.logAsyncTestInstructions(result, connection.getUsername?.() ?? 'unknown', config, context.log);
      context.info(messages.getMessage('runTestSyncInstructions'));

      if (flags['output-dir']) {
        // testService writes a file with just the test run id in it to test-run-id.txt
        // github.com/forcedotcom/salesforcedx-apex/blob/c986abfabee3edf12f396f1d2e43720988fa3911/src/tests/testService.ts#L245-L246
        await testService.writeResultFiles(result, { dirPath: flags['output-dir'] }, flags['code-coverage']);
      }

      return result;
    }
  }

  private static async runTest(
    testService: TestService,
    flags: TestRunFlags,
    testLevel: TestLevel,
    config: TestRunConfig,
    cancellationToken: CancellationTokenSource
  ): Promise<TestResult> {
    const testCategory = TestRunService.getTestCategory(flags, config, testLevel);
    const payload = {
      ...(await testService.buildSyncPayload(
        testLevel,
        flags.tests?.join(','),
        flags['class-names']?.join(','),
        testCategory
      )),
      skipCodeCoverage: !flags['code-coverage'],
    };

    try {
      return (await testService.runTestSynchronous(
        payload,
        flags['code-coverage'],
        cancellationToken.token
      )) as TestResult;
    } catch (e) {
      throw TestRunService.handleTestingServerError(SfError.wrap(e), flags, testLevel, config);
    }
  }

  private static async runTestAsynchronous(
    testService: TestService,
    flags: TestRunFlags,
    testLevel: TestLevel,
    config: TestRunConfig,
    cancellationToken: CancellationTokenSource
  ): Promise<TestRunIdResult> {
    const testCategory = TestRunService.getTestCategory(flags, config, testLevel);
    const payload = {
      ...(await testService.buildAsyncPayload(
        testLevel,
        flags.tests?.join(','),
        flags['class-names']?.join(','),
        flags['suite-names']?.join(','),
        testCategory
      )),
      skipCodeCoverage: !flags['code-coverage'],
    };

    try {
      // cast as TestRunIdResult because we're building an async payload which will return an async result
      return (await testService.runTestAsynchronous(
        payload,
        flags['code-coverage'],
        flags.wait && flags.wait.minutes > 0 ? false : !(flags.synchronous && !flags.json),
        undefined,
        cancellationToken.token,
        flags.wait,
        flags['poll-interval']
      )) as TestRunIdResult;
    } catch (e) {
      throw TestRunService.handleTestingServerError(SfError.wrap(e), flags, testLevel, config);
    }
  }

  /**
   * Get test category based on command type and flags
   * - apex command: returns empty string for RunSpecifiedTests, 'Apex' for other test levels
   * - logic command: returns test-category flag value or defaults to all categories
   */
  private static getTestCategory(flags: TestRunFlags, config: TestRunConfig, testLevel: string): string {
    if (config.commandType === 'apex') {
      if (testLevel === 'RunSpecifiedTests') {
        return '';
      }
      return 'Apex';
    }
    // logic command
    return flags['test-category']?.join(',') ?? '';
  }

  /**
   * Log appropriate async test instructions based on command type
   */
  private static logAsyncTestInstructions(
    result: TestRunIdResult,
    username: string,
    config: TestRunConfig,
    log: (message: string) => void
  ): void {
    if (config.commandType === 'logic') {
      log(messages.getMessage('runLogicTestReportCommand', [config.binName, result.testRunId, username]));
    } else {
      log(messages.getMessage('runTestReportCommand', [config.binName, result.testRunId, username]));
    }
  }

  /**
   * Handle testing server errors with command-specific messaging
   */
  private static handleTestingServerError(
    error: SfError,
    flags: TestRunFlags,
    testLevel: TestLevel,
    config: TestRunConfig
  ): SfError {
    if (!error.message.includes('Always provide a classes, suites, tests, or testLevel property')) {
      return error;
    }

    // If error message condition is valid, return the original error.
    const hasSpecifiedTestLevel = testLevel === TestLevel.RunSpecifiedTests;
    const hasNoTestNames = !flags.tests?.length;
    const hasNoClassNames = !flags['class-names']?.length;
    const hasNoSuiteNames = !flags['suite-names']?.length;
    if (hasSpecifiedTestLevel && hasNoTestNames && hasNoClassNames && hasNoSuiteNames) {
      return error;
    }

    // Otherwise, assume there are no tests in the org and return clearer message.
    const testType = config.commandType === 'apex' ? 'Apex' : 'Logic';
    return Object.assign(error, {
      message: `There are no ${testType} tests to run in this org.`,
      actions: [`Ensure ${testType} Tests exist in the org, and try again.`],
    });
  }

  /**
   * Validate flags with command-specific logic
   */
  private static async validateFlags(
    classNames?: string[],
    suiteNames?: string[],
    tests?: string[],
    synchronous?: boolean,
    testLevel?: TestLevel,
    testCategory?: string[],
    config?: TestRunConfig
  ): Promise<TestLevel> {
    if (synchronous && (Boolean(suiteNames) || (classNames && classNames.length > 1))) {
      return config?.commandType === 'apex'
        ? Promise.reject(new Error(messages.getMessage('syncClassErr')))
        : Promise.reject(new Error(messages.getMessage('syncClassErrForUnifiedLogic')));
    }

    // Validate that test-level is required when test-category is specified (logic command only)
    if (config?.commandType === 'logic' && testCategory && testCategory.length > 0 && !testLevel) {
      return Promise.reject(new Error('When using --test-category, you must also specify --test-level.'));
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
  }
}
