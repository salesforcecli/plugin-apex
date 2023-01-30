/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { ApexTestResultData, ApexTestResultOutcome, TestResult } from '@salesforce/apex-node';
import {ApexTestRunResultStatus} from '@salesforce/apex-node/lib/src/tests/types';

export type RunResult = {
  summary: Summary;
  tests: CliTestResult[];
  coverage?: CliCoverageResult;
};

type Summary = {
  outcome: ApexTestRunResultStatus;
  testsRan: number;
  passing: number;
  failing: number;
  skipped: number;
  passRate: string;
  failRate: string;
  testStartTime: string;
  testExecutionTime: string;
  testTotalTime: string;
  commandTime: string;
  hostname: string;
  orgId: string;
  username: string;
  testRunId: string;
  userId: string;
  orgWideCoverage?: string;
  testRunCoverage?: string;
}

type CliTestResult = {
  Id: string;
  QueueItemId: string;
  StackTrace: string;
  Message: string;
  AsyncApexJobId: string;
  MethodName: string;
  Outcome: ApexTestResultOutcome;
  ApexClass: { Id: string; Name: string; NamespacePrefix: string };
  RunTime: number;
  FullName: string;
};

type ClassCoverage = {
  id: string;
  name: string;
  totalLines: number;
  lines: Record<string,number>;
  totalCovered: number;
  coveredPercent: number;
};

type PerClassCoverage = {
  ApexTestClass: {
    Id: string;
    Name: string;
  };
  Coverage?: { coveredLines: number[]; uncoveredLines: number[] };
  TestMethodName: string;
  NumLinesCovered: number;
  ApexClassOrTrigger: {
    Id: string;
    Name: string;
  };
  NumLinesUncovered: number;
};

type CliCoverageResult = {
  coverage: ClassCoverage[];
  records: PerClassCoverage[];
  summary: {
    totalLines?: number;
    coveredLines?: number;
    testRunCoverage?: string;
    orgWideCoverage?: string;
  };
};

const skippedProperties = ['skipRate', 'coveredLines', 'totalLines'];
const timeProperties = ['testExecutionTimeInMs', 'testTotalTimeInMs', 'commandTimeInMs'];

export class JsonReporter {
  public format(result: TestResult): RunResult {
    return {
      summary: this.formatSummary(result),
      tests: this.formatTestResults(result.tests),
      ...(result.codecoverage
        ? {
            coverage: this.formatCoverage(result),
          }
        : {}),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private formatSummary(testResult: TestResult): Summary {
    const summary = {};

    Object.entries(testResult.summary).forEach(([key, value]) => {
      if (skippedProperties.includes(key)) {
        return;
      }

      if (timeProperties.includes(key)) {
        key = key.replace('InMs', '');
        value = `${value} ms`;
      }

     return Object.assign(summary, { [key]: value });
    });

    return summary as Summary;
  }

  // eslint-disable-next-line class-methods-use-this
  private formatTestResults(testResults: ApexTestResultData[]): CliTestResult[] {
    return testResults.map((test) => ({
      Id: test.id,
      QueueItemId: test.queueItemId,
      StackTrace: test.stackTrace,
      Message: test.message,
      AsyncApexJobId: test.asyncApexJobId,
      MethodName: test.methodName,
      Outcome: test.outcome,
      ApexClass: {
        Id: test.apexClass.id,
        Name: test.apexClass.name,
        NamespacePrefix: test.apexClass.namespacePrefix,
      },
      RunTime: test.runTime,
      FullName: test.fullName,
    })) as CliTestResult[];
  }

  // eslint-disable-next-line class-methods-use-this
  private formatCoverage(testResult: TestResult): CliCoverageResult {
    const formattedCov: CliCoverageResult = {
      coverage: [],
      records: [],
      summary: {
        totalLines: testResult.summary.totalLines,
        coveredLines: testResult.summary.coveredLines,
        orgWideCoverage: testResult.summary.orgWideCoverage,
        testRunCoverage: testResult.summary.testRunCoverage,
      },
    };

    if (testResult.codecoverage) {
      formattedCov.coverage = testResult.codecoverage.map((cov) => {
        const lines: { [key: number]: number } = {};
        cov.coveredLines.forEach((covLine) => (lines[covLine] = 1));
        cov.uncoveredLines.forEach((uncovLine) => (lines[uncovLine] = 0));

        return {
          id: cov.apexId,
          name: cov.name,
          totalLines: cov.numLinesCovered + cov.numLinesUncovered,
          lines,
          totalCovered: cov.numLinesCovered,
          coveredPercent: parseInt(cov.percentage, 10),
        } as ClassCoverage;
      });

      testResult.tests.forEach((test) => {
        if (test.perClassCoverage) {
          test.perClassCoverage.forEach((perClassCov) => {
            formattedCov.records.push({
              ApexTestClass: { Id: test.id, Name: test.apexClass.name },
              ...(perClassCov.coverage ? { Coverage: perClassCov.coverage } : {}),
              TestMethodName: test.methodName,
              NumLinesCovered: perClassCov.numLinesCovered,
              ApexClassOrTrigger: {
                Id: perClassCov.apexClassOrTriggerId,
                Name: perClassCov.apexClassOrTriggerName,
              },
              NumLinesUncovered: perClassCov.numLinesUncovered,
            } as PerClassCoverage);
          });
        }
      });
    }

    return formattedCov;
  }
}
