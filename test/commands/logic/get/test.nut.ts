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
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect, config } from 'chai';
import { TestRunIdResult } from '@salesforce/apex-node/lib/src/tests/types.js';
import { RunResult } from '../../../../src/reporters/index.js';
import { setupUnifiedFrameworkProject } from '../testHelper.js';

config.truncateThreshold = 0;

describe('logic get test', () => {
  let session: TestSession;
  let testRunId: string | undefined;

  before(async () => {
    session = await setupUnifiedFrameworkProject();

    // Run tests to get a test run ID for subsequent get operations
    testRunId = execCmd<TestRunIdResult>('logic:run:test --test-level RunLocalTests --json', {
      ensureExitCode: 0,
    }).jsonOutput?.result.testRunId.trim();

    expect(testRunId).to.be.a('string');
    expect(testRunId).to.match(/^707/); // Test run IDs start with 707
  });

  after(async () => {
    await session?.clean();
  });

  describe('basic functionality', () => {
    it('should get test results with default format', async () => {
      const result = execCmd(`logic:get:test --test-run-id ${testRunId}`, { ensureExitCode: 0 });
      const output = result.shellOutput.stdout;

      // Verify basic output structure
      expect(output).to.include('Test Results');
      expect(output).to.include('Outcome');
      expect(output).to.include('CATEGORY');
      expect(output).to.include('Apex');
      expect(output).to.include('Flow');
    });

    it('should get test results in JSON format', async () => {
      const result = execCmd<RunResult>(`logic:get:test --test-run-id ${testRunId} --json`, {
        ensureExitCode: 0,
      });

      const jsonResult = result.jsonOutput?.result;
      expect(jsonResult).to.be.an('object');
      expect(jsonResult).to.have.property('summary');
      expect(jsonResult?.summary).to.have.property('outcome');
      expect(jsonResult?.summary).to.have.property('testsRan');
      expect(jsonResult?.tests.length).to.be.greaterThan(0);
      jsonResult!.tests.forEach((test) => {
        expect(test).to.have.property('Category');
      });
    });

    it('should get test results with code coverage', async () => {
      const result = execCmd(`logic:get:test --test-run-id ${testRunId} --code-coverage`, {
        ensureExitCode: 0,
      });
      const output = result.shellOutput.stdout;
      // Verify code coverage information is included
      expect(output).to.include('Code Coverage');
    });
  });

  describe('result formats', () => {
    it('should output in JSON format', async () => {
      const result = execCmd(`logic:get:test --test-run-id ${testRunId} --result-format json`, {
        ensureExitCode: 0,
      });
      const output = result.shellOutput.stdout;

      // Should be valid JSON
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
      expect(() => JSON.parse(output)).to.not.throw();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const jsonOutput = JSON.parse(output);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(jsonOutput?.result).to.have.property('summary');
    });
  });

  describe('code coverage options', () => {
    it('should include code coverage in JSON format', async () => {
      const result = execCmd<RunResult>(`logic:get:test --test-run-id ${testRunId} --code-coverage --json`, {
        ensureExitCode: 0,
      });

      const jsonResult = result.jsonOutput?.result;
      expect(jsonResult).to.have.property('coverage');
    });
  });
});
