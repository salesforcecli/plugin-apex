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

import fs from 'node:fs';
import { Connection } from '@salesforce/core';
import sinon from 'sinon';
import { Ux } from '@salesforce/sf-plugins-core';
import { expect, config } from 'chai';
import { ApexTestResultOutcome, HumanReporter, TestResult } from '@salesforce/apex-node';
import { TestReporter } from '../../src/reporters/testReporter.js';
import { isFailedOutcome } from '../../src/reporters/jsonReporter.js';
import { runWithCoverage, runWithFailureAndSuccess, testRunSimple } from '../testData.js';

config.truncateThreshold = 0;

describe('TestReporter - isUnifiedLogic parameter', () => {
  let sandbox: sinon.SinonSandbox;
  let testReporter: TestReporter;
  let connection: Connection;
  let ux: Ux;
  let humanReporterFormatStub: sinon.SinonStub;
  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Create mocks
    connection = { getUsername: () => 'test@example.com' } as Connection;
    ux = new Ux({ jsonEnabled: false });

    // Stub methods
    humanReporterFormatStub = sandbox.stub(HumanReporter.prototype, 'format');
    humanReporterFormatStub.returns('Mocked human report output');

    sandbox.stub(ux, 'log');

    testReporter = new TestReporter(ux, connection);
  });

  afterEach(() => {
    sandbox.restore();

    // Clean up any test directories
    try {
      fs.rmSync('test-output-dir', { recursive: true });
    } catch (e) {
      // Ignore if directory doesn't exist
    }
  });

  describe('human format reporting', () => {
    it('should pass isUnifiedLogic=true to HumanReporter', async () => {
      const options = {
        'result-format': 'human',
        'code-coverage': false,
        'detailed-coverage': false,
        concise: false,
        isUnifiedLogic: true,
      };

      await testReporter.report(testRunSimple, options);

      expect(humanReporterFormatStub.calledOnce).to.be.true;
      const formatArgs = humanReporterFormatStub.getCall(0).args;

      // Verify the parameters: format(result, detailedCoverage, concise, isUnifiedLogic)
      expect(formatArgs[0]).to.equal(testRunSimple);
      expect(formatArgs[1]).to.be.false; // detailedCoverage
      expect(formatArgs[2]).to.be.false; // concise
      expect(formatArgs[3]).to.be.true; // isUnifiedLogic
    });

    it('should pass isUnifiedLogic=undefined to HumanReporter when not specified', async () => {
      const options = {
        'result-format': 'human',
        'code-coverage': false,
        'detailed-coverage': false,
        concise: false,
        // isUnifiedLogic not specified
      };

      await testReporter.report(testRunSimple, options);

      expect(humanReporterFormatStub.calledOnce).to.be.true;
      const formatArgs = humanReporterFormatStub.getCall(0).args;

      expect(formatArgs[3]).to.be.undefined; // isUnifiedLogic should be undefined
    });

    it('should pass isUnifiedLogic=false explicitly', async () => {
      const options = {
        'result-format': 'human',
        'code-coverage': false,
        'detailed-coverage': false,
        concise: false,
        isUnifiedLogic: false,
      };

      await testReporter.report(testRunSimple, options);

      expect(humanReporterFormatStub.calledOnce).to.be.true;
      const formatArgs = humanReporterFormatStub.getCall(0).args;

      expect(formatArgs[3]).to.be.false; // isUnifiedLogic should be false
    });
  });

  describe('output directory with isUnifiedLogic', () => {
    it('should pass isUnifiedLogic to HumanReporter when writing to output directory', async () => {
      const options = {
        'result-format': 'human',
        'output-dir': 'test-output-dir',
        'code-coverage': false,
        'detailed-coverage': true,
        concise: false,
        isUnifiedLogic: true,
      };

      await testReporter.report(testRunSimple, options);

      // HumanReporter should be called twice: once for file output, once for console output
      expect(humanReporterFormatStub.calledTwice).to.be.true;

      // Check the first call (for file output via buildOutputDirConfig)
      const firstCallArgs = humanReporterFormatStub.getCall(0).args;

      // Check the second call (for console output via logHuman)
      const secondCallArgs = humanReporterFormatStub.getCall(1).args;

      // Both calls should have isUnifiedLogic=true
      expect(firstCallArgs[3]).to.be.true; // isUnifiedLogic in first call
      expect(secondCallArgs[3]).to.be.true; // isUnifiedLogic in second call

      // Verify other parameters in first call
      expect(firstCallArgs[1]).to.be.true; // detailedCoverage
      expect(firstCallArgs[2]).to.be.false; // concise
    });

    it('should create output directory with test-result.txt containing formatted output', async () => {
      const expectedOutput = 'Test output with unified logic formatting';
      humanReporterFormatStub.returns(expectedOutput);

      const options = {
        'result-format': 'human',
        'output-dir': 'test-output-dir',
        'code-coverage': false,
        'detailed-coverage': false,
        concise: false,
        isUnifiedLogic: true,
      };

      await testReporter.report(testRunSimple, options);

      // Verify directory and file were created
      expect(fs.existsSync('test-output-dir')).to.be.true;
      expect(fs.existsSync('test-output-dir/test-result.txt')).to.be.true;

      // Verify file content
      const fileContent = fs.readFileSync('test-output-dir/test-result.txt', 'utf8');
      expect(fileContent).to.equal(expectedOutput);
    });
  });

  describe('backward compatibility', () => {
    it('should work without isUnifiedLogic parameter (existing behavior)', async () => {
      const options = {
        'result-format': 'human',
        'code-coverage': true,
        'detailed-coverage': false,
        concise: true,
        // No isUnifiedLogic specified - should work as before
      };

      await testReporter.report(testRunSimple, options);

      expect(humanReporterFormatStub.calledOnce).to.be.true;
      const formatArgs = humanReporterFormatStub.getCall(0).args;

      expect(formatArgs[3]).to.be.undefined; // isUnifiedLogic should be undefined
    });
  });
});

