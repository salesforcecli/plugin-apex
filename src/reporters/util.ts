/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
  HumanReporter,
  JUnitReporter,
  OutputDirConfig,
  ResultFormat,
  TapReporter,
  TestResult,
  TestRunIdResult,
} from '@salesforce/apex-node';
import {RunResult} from './jsonReporter';

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
export function buildOutputDirConfig(
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
      case ResultFormat.json:
        outputDirConfig.fileInfos?.push({
          filename: 'test-result.json',
          content: result,
        });
        break;
      default:
        break;
    }
  }

  return outputDirConfig;
}
