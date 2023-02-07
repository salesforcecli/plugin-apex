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
  OutputDirConfig,
  ResultFormat,
  TapReporter,
  TestResult,
  TestRunIdResult,
  TestService,
} from '@salesforce/apex-node';
import { AnyJson, Optional } from '@salesforce/ts-types';
import { Ux } from '@salesforce/sf-plugins-core';
import { Connection, Messages } from '@salesforce/core';
import { Duration } from '@salesforce/kit';
import { FAILURE_EXIT_CODE } from '../utils';
import { JsonReporter, RunResult } from './jsonReporter';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.load('@salesforce/plugin-apex', 'run', [
  'apexLibErr',
  'apexTestReportFormatHint',
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

export class TestReporter {
  public constructor(private readonly ux: Ux, private readonly connection: Connection) {}

  public async report(
    result: TestResult,
    options: {
      wait?: Duration;
      'output-dir'?: string;
      'result-format'?: string;
      'detailed-coverage'?: boolean;
      synchronous?: boolean;
      json?: boolean;
      codeCoverage?: boolean;
    }
  ): Promise<RunResult> {
    if (options['output-dir']) {
      const jsonOutput = this.formatResultInJson(result);
      const outputDirConfig = this.buildOutputDirConfig(
        result,
        jsonOutput,
        options['output-dir'],
        options['result-format'] as Optional<ResultFormat>,
        options['detailed-coverage'] as boolean,
        options.synchronous
      );

      const testService = new TestService(this.connection);

      await testService.writeResultFiles(result, outputDirConfig, options['code-coverage'] as boolean);
    }

    try {
      if (result.summary && result.summary.outcome === ApexTestRunResultStatus.Failed) {
        process.exitCode = FAILURE_EXIT_CODE;
      }
      switch (options['result-format']) {
        case 'human':
          this.logHuman(result, options['detailed-coverage'] as boolean, options['output-dir']);
          break;
        case 'tap':
          this.logTap(result);
          break;
        case 'junit':
          this.logJUnit(result);
          break;
        case 'json':
          // when --json flag is specified, we should log CLI json format
          if (!options.json) {
            this.ux.styledJSON({
              status: process.exitCode,
              result: this.formatResultInJson(result),
            } as AnyJson);
          }
          break;
        default:
          this.logHuman(result, options['detailed-coverage'] as boolean, options['output-dir']);
      }
    } catch (e) {
      this.ux.styledJSON(result);
      throw messages.createError('testResultProcessErr', [(e as Error).message]);
    }

    return this.formatResultInJson(result);
  }
  /**
   * Builds output directory configuration with CLI format result files
   *
   * @param result Test results from async/sync test run
   * @param jsonOutput JSON CLI format of test results
   * @param outputDir Output directory for result files
   * @param resultFormat Result format for output files
   * @param detailedCoverage Boolean to control detailed coverage reporting
   * @param synchronous Whether the test run was synchronous
   * @returns Output directory configuration
   */
  // eslint-disable-next-line class-methods-use-this
  private buildOutputDirConfig(
    result: TestResult | TestRunIdResult,
    jsonOutput: RunResult | TestRunIdResult,
    outputDir: string,
    resultFormat: ResultFormat | undefined,
    detailedCoverage: boolean,
    synchronous = false
  ): OutputDirConfig {
    const outputDirConfig: OutputDirConfig = {
      dirPath: outputDir,
    };

    if ((result as TestResult).summary) {
      result = result as TestResult;
      jsonOutput = jsonOutput as RunResult;

      if (typeof resultFormat !== 'undefined' || synchronous) {
        outputDirConfig.fileInfos = [
          {
            filename: result.summary.testRunId ? `test-result-${result.summary.testRunId}.json` : 'test-result.json',
            content: jsonOutput,
          },
          ...(jsonOutput.coverage
            ? [
                {
                  filename: 'test-result-codecoverage.json',
                  content: jsonOutput.coverage?.coverage,
                },
              ]
            : []),
        ];
        outputDirConfig.resultFormats = [ResultFormat.junit];
      }

      if (typeof resultFormat === 'undefined' && synchronous) {
        resultFormat = ResultFormat.human;
      }

      switch (resultFormat) {
        case ResultFormat.tap:
          outputDirConfig.fileInfos?.push({
            filename: 'test-result.txt',
            content: new TapReporter().format(result),
          });
          outputDirConfig.resultFormats?.push(ResultFormat.tap);
          break;
        case ResultFormat.junit:
          outputDirConfig.fileInfos?.push({
            filename: 'test-result.xml',
            content: new JUnitReporter().format(result),
          });
          break;
        case ResultFormat.human:
          outputDirConfig.fileInfos?.push({
            filename: 'test-result.txt',
            content: new HumanReporter().format(result, detailedCoverage),
          });
          break;
        default:
          break;
      }
    }

    return outputDirConfig;
  }
  private formatResultInJson(result: TestResult): RunResult {
    try {
      const reporter = new JsonReporter();
      return reporter.format(result);
    } catch (e) {
      this.ux.styledJSON(result);
      throw messages.createError('testResultProcessErr', [(e as Error).message]);
    }
  }

  private logHuman(result: TestResult, detailedCoverage: boolean, outputDir?: string): void {
    if (outputDir) {
      this.ux.log(messages.getMessage('outputDirHint', [outputDir]));
    }
    const humanReporter = new HumanReporter();
    const output = humanReporter.format(result, detailedCoverage);
    this.ux.log(output);
  }

  private logTap(result: TestResult): void {
    const reporter = new TapReporter();
    const hint = this.formatReportHint(result);
    this.ux.log(reporter.format(result, [hint]));
  }

  private logJUnit(result: TestResult): void {
    const reporter = new JUnitReporter();
    this.ux.log(reporter.format(result));
  }

  private formatReportHint(result: TestResult): string {
    let reportArgs = `-i ${result.summary.testRunId}`;
    const username = this.connection?.getUsername();
    if (username) {
      reportArgs += ` -o ${username}`;
    }
    return messages.getMessage('apexTestReportFormatHint', [reportArgs]);
  }
}