describe('TestReporter - concise JSON output', () => {
  let sandbox: sinon.SinonSandbox;
  let testReporter: TestReporter;
  let ux: Ux;
  let originalExitCode: number | undefined;

  const mixedOutcomes = {
    ...runWithFailureAndSuccess,
    summary: {
      ...runWithFailureAndSuccess.summary,
      failRate: '50%',
      testsRan: 4,
      passing: 1,
      failing: 2,
      skipped: 1,
      passRate: '25%',
      skipRate: '25%',
    },
    tests: [
      ...runWithFailureAndSuccess.tests,
      {
        ...runWithFailureAndSuccess.tests[1],
        fullName: 'MyCompileFailingTest.testConfig',
        outcome: ApexTestResultOutcome.CompileFail,
      },
      {
        ...runWithFailureAndSuccess.tests[1],
        fullName: 'MySkippedTest.testConfig',
        outcome: ApexTestResultOutcome.Skip,
      },
    ],
  } as TestResult;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    originalExitCode = process.exitCode;
    ux = new Ux({ jsonEnabled: false });
    testReporter = new TestReporter(ux, { getUsername: () => 'test@example.com' } as Connection);
  });

  afterEach(() => {
    process.exitCode = originalExitCode;
    sandbox.restore();

    try {
      fs.rmSync('test-output-dir', { recursive: true });
    } catch (e) {
      // Ignore if directory doesn't exist
    }
  });

  it('returns only failures for global JSON while preserving summary and coverage', async () => {
    const resultWithCoverage = {
      ...runWithCoverage,
      tests: [...runWithCoverage.tests, runWithFailureAndSuccess.tests[0]],
    } as TestResult;
    const full = await testReporter.report(resultWithCoverage, {
      'result-format': 'json',
      concise: false,
      json: true,
    });
    const concise = await testReporter.report(resultWithCoverage, {
      'result-format': 'json',
      concise: true,
      json: true,
    });

    expect(concise.tests.map((test) => test.Outcome)).to.deep.equal([ApexTestResultOutcome.Fail]);
    expect(concise.summary).to.deep.equal(full.summary);
    expect(concise.coverage).to.deep.equal(full.coverage);
  });

  it('leaves default JSON output unchanged', async () => {
    const result = await testReporter.report(mixedOutcomes, {
      'result-format': 'json',
      concise: false,
      json: true,
    });

    expect(result.tests).to.have.length(mixedOutcomes.tests.length);
  });

  it('passes only failures to styledJSON', async () => {
    const styledJSON = sandbox.stub(ux, 'styledJSON');

    await testReporter.report(mixedOutcomes, {
      'result-format': 'json',
      concise: true,
      json: false,
    });

    const output = styledJSON.firstCall.args[0] as { result: { tests: Array<{ Outcome: ApexTestResultOutcome }> } };
    expect(output.result.tests.map((test) => test.Outcome)).to.deep.equal([
      ApexTestResultOutcome.Fail,
      ApexTestResultOutcome.CompileFail,
    ]);
  });

  it('returns a stable empty tests array when all tests pass', async () => {
    const result = await testReporter.report(testRunSimple, {
      'result-format': 'json',
      concise: true,
      json: true,
    });

    expect(result.tests).to.deep.equal([]);
    expect(result.summary.failing).to.equal(0);
  });

  it('matches the HumanReporter failure predicate', () => {
    expect(
      [
        ApexTestResultOutcome.Pass,
        ApexTestResultOutcome.Fail,
        ApexTestResultOutcome.CompileFail,
        ApexTestResultOutcome.Skip,
      ].filter(isFailedOutcome)
    ).to.deep.equal([ApexTestResultOutcome.Fail, ApexTestResultOutcome.CompileFail]);
  });

  it('keeps output-dir JSON files complete', async () => {
    await testReporter.report(mixedOutcomes, {
      'output-dir': 'test-output-dir',
      'result-format': 'json',
      concise: true,
      json: true,
    });

    const fileContent = fs.readFileSync(`test-output-dir/test-result-${mixedOutcomes.summary.testRunId}.json`, 'utf8');
    const output = JSON.parse(fileContent) as { tests: unknown[] };
    expect(output.tests).to.have.length(mixedOutcomes.tests.length);
  });
});
