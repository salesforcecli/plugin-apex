/*
 * Copyright 2025, Salesforce, Inc.
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

import {
  HumanReporter,
  JUnitReporter,
  OutputDirConfig,
  ResultFormat,
  TapReporter,
  TestResult,
  TestRunIdResult,
  TestService,
} from '@salesforce/apex-node';
import { Ux } from '@salesforce/sf-plugins-core';
import { Connection, Messages } from '@salesforce/core';
import { Duration } from '@salesforce/kit';
import { JsonReporter, RunResult } from './jsonReporter.js';

const FAILURE_EXIT_CODE = 100;

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'runtest');

export class TestReporter {
  /**
   * Create a TestReporter that will format test results
   *
   * @param ux a new Ux instance based on if the command is in json mode
   * @param connection a connection to the org the tests are being run against - used for getting username for hints
   */
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
      'code-coverage'?: boolean;
      concise: boolean;
    }
  ): Promise<RunResult> {
    if (options['output-dir']) {
      const jsonOutput = this.formatResultInJson(result);
      const outputDirConfig = this.buildOutputDirConfig(
        result,
        jsonOutput,
        options['output-dir'],
        options['result-format'] as ResultFormat | undefined,
        Boolean(options['detailed-coverage']),
        options.concise,
        options.synchronous
      );

      const testService = new TestService(this.connection);

      await testService.writeResultFiles(result, outputDirConfig, options['code-coverage']);
    }

    try {
      if (result.summary && result.summary.outcome === 'Failed') {
        process.exitCode = FAILURE_EXIT_CODE;
      }
      switch (options['result-format']) {
        case 'human':
          this.logHuman(result, options['detailed-coverage'] as boolean, options['concise'], options['output-dir']);
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
            });
          }
          break;
        default:
          this.logHuman(result, options['detailed-coverage'] as boolean, options['concise'], options['output-dir']);
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
    concise: boolean,
    synchronous = false
  ): OutputDirConfig {
    const outputDirConfig: OutputDirConfig = {
      dirPath: outputDir,
    };

    if ('summary' in result) {
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
            content: new HumanReporter().format(result, detailedCoverage, concise),
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

  private logHuman(result: TestResult, detailedCoverage: boolean, concise: boolean, outputDir?: string): void {
    if (outputDir) {
      this.ux.log(messages.getMessage('outputDirHint', [outputDir]));
    }
    const humanReporter = new HumanReporter();
    const output = humanReporter.format(result, detailedCoverage, concise);
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
