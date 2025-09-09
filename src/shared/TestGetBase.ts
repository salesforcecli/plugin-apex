/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { TestService } from '@salesforce/apex-node';
import { Connection } from '@salesforce/core';
import { Ux } from '@salesforce/sf-plugins-core';
import { RunResult, TestReporter } from '../reporters/index.js';

export type TestGetBaseOptions = {
  connection: Connection;
  testRunId: string;
  codeCoverage?: boolean;
  outputDir?: string;
  resultFormat?: string;
  json?: boolean;
  detailedCoverage?: boolean;
  concise?: boolean;
  isUnifiedLogic?: boolean;
  testCategory?: string;
  jsonEnabled: boolean;
  additionalReportOptions?: Record<string, unknown>;
};

/**
 * Common logic for getting test results.
 */
export class TestGetBase {
  public static async execute(options: TestGetBaseOptions): Promise<RunResult> {
    const {
      connection,
      testRunId,
      codeCoverage,
      outputDir,
      resultFormat,
      json,
      detailedCoverage,
      concise,
      jsonEnabled,
      isUnifiedLogic
    } = options;

    const testService = new TestService(connection);
    const result = await testService.reportAsyncResults(testRunId, codeCoverage);

    const testReporter = new TestReporter(new Ux({ jsonEnabled }), connection);

    const reportOptions = {
      'output-dir': outputDir,
      'result-format': resultFormat,
      json,
      'code-coverage': codeCoverage,
      'detailed-coverage': detailedCoverage,
      concise: concise ?? false,
      isUnifiedLogic
    };

    return testReporter.report(result, reportOptions);
  }
}
