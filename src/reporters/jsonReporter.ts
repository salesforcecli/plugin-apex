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
import { ApexTestResultOutcome, TestResult } from '@salesforce/apex-node';
import { ApexTestRunResultStatus } from '@salesforce/apex-node/lib/src/tests/types.js';

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
};

type CliTestResult = {
  Id: string;
  QueueItemId: string;
  // TODO: in next major version change to string | null
  StackTrace: string;
  // TODO: in next major version change to string | null
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
  lines: Record<string, number>;
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

export class JsonReporter {
  public format(result: TestResult, includeCategory: boolean = false): RunResult {
    const returnObject: RunResult = {
      summary: {
        // result.summary contains more information than we want to return, so we'll specify each key we want to return instead of using ...
        failRate: result.summary.failRate,
        failing: result.summary.failing,
        hostname: result.summary.hostname,
        orgId: result.summary.orgId,
        outcome: result.summary.outcome as ApexTestRunResultStatus,
        passRate: result.summary.passRate,
        passing: result.summary.passing,
        skipped: result.summary.skipped,
        testRunId: result.summary.testRunId,
        testStartTime: result.summary.testStartTime,
        testsRan: result.summary.testsRan,
        userId: result.summary.userId,
        username: result.summary.username,
        commandTime: `${result.summary.commandTimeInMs} ms`,
        testExecutionTime: `${result.summary.testExecutionTimeInMs} ms`,
        testTotalTime: `${result.summary.testTotalTimeInMs} ms`,
      },
      tests: result.tests.map((test) => ({
        Id: test.id,
        QueueItemId: test.queueItemId,
        StackTrace: test.stackTrace as string,
        Message: test.message as string,
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
        ...(includeCategory ? { Category: test.category } : {}),
      })),
      ...(result.codecoverage
        ? {
            coverage: this.formatCoverage(result),
          }
        : {}),
    };

    if (result.summary.orgWideCoverage) {
      returnObject.summary.orgWideCoverage = result.summary.orgWideCoverage;
    }

    if (result.summary.testRunCoverage) {
      returnObject.summary.testRunCoverage = result.summary.testRunCoverage;
    }

    return returnObject;
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
        };
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
            });
          });
        }
      });
    }

    return formattedCov;
  }
}
