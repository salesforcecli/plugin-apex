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
import fs from 'node:fs';
import { Connection, Org } from '@salesforce/core';
import sinon from 'sinon';
import { Ux, stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect, config } from 'chai';
import { TestService } from '@salesforce/apex-node';
import Test from '../../../../src/commands/apex/get/test.js';
import {
  runWithCoverage,
  runWithFailureAndSuccess,
  runWithFailures,
  testRunSimple,
  testRunSimpleResult,
  testRunWithFailuresResult,
} from '../../../testData.js';
import { TestReporter } from '../../../../src/reporters/testReporter.js';

config.truncateThreshold = 0;

let logStub: sinon.SinonStub;
let styledJsonStub: sinon.SinonStub;
let testReporterReportStub: sinon.SinonStub;

describe('apex:test:report', () => {
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

  describe('test failures', () => {
    it('should return a success human format message with async', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(runWithFailures);

      const result = await Test.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'human']);

      expect(result).to.deep.equal(testRunWithFailuresResult);
      expect(logStub.firstCall.args[0]).to.include('=== Test Summary');
      expect(logStub.firstCall.args[0]).to.include('=== Test Results');
      expect(logStub.firstCall.args[0]).to.include('Test Run Id          707xx0000AUS2gH');
      expect(logStub.firstCall.args[0]).to.include('MyApexTests.testConfig  Fail');
      expect(uxStub.log.callCount).to.equal(0);
    });

    it('should return a success tap format message with async', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(runWithFailures);

      const result = await Test.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'tap']);

      expect(result).to.deep.equal(testRunWithFailuresResult);
      expect(logStub.firstCall.args[0]).to.include('1..1');
      expect(logStub.firstCall.args[0]).to.include('ok 1 MyApexTests.testConfig');
      expect(logStub.firstCall.args[0]).to.include('# Run "sf apex get test');
    });

    it('should return a success junit format message with async', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(runWithFailures);
      const result = await Test.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'junit']);
      expect(result).to.deep.equal(testRunWithFailuresResult);
      expect(logStub.firstCall.args[0]).to.include('<property name="failRate" value="50%"/>');
      expect(logStub.firstCall.args[0]).to.include('<property name="outcome" value="Failed"/>');
      expect(logStub.firstCall.args[0]).to.include('<failure message=""><![CDATA[Error running test]]></failure>');
    });

    it('should return a success json format message with async', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(runWithFailures);
      const result = await Test.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'json']);
      expect(result).to.deep.equal(testRunWithFailuresResult);
      expect(styledJsonStub.firstCall.args[0]).to.deep.equal({ result: testRunWithFailuresResult, status: 100 });
    });

    it('should return a success --json format message with sync', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(runWithFailures);
      sandbox.stub(Org.prototype, 'getUsername').returns('test@user.com');
      const result = await Test.run(['--test-run-id', '707xxxxxxxxxxxx', '--json']);
      expect(result).to.deep.equal(testRunWithFailuresResult);
      expect(styledJsonStub.notCalled).to.be.true;
    });

    it('should return a success human format with synchronous', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(runWithFailures);
      await Test.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'human']);
      expect(logStub.firstCall.args[0]).to.contain('Test Summary');
      expect(logStub.firstCall.args[0]).to.contain('Test Results');
      expect(logStub.firstCall.args[0]).to.not.contain('Apex Code Coverage by Class');
    });

    it('should warn when using --outputdir', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(runWithFailures);
      await Test.run(['--output-dir', 'myDirectory', '--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'human']);
      expect(logStub.firstCall.args[0]).to.contain('Test result files written to myDirectory');
    });

    it('should only display failed test with human format with concise flag', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(runWithFailureAndSuccess);
      await Test.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'human', '--concise']);
      expect(logStub.firstCall.args[0]).to.contain('Test Summary');
      expect(logStub.firstCall.args[0]).to.contain('Test Results');
      expect(logStub.firstCall.args[0]).to.contain('MyFailingTest');
      expect(logStub.firstCall.args[0]).to.not.contain('MyPassingTest');
      expect(logStub.firstCall.args[0]).to.not.contain('Apex Code Coverage by Class');
    });
  });

  describe('test success', () => {
    it('should return a success human format message with async', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(testRunSimple);

      const result = await Test.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'human']);

      expect(result).to.deep.equal(testRunSimpleResult);
      expect(logStub.firstCall.args[0]).to.include('=== Test Summary');
      expect(logStub.firstCall.args[0]).to.include('=== Test Results');
      expect(logStub.firstCall.args[0]).to.include('Test Run Id          707xx0000AUS2gH');
      expect(logStub.firstCall.args[0]).to.include('MyApexTests.testConfig  Pass              53');
    });

    it('should return a success tap format message with async', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(testRunSimple);

      const result = await Test.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'tap']);

      expect(result).to.deep.equal(testRunSimpleResult);
      expect(logStub.firstCall.args[0]).to.include('1..1');
      expect(logStub.firstCall.args[0]).to.include('ok 1 MyApexTests.testConfig');
      expect(logStub.firstCall.args[0]).to.include('# Run "sf apex get test');
    });

    it('should return a success junit format message with async', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(testRunSimple);
      const result = await Test.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'junit']);
      expect(result).to.deep.equal(testRunSimpleResult);
      expect(logStub.firstCall.args[0]).to.contain('<testcase name="testConfig" classname="MyApexTests" time="0.05">');
      expect(logStub.firstCall.args[0]).to.contain('<property name="testsRan" value="1"/>');
    });

    it('should return a success json format message with async', async () => {
      process.exitCode = 0;
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(testRunSimple);
      const result = await Test.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'json']);
      expect(result).to.deep.equal(testRunSimpleResult);
      expect(styledJsonStub.firstCall.args[0]).to.deep.equal({ result: testRunSimpleResult, status: 0 });
    });

    it('should return a success --json format message with sync', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(testRunSimple);
      sandbox.stub(Org.prototype, 'getUsername').returns('test@user.com');
      const result = await Test.run(['--test-run-id', '707xxxxxxxxxxxx', '--json']);
      expect(result).to.deep.equal(testRunSimpleResult);
      expect(styledJsonStub.notCalled).to.be.true;
    });

    it('should return a success human format with synchronous', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(testRunSimple);
      await Test.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'human']);
      expect(logStub.firstCall.args[0]).to.contain('Test Summary');
      expect(logStub.firstCall.args[0]).to.contain('Test Results');
      expect(logStub.firstCall.args[0]).to.not.contain('Apex Code Coverage by Class');
    });

    it('should warn when using --outputdir', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(testRunSimple);
      await Test.run(['--output-dir', 'myDirectory', '--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'human']);
      expect(logStub.firstCall.args[0]).to.contain('Test result files written to myDirectory');
    });

    it('should only display summary with human format and code coverage and concise parameters', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(runWithCoverage);
      await Test.run(['--test-run-id', '707xxxxxxxxxxxx', '--result-format', 'human', '--code-coverage', '--concise']);
      expect(logStub.firstCall.args[0]).to.contain('Test Summary');
      expect(logStub.firstCall.args[0]).to.not.contain('Test Results');
      expect(logStub.firstCall.args[0]).to.not.contain('Apex Code Coverage by Class');
    });
  });

  describe('isUnifiedLogic parameter', () => {
    it('should NOT pass isUnifiedLogic parameter', async () => {
    testReporterReportStub = sandbox.stub(TestReporter.prototype, 'report');
    sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(testRunSimple);
    testReporterReportStub.resolves({ success: true });
      await Test.run(['--test-run-id', '7071w00003woTsc', '--target-org', 'test@example.com']);

      expect(testReporterReportStub.calledOnce).to.be.true;      
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(testReporterReportStub.getCall(0).args[1].isUnifiedLogic).to.be.undefined;
    });
  });
});
