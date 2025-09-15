/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'node:fs';
import { Messages, Org } from '@salesforce/core';
import sinon from 'sinon';
import { Ux, stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { assert, expect } from 'chai';
import { TestService } from '@salesforce/apex-node';
import RunLogicTest from '../../../../src/commands/logic/run/test.js';
import { logicTestRunSimple, logicTestRunSimpleResult } from '../../../testData.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'runtestcommon');

let logStub: sinon.SinonStub;

describe('logic:test:run', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    logStub = sandbox.stub(Ux.prototype, 'log');
    stubSfCommandUx(sandbox);
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

  describe('--test-category flag', () => {
    it('should accept Apex as test category', async () => {
      const testServiceStub = sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves(logicTestRunSimple);
      await RunLogicTest.run([
        '--test-category',
        'Apex',
        '--test-level',
        'RunLocalTests',
        '--target-org',
        'test@user.com',
      ]);

      expect(testServiceStub.calledOnce).to.be.true;
      const testServiceCall = testServiceStub.getCall(0);
      const testRunOptions = testServiceCall.args[0];

      expect(testRunOptions.category).to.deep.equal(['Apex']);
    });

    it('should accept Flow as test category', async () => {
      const testServiceStub = sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves(logicTestRunSimple);
      await RunLogicTest.run([
        '--test-category',
        'Flow',
        '--test-level',
        'RunLocalTests',
        '--target-org',
        'test@user.com',
      ]);

      expect(testServiceStub.calledOnce).to.be.true;
      const testServiceCall = testServiceStub.getCall(0);
      const testRunOptions = testServiceCall.args[0];

      expect(testRunOptions.category).to.deep.equal(['Flow']);
    });

    it('should fail with invalid test category', async () => {
      try {
        await RunLogicTest.run([
          '--test-category',
          'Invalid',
          '--test-level',
          'RunLocalTests',
          '--target-org',
          'test@user.com',
        ]);
        assert.fail('Expected command to throw an error for invalid test category');
      } catch (error) {
        expect((error as Error).message).to.include('Expected --test-category=Invalid to be one of: Apex, Flow');
      }
    });

    it('should work without test-category flag (should not pass category to TestService)', async () => {
      const testServiceStub = sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves(logicTestRunSimple);
      const result = await RunLogicTest.run(['--test-level', 'RunLocalTests', '--target-org', 'test@user.com']);

      expect(testServiceStub.calledOnce).to.be.true;
      const testServiceCall = testServiceStub.getCall(0);
      const testRunOptions = testServiceCall.args[0];

      // When test-category is not specified, it should not be passed to TestService
      expect(testRunOptions.category).to.be.undefined;
      expect(result).to.deep.equal(logicTestRunSimpleResult);
    });

    it('should not allow test-category with class-names (exclusive flags)', async () => {
      try {
        await RunLogicTest.run([
          '--test-category',
          'Flow',
          '--class-names',
          'TestClass',
          '--target-org',
          'test@user.com',
        ]);
        assert.fail('Expected command to throw an error for exclusive flags');
      } catch (error) {
        expect((error as Error).message).to.include('cannot also be provided when using');
      }
    });

    it('should not allow test-category with suite-names (exclusive flags)', async () => {
      try {
        await RunLogicTest.run([
          '--test-category',
          'Apex',
          '--suite-names',
          'TestSuite',
          '--target-org',
          'test@user.com',
        ]);
        assert.fail('Expected command to throw an error for exclusive flags');
      } catch (error) {
        expect((error as Error).message).to.include('cannot also be provided when using');
      }
    });

    it('should not allow test-category with tests (exclusive flags)', async () => {
      try {
        await RunLogicTest.run([
          '--test-category',
          'Flow',
          '--tests',
          'TestClass.testMethod',
          '--target-org',
          'test@user.com',
        ]);
        assert.fail('Expected command to throw an error for exclusive flags');
      } catch (error) {
        expect((error as Error).message).to.include('cannot also be provided when using');
      }
    });
  });

  describe('test success', () => {
    it('should return a success json format message with sync', async () => {
      sandbox.stub(TestService.prototype, 'runTestSynchronous').resolves(logicTestRunSimple);
      sandbox.stub(Org.prototype, 'getUsername').returns('test@user.com');
      const result = await RunLogicTest.run(['--tests', 'MyApexTests', '-r', 'json', '--synchronous']);
      expect(result).to.deep.equal(logicTestRunSimpleResult);
    });

    it('should return a success human format with synchronous', async () => {
      sandbox.stub(TestService.prototype, 'runTestSynchronous').resolves(logicTestRunSimple);
      await RunLogicTest.run(['--tests', 'MyApexTests', '--result-format', 'human', '--synchronous']);
      expect(logStub.firstCall.args[0]).to.contain('Test Summary');
      expect(logStub.firstCall.args[0]).to.contain('Test Results');
      expect(logStub.firstCall.args[0]).to.contain('CATEGORY  OUTCOME');
      expect(logStub.firstCall.args[0]).to.contain('Apex      Pass');
    });

    it('will build the sync correct payload with test-category', async () => {
      const buildPayloadSpy = sandbox.spy(TestService.prototype, 'buildAsyncPayload');
      const runTestAsynchronousSpy = sandbox
        .stub(TestService.prototype, 'runTestAsynchronous')
        .resolves(logicTestRunSimple);
      await RunLogicTest.run([
        '--synchronous',
        '--code-coverage',
        '--result-format',
        'human',
        '--test-level',
        'RunLocalTests',
        '--test-category',
        'Apex',
      ]);
      expect(buildPayloadSpy.calledOnce).to.be.true;
      expect(runTestAsynchronousSpy.calledOnce).to.be.true;
      expect(buildPayloadSpy.firstCall.args).to.deep.equal(['RunLocalTests', undefined, undefined, undefined, 'Apex']);
      expect(runTestAsynchronousSpy.firstCall.args[0]).to.deep.equal({
        skipCodeCoverage: false,
        testLevel: 'RunLocalTests',
        suiteNames: undefined,
        category: ['Apex'],
      });
    });

    it('will build the sync correct payload without test-category', async () => {
      const buildPayloadSpy = sandbox.spy(TestService.prototype, 'buildAsyncPayload');
      const runTestAsynchronousSpy = sandbox
        .stub(TestService.prototype, 'runTestAsynchronous')
        .resolves(logicTestRunSimple);
      await RunLogicTest.run([
        '--synchronous',
        '--code-coverage',
        '--result-format',
        'human',
        '--test-level',
        'RunLocalTests',
      ]);
      expect(buildPayloadSpy.calledOnce).to.be.true;
      expect(runTestAsynchronousSpy.calledOnce).to.be.true;
      expect(buildPayloadSpy.firstCall.args).to.deep.equal(['RunLocalTests', undefined, undefined, undefined, '']);
      expect(runTestAsynchronousSpy.firstCall.args[0]).to.deep.equal({
        skipCodeCoverage: false,
        suiteNames: undefined,
        testLevel: 'RunLocalTests',
      });
    });
  });

  describe('validateFlags', () => {
    it('rejects tests/classnames/suitenames and testlevels', async () => {
      try {
        await RunLogicTest.run(['--tests', 'mytest', '--test-level', 'RunAllTestsInOrg']);
      } catch (e) {
        expect((e as Error).message).to.equal(messages.getMessage('testLevelErr'));
      }
      try {
        await RunLogicTest.run(['--class-names', 'mytest', '--test-level', 'RunAllTestsInOrg']);
      } catch (e) {
        expect((e as Error).message).to.equal(messages.getMessage('testLevelErr'));
      }
      try {
        await RunLogicTest.run(['--suite-names', 'mytest', '--test-level', 'RunAllTestsInOrg']);
      } catch (e) {
        expect((e as Error).message).to.equal(messages.getMessage('testLevelErr'));
      }
    });

    it('rejects classname/suitnames/test variations', async () => {
      // uses oclif exclusive now
      try {
        await RunLogicTest.run(['--class-names', 'myApex', '--suite-names', 'testsuite']);
      } catch (e) {
        assert(e instanceof Error);
        expect(e.message).to.include('cannot also be provided when using');
      }

      try {
        await RunLogicTest.run(['--class-names', 'myApex', '--tests', 'testsuite']);
      } catch (e) {
        assert(e instanceof Error);
        expect(e.message).to.include('cannot also be provided when using');
      }

      try {
        await RunLogicTest.run(['--suite-names', 'myApex', '--tests', 'testsuite']);
      } catch (e) {
        assert(e instanceof Error);
        expect(e.message).to.include('cannot also be provided when using');
      }
    });
  });
});
