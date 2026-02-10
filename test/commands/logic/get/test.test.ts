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
import { Connection, Org } from '@salesforce/core';
import sinon from 'sinon';
import { Ux, stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect, config } from 'chai';
import { TestService } from '@salesforce/apex-node';
import LogicTest from '../../../../src/commands/logic/get/test.js';
import {
  logicRunWithCoverage,
  logicRunWithFailures,
  logicTestRunSimple,
  logicTestRunSimpleResult,
  logicTestRunWithFailuresResult,
  testRunSimple,
} from '../../../testData.js';
import { TestReporter } from '../../../../src/reporters/testReporter.js';

config.truncateThreshold = 0;

let logStub: sinon.SinonStub;
let styledJsonStub: sinon.SinonStub;
let testReporterReportStub: sinon.SinonStub;

describe('logic:test:report', () => {
  let sandbox: sinon.SinonSandbox;
  let uxStub: ReturnType<typeof stubSfCommandUx>;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    uxStub = stubSfCommandUx(sandbox);
    logStub = sandbox.stub(Ux.prototype, 'log');
    styledJsonStub = sandbox.stub(Ux.prototype, 'styledJSON');
    sandbox.stub(Connection.prototype, 'getUsername').returns('test@example.com');

    sandbox.stub(Org, 'create').resolves({ getConnection: () => ({ getUsername: () => 'test@user.com' }) } as Org);
  });

  afterEach(() => {
    sandbox.restore();

    try {
      // the library writes to a directory, so we need to clean it up :(
      fs.rmSync('myDirectory', { recursive: true });
    } catch (e) {
      // do nothing
    }
  });

  describe('test category', () => {
    describe('test failures', () => {
      it('should return a success human format message with async and include the test category', async () => {
        sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(logicRunWithFailures);

        const result = await LogicTest.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'human']);

        expect(result).to.deep.equal(logicTestRunWithFailuresResult);
        expect(logStub.firstCall.args[0]).to.include('TEST NAME               CATEGORY');
        expect(logStub.firstCall.args[0]).to.include('ApexTests.testConfig  Apex');
        expect(logStub.firstCall.args[0]).to.include('Fail');
        expect(uxStub.log.callCount).to.equal(0);
      });

      it('should return a success json format message with async and include the test category', async () => {
        sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(logicRunWithFailures);
        const result = await LogicTest.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'json']);
        expect(result).to.deep.equal(logicTestRunWithFailuresResult);
        expect(styledJsonStub.firstCall.args[0]).to.deep.equal({ result: logicTestRunWithFailuresResult, status: 100 });
      });

      it('should return a success --json format message with sync and include the test category', async () => {
        sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(logicRunWithFailures);
        sandbox.stub(Org.prototype, 'getUsername').returns('test@user.com');
        const result = await LogicTest.run(['--test-run-id', '707xxxxxxxxxxxx', '--json']);
        expect(result).to.deep.equal(logicTestRunWithFailuresResult);
        expect(logStub.firstCall.args[0]).to.include('TEST NAME               CATEGORY');
        expect(styledJsonStub.notCalled).to.be.true;
      });

      it('should return a success human format with synchronous and include the test categorys', async () => {
        sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(logicRunWithFailures);
        await LogicTest.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'human']);
        expect(logStub.firstCall.args[0]).to.contain('Test Summary');
        expect(logStub.firstCall.args[0]).to.contain('Test Results');
        expect(logStub.firstCall.args[0]).to.not.contain('Apex Code Coverage by Class');
        expect(logStub.firstCall.args[0]).to.include('TEST NAME               CATEGORY');
      });

      it('should only display failed test with human format with concise flag and include the test categorys', async () => {
        sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(logicRunWithFailures);
        await LogicTest.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'human', '--concise']);
        expect(logStub.firstCall.args[0]).to.contain('Test Summary');
        expect(logStub.firstCall.args[0]).to.contain('Test Results');
        expect(logStub.firstCall.args[0]).to.contain('ApexTests.testConfig  Apex');
        expect(logStub.firstCall.args[0]).to.not.contain('MyPassingTest');
        expect(logStub.firstCall.args[0]).to.not.contain('Apex Code Coverage by Class');
        expect(logStub.firstCall.args[0]).to.include('TEST NAME               CATEGORY');
      });
    });

    describe('test success', () => {
      it('should return a success human format message with async and include the test categorys', async () => {
        sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(logicTestRunSimple);

        const result = await LogicTest.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'human']);

        expect(result).to.deep.equal(logicTestRunSimpleResult);
        expect(logStub.firstCall.args[0]).to.include('=== Test Summary');
        expect(logStub.firstCall.args[0]).to.include('=== Test Results');
        expect(logStub.firstCall.args[0]).to.include('Test Run Id          707xx0000AUS2gH');
        expect(logStub.firstCall.args[0]).to.include('TEST NAME               CATEGORY');
        expect(logStub.firstCall.args[0]).to.include('MyApexTests.testConfig  Apex      Pass              53');
      });

      it('should return a success json format message with async and include the test categorys', async () => {
        process.exitCode = 0;
        sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(logicTestRunSimple);
        const result = await LogicTest.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'json']);
        expect(result).to.deep.equal(logicTestRunSimpleResult);
        expect(styledJsonStub.firstCall.args[0]).to.deep.equal({ result: logicTestRunSimpleResult, status: 0 });
      });

      it('should return a success --json format message with sync and include the test categorys', async () => {
        sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(logicTestRunSimple);
        sandbox.stub(Org.prototype, 'getUsername').returns('test@user.com');
        const result = await LogicTest.run(['--test-run-id', '707xxxxxxxxxxxx', '--json']);
        expect(result).to.deep.equal(logicTestRunSimpleResult);
        expect(styledJsonStub.notCalled).to.be.true;
      });

      it('should return a success human format with synchronous and include the test categorys', async () => {
        sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(logicTestRunSimple);
        await LogicTest.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'human']);
        expect(logStub.firstCall.args[0]).to.contain('Test Summary');
        expect(logStub.firstCall.args[0]).to.contain('Test Results');
        expect(logStub.firstCall.args[0]).to.not.contain('Apex Code Coverage by Class');
        expect(logStub.firstCall.args[0]).to.include('TEST NAME               CATEGORY');
        expect(logStub.firstCall.args[0]).to.include('MyApexTests.testConfig  Apex      Pass              53');
      });

      it('should only display summary with human format and code coverage and concise parameters', async () => {
        sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(logicRunWithCoverage);
        await LogicTest.run([
          '--test-run-id',
          '707xxxxxxxxxxxx',
          '--result-format',
          'human',
          '--code-coverage',
          '--concise',
        ]);
        expect(logStub.firstCall.args[0]).to.contain('Test Summary');
        expect(logStub.firstCall.args[0]).to.not.contain('Test Results');
        expect(logStub.firstCall.args[0]).to.not.contain('Apex Code Coverage by Class');
        expect(logStub.firstCall.args[0]).to.not.contain('CATEGORY');
      });
    });
  });

  describe('isUnifiedLogic parameter', () => {
    it('should pass isUnifiedLogic parameter', async () => {
      testReporterReportStub = sandbox.stub(TestReporter.prototype, 'report');
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(testRunSimple);
      testReporterReportStub.resolves({ success: true });
      await LogicTest.run(['--test-run-id', '7071w00003woTsc', '--target-org', 'test@example.com']);

      expect(testReporterReportStub.calledOnce).to.be.true;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(testReporterReportStub.getCall(0).args[1].isUnifiedLogic).to.be.true;
    });
  });
});
