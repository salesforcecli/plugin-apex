/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { resolve } from 'path';
import * as fs from 'fs';
import { Messages, Org } from '@salesforce/core';
import { createSandbox, SinonSandbox } from 'sinon';
import { Ux } from '@salesforce/sf-plugins-core';
import { Config } from '@oclif/core';
import { expect } from 'chai';
import { TestService } from '@salesforce/apex-node';
import Test from '../../../../src/commands/apex/run/test';
import {
  runWithCoverage,
  runWithFailures,
  testRunSimple,
  testRunSimpleResult,
  testRunWithFailuresResult,
} from '../../../testData';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'runtest');

let logStub: sinon.SinonStub;
let styledJsonStub: sinon.SinonStub;

describe('apex:test:run', () => {
  let sandbox: SinonSandbox;
  const config = new Config({ root: resolve(__dirname, '../../package.json') });
  // give it an sfdx bin for now
  config.bin = 'sfdx';

  beforeEach(async () => {
    sandbox = createSandbox();
    logStub = sandbox.stub(Ux.prototype, 'log');
    styledJsonStub = sandbox.stub(Ux.prototype, 'styledJSON');
    sandbox
      .stub(Org, 'create')
      // @ts-ignore
      .resolves({ getConnection: () => ({ getUsername: () => 'test@user.com' }) });
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
      sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves(runWithFailures);

      const result = await new Test(['--tests', 'MyApexTests', '--result-format', 'human'], config).run();

      expect(result).to.deep.equal(testRunWithFailuresResult);
      expect(logStub.firstCall.args[0]).to.include('=== Test Summary');
      expect(logStub.firstCall.args[0]).to.include('=== Test Results');
      expect(logStub.firstCall.args[0]).to.include('Test Run Id          707xx0000AUS2gH');
      expect(logStub.firstCall.args[0]).to.include('MyApexTests.testConfig  Fail');
    });

    it('should return a success tap format message with async', async () => {
      sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves(runWithFailures);

      const result = await new Test(['--tests', 'MyApexTests', '--result-format', 'tap'], config).run();

      expect(result).to.deep.equal(testRunWithFailuresResult);
      expect(logStub.firstCall.args[0]).to.include('1..1');
      expect(logStub.firstCall.args[0]).to.include('ok 1 MyApexTests.testConfig');
      expect(logStub.firstCall.args[0]).to.include('# Run "sfdx apex get test -i 707');
    });

    it('should return a success junit format message with async', async () => {
      sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves(runWithFailures);
      const result = await new Test(['--tests', 'MyApexTests', '--result-format', 'junit'], config).run();
      expect(result).to.deep.equal(testRunWithFailuresResult);
      expect(logStub.firstCall.args[0]).to.include('<property name="failRate" value="50%"/>');
      expect(logStub.firstCall.args[0]).to.include('<property name="outcome" value="Failed"/>');
      expect(logStub.firstCall.args[0]).to.include('<failure message=""><![CDATA[Error running test]]></failure>');
    });

    it('should return a success json format message with async', async () => {
      sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves(runWithFailures);
      const result = await new Test(['--tests', 'MyApexTests', '--result-format', 'json'], config).run();
      expect(result).to.deep.equal(testRunWithFailuresResult);
      expect(styledJsonStub.firstCall.args[0]).to.deep.equal({ result: testRunWithFailuresResult, status: 100 });
    });

    it('should return a success --json format message with async', async () => {
      sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves({ testRunId: '707xx0000AUS2gH' });
      const result = await new Test(['--tests', 'MyApexTests', '--json'], config).run();
      expect(result).to.deep.equal({ testRunId: '707xx0000AUS2gH' });
      expect(styledJsonStub.notCalled).to.be.true;
    });

    it('should return a success --json format message with sync', async () => {
      sandbox.stub(TestService.prototype, 'runTestSynchronous').resolves(runWithFailures);

      const result = await new Test(['--tests', 'MyApexTests', '--json', '--synchronous'], config).run();
      expect(result).to.deep.equal(testRunWithFailuresResult);
      expect(styledJsonStub.notCalled).to.be.true;
    });

    it('should return a success human format with synchronous', async () => {
      sandbox.stub(TestService.prototype, 'runTestSynchronous').resolves(runWithFailures);
      await new Test(['--tests', 'MyApexTests', '--result-format', 'human', '--synchronous'], config).run();
      expect(logStub.firstCall.args[0]).to.contain('Test Summary');
      expect(logStub.firstCall.args[0]).to.contain('Test Results');
      expect(logStub.firstCall.args[0]).to.not.contain('Apex Code Coverage by Class');
    });

    it('will build the sync correct payload', async () => {
      const buildPayloadSpy = sandbox.spy(TestService.prototype, 'buildSyncPayload');
      const runTestSynchronousSpy = sandbox.stub(TestService.prototype, 'runTestSynchronous').resolves(runWithFailures);
      await new Test(
        [
          '--class-names',
          'myApex',
          '--synchronous',
          '--code-coverage',
          '--result-format',
          'human',
          '--test-level',
          'RunSpecifiedTests',
        ],
        config
      ).run();
      expect(buildPayloadSpy.calledOnce).to.be.true;
      expect(runTestSynchronousSpy.calledOnce).to.be.true;
      expect(buildPayloadSpy.firstCall.args).to.deep.equal(['RunSpecifiedTests', undefined, 'myApex']);
      expect(runTestSynchronousSpy.firstCall.args[0]).to.deep.equal({
        skipCodeCoverage: false,
        testLevel: 'RunSpecifiedTests',
        tests: [
          {
            className: 'myApex',
          },
        ],
      });
    });

    it('will build the async correct payload', async () => {
      const buildPayloadSpy = sandbox.spy(TestService.prototype, 'buildAsyncPayload');
      const runTestSynchronousSpy = sandbox
        .stub(TestService.prototype, 'runTestAsynchronous')
        .resolves(runWithCoverage);
      await new Test(
        ['--class-names', 'myApex', '--code-coverage', '--result-format', 'human', '--test-level', 'RunSpecifiedTests'],
        config
      ).run();
      expect(buildPayloadSpy.calledOnce).to.be.true;
      expect(runTestSynchronousSpy.calledOnce).to.be.true;
      expect(buildPayloadSpy.firstCall.args).to.deep.equal(['RunSpecifiedTests', undefined, 'myApex', undefined]);
      expect(runTestSynchronousSpy.firstCall.args[0]).to.deep.equal({
        skipCodeCoverage: false,
        testLevel: 'RunSpecifiedTests',
        tests: [
          {
            className: 'myApex',
          },
        ],
      });
    });

    it('will build the async correct payload no code coverage', async () => {
      sandbox.stub(Org.prototype, 'getUsername').resolves('test@example.com');
      const buildPayloadSpy = sandbox.spy(TestService.prototype, 'buildAsyncPayload');
      const runTestSynchronousSpy = sandbox
        .stub(TestService.prototype, 'runTestAsynchronous')
        .resolves(runWithFailures);
      await new Test(['--class-names', 'myApex', '--test-level', 'RunSpecifiedTests'], config).run();
      expect(buildPayloadSpy.calledOnce).to.be.true;
      expect(runTestSynchronousSpy.calledOnce).to.be.true;
      expect(buildPayloadSpy.firstCall.args).to.deep.equal(['RunSpecifiedTests', undefined, 'myApex', undefined]);
      expect(runTestSynchronousSpy.firstCall.args[0]).to.deep.equal({
        skipCodeCoverage: true,
        testLevel: 'RunSpecifiedTests',
        tests: [
          {
            className: 'myApex',
          },
        ],
      });
    });

    it('will build the sync correct payload no code coverage', async () => {
      sandbox.stub(Org.prototype, 'getUsername').resolves('test@example.com');
      const buildPayloadSpy = sandbox.spy(TestService.prototype, 'buildSyncPayload');
      const runTestSynchronousSpy = sandbox.stub(TestService.prototype, 'runTestSynchronous').resolves(runWithFailures);
      await new Test(['--class-names', 'myApex', '--synchronous', '--test-level', 'RunSpecifiedTests'], config).run();
      expect(buildPayloadSpy.calledOnce).to.be.true;
      expect(runTestSynchronousSpy.calledOnce).to.be.true;
      expect(buildPayloadSpy.firstCall.args).to.deep.equal(['RunSpecifiedTests', undefined, 'myApex']);
      expect(runTestSynchronousSpy.firstCall.args[0]).to.deep.equal({
        skipCodeCoverage: true,
        testLevel: 'RunSpecifiedTests',
        tests: [
          {
            className: 'myApex',
          },
        ],
      });
    });
  });

  describe('test success', () => {
    it('should return a success human format message with async', async () => {
      sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves(testRunSimple);

      const result = await new Test(['--tests', 'MyApexTests', '--result-format', 'human'], config).run();

      expect(result).to.deep.equal(testRunSimpleResult);
      expect(logStub.firstCall.args[0]).to.include('=== Test Summary');
      expect(logStub.firstCall.args[0]).to.include('=== Test Results');
      expect(logStub.firstCall.args[0]).to.include('Test Run Id          707xx0000AUS2gH');
      expect(logStub.firstCall.args[0]).to.include('MyApexTests.testConfig  Pass              53');
    });

    it('should return a success tap format message with async', async () => {
      sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves(testRunSimple);

      const result = await new Test(['--tests', 'MyApexTests', '--result-format', 'tap'], config).run();

      expect(result).to.deep.equal(testRunSimpleResult);
      expect(logStub.firstCall.args[0]).to.include('1..1');
      expect(logStub.firstCall.args[0]).to.include('ok 1 MyApexTests.testConfig');
      expect(logStub.firstCall.args[0]).to.include('# Run "sfdx apex get test -i 707');
    });

    it('should return a success junit format message with async', async () => {
      sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves(testRunSimple);
      const result = await new Test(['--tests', 'MyApexTests', '--result-format', 'junit'], config).run();
      expect(result).to.deep.equal(testRunSimpleResult);
      expect(logStub.firstCall.args[0]).to.contain('<testcase name="testConfig" classname="MyApexTests" time="0.05">');
      expect(logStub.firstCall.args[0]).to.contain('<property name="testsRan" value="1"/>');
    });

    it('should return a success json format message with async', async () => {
      process.exitCode = 0;
      sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves(testRunSimple);
      const result = await new Test(['--tests', 'MyApexTests', '--result-format', 'json'], config).run();
      expect(result).to.deep.equal(testRunSimpleResult);
      expect(styledJsonStub.firstCall.args[0]).to.deep.equal({ result: testRunSimpleResult, status: 0 });
    });

    it('should return a success --json format message with async', async () => {
      sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves({ testRunId: '707xx0000AUS2gH' });
      sandbox.stub(Org.prototype, 'getUsername').returns('test@user.com');
      const result = await new Test(['--tests', 'MyApexTests', '--json'], config).run();
      expect(result).to.deep.equal({ testRunId: '707xx0000AUS2gH' });
      expect(styledJsonStub.notCalled).to.be.true;
    });

    it('should return a success --json format message with sync', async () => {
      sandbox.stub(TestService.prototype, 'runTestSynchronous').resolves(testRunSimple);

      const result = await new Test(['--tests', 'MyApexTests', '--json', '--synchronous'], config).run();
      expect(result).to.deep.equal(testRunSimpleResult);
      expect(styledJsonStub.notCalled).to.be.true;
    });

    it('should return a success human format with synchronous', async () => {
      sandbox.stub(TestService.prototype, 'runTestSynchronous').resolves(testRunSimple);
      await new Test(['--tests', 'MyApexTests', '--result-format', 'human', '--synchronous'], config).run();
      expect(logStub.firstCall.args[0]).to.contain('Test Summary');
      expect(logStub.firstCall.args[0]).to.contain('Test Results');
      expect(logStub.firstCall.args[0]).to.not.contain('Apex Code Coverage by Class');
    });

    it('will build the sync correct payload', async () => {
      const buildPayloadSpy = sandbox.spy(TestService.prototype, 'buildSyncPayload');
      const runTestSynchronousSpy = sandbox.stub(TestService.prototype, 'runTestSynchronous').resolves(runWithCoverage);
      await new Test(
        [
          '--class-names',
          'myApex',
          '--synchronous',
          '--code-coverage',
          '--result-format',
          'human',
          '--test-level',
          'RunSpecifiedTests',
        ],
        config
      ).run();
      expect(buildPayloadSpy.calledOnce).to.be.true;
      expect(runTestSynchronousSpy.calledOnce).to.be.true;
      expect(buildPayloadSpy.firstCall.args).to.deep.equal(['RunSpecifiedTests', undefined, 'myApex']);
      expect(runTestSynchronousSpy.firstCall.args[0]).to.deep.equal({
        skipCodeCoverage: false,
        testLevel: 'RunSpecifiedTests',
        tests: [
          {
            className: 'myApex',
          },
        ],
      });
    });

    it('will build the async correct payload', async () => {
      const buildPayloadSpy = sandbox.spy(TestService.prototype, 'buildAsyncPayload');
      const runTestSynchronousSpy = sandbox
        .stub(TestService.prototype, 'runTestAsynchronous')
        .resolves(runWithCoverage);
      await new Test(
        ['--class-names', 'myApex', '--code-coverage', '--result-format', 'human', '--test-level', 'RunSpecifiedTests'],
        config
      ).run();
      expect(buildPayloadSpy.calledOnce).to.be.true;
      expect(runTestSynchronousSpy.calledOnce).to.be.true;
      expect(buildPayloadSpy.firstCall.args).to.deep.equal(['RunSpecifiedTests', undefined, 'myApex', undefined]);
      expect(runTestSynchronousSpy.firstCall.args[0]).to.deep.equal({
        skipCodeCoverage: false,
        testLevel: 'RunSpecifiedTests',
        tests: [
          {
            className: 'myApex',
          },
        ],
      });
    });

    it('will build the async correct payload no code coverage', async () => {
      sandbox.stub(Org.prototype, 'getUsername').resolves('test@example.com');
      const buildPayloadSpy = sandbox.spy(TestService.prototype, 'buildAsyncPayload');
      const runTestSynchronousSpy = sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves(testRunSimple);
      await new Test(['--class-names', 'myApex', '--test-level', 'RunSpecifiedTests'], config).run();
      expect(buildPayloadSpy.calledOnce).to.be.true;
      expect(runTestSynchronousSpy.calledOnce).to.be.true;
      expect(buildPayloadSpy.firstCall.args).to.deep.equal(['RunSpecifiedTests', undefined, 'myApex', undefined]);
      expect(runTestSynchronousSpy.firstCall.args[0]).to.deep.equal({
        skipCodeCoverage: true,
        testLevel: 'RunSpecifiedTests',
        tests: [
          {
            className: 'myApex',
          },
        ],
      });
    });

    it('will build the sync correct payload no code coverage', async () => {
      sandbox.stub(Org.prototype, 'getUsername').resolves('test@example.com');
      const buildPayloadSpy = sandbox.spy(TestService.prototype, 'buildSyncPayload');
      const runTestSynchronousSpy = sandbox.stub(TestService.prototype, 'runTestSynchronous').resolves(testRunSimple);
      await new Test(['--class-names', 'myApex', '--synchronous', '--test-level', 'RunSpecifiedTests'], config).run();
      expect(buildPayloadSpy.calledOnce).to.be.true;
      expect(runTestSynchronousSpy.calledOnce).to.be.true;
      expect(buildPayloadSpy.firstCall.args).to.deep.equal(['RunSpecifiedTests', undefined, 'myApex']);
      expect(runTestSynchronousSpy.firstCall.args[0]).to.deep.equal({
        skipCodeCoverage: true,
        testLevel: 'RunSpecifiedTests',
        tests: [
          {
            className: 'myApex',
          },
        ],
      });
    });
  });

  describe('validateFlags', () => {
    // TODO: move this method to oclif flag validation
    it('rejects codecoverage without resultformat', async () => {
      try {
        await new Test(['--code-coverage'], config).run();
      } catch (e) {
        expect((e as Error).message).to.equal(messages.getMessage('missingReporterErr'));
      }
    });

    it('rejects tests/classnames/suitenames and testlevels', async () => {
      try {
        await new Test(['--tests', 'mytest', '--test-level', 'RunAllTestsInOrg'], config).run();
      } catch (e) {
        expect((e as Error).message).to.equal(messages.getMessage('testLevelErr'));
      }
      try {
        await new Test(['--class-names', 'mytest', '--test-level', 'RunAllTestsInOrg'], config).run();
      } catch (e) {
        expect((e as Error).message).to.equal(messages.getMessage('testLevelErr'));
      }
      try {
        await new Test(['--suite-names', 'mytest', '--test-level', 'RunAllTestsInOrg'], config).run();
      } catch (e) {
        expect((e as Error).message).to.equal(messages.getMessage('testLevelErr'));
      }
    });

    it('rejects synchronous and suitenames/classnames', async () => {
      try {
        await new Test(['--synchronous', '--suite-names', 'mysuite'], config).run();
      } catch (e) {
        expect((e as Error).message).to.equal(messages.getMessage('syncClassErr'));
      }

      try {
        await new Test(['--synchronous', '--class-names', 'myclass,mysecondclass'], config).run();
      } catch (e) {
        expect((e as Error).message).to.equal(messages.getMessage('syncClassErr'));
      }
    });

    it('rejects classname/suitnames/test variations', async () => {
      try {
        await new Test(['--class-names', 'myApex', '--suite-names', 'testsuite'], config).run();
      } catch (e) {
        expect((e as Error).message).to.equal(messages.getMessage('classSuiteTestErr'));
      }

      try {
        await new Test(['--class-names', 'myApex', '--tests', 'testsuite'], config).run();
      } catch (e) {
        expect((e as Error).message).to.equal(messages.getMessage('classSuiteTestErr'));
      }

      try {
        await new Test(['--suite-names', 'myApex', '--tests', 'testsuite'], config).run();
      } catch (e) {
        expect((e as Error).message).to.equal(messages.getMessage('classSuiteTestErr'));
      }
    });
  });
});
