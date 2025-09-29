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
import { expect } from 'chai';
import sinon from 'sinon';
import { CancellationTokenSource, TestService } from '@salesforce/apex-node';
import { TestRunService } from '../../lib/shared/TestRunService.js';

describe('Common TestRunService behavior', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('apex command type behavior', () => {
    it('should pass empty string as testCategory for RunSpecifiedTests test-level', async () => {
      const flags = {
        'test-level': 'RunSpecifiedTests',
        'class-names': ['TestClass'],
        synchronous: true,
      };
      const config = {
        commandType: 'apex',
        exclusiveTestSpecifiers: [],
        binName: 'sf',
      };

      const mockConnection = {};
      const cancellationToken = new CancellationTokenSource();
      const context = {
        flags,
        config,
        connection: mockConnection,
        jsonEnabled: false,
        cancellationToken,
        log: sinon.stub(),
        info: sinon.stub(),
      };

      // Spy on buildSyncPayload to verify the testCategory parameter
      const buildSyncPayloadSpy = sandbox.spy(TestService.prototype, 'buildSyncPayload');
      
      // Stub runTestSynchronous to avoid actual execution
      sandbox.stub(TestService.prototype, 'runTestSynchronous').resolves({
        summary: { 
          outcome: 'Passed', 
          testsRan: 1,
          failRate: '0%',
          orgId: '00D4xx00000FH4IEAW',
          passing: 1,
          failing: 0,
          skipped: 0,
          passRate: '100%',
          skipRate: '0%',
          testStartTime: '2020-08-25T00:48:02.000+0000',
          testExecutionTimeInMs: 53,
          testTotalTime: '53 ms',
          testRunId: '707xx0000AUS2gH',
          userId: '005xx000000uEgSAAU',
          username: 'test@example.com',
          hostname: 'https://na139.salesforce.com',
          commandTime: '60 ms',
          testExecutionTime: '53 ms'
        },
        tests: []
      });

      await TestRunService.runTestCommand(context);

      expect(buildSyncPayloadSpy.calledOnce).to.be.true;
      // The fourth parameter should be empty string for RunSpecifiedTests
      expect(buildSyncPayloadSpy.firstCall.args[3]).to.equal('');
    });

    it('should pass "Apex" as testCategory for RunLocalTests test-level', async () => {
      const flags = {
        'test-level': 'RunLocalTests',
      };
      const config = {
        commandType: 'apex',
        exclusiveTestSpecifiers: [],
        binName: 'sf',
      };

      const mockConnection = {};
      const cancellationToken = new CancellationTokenSource();
      const context = {
        flags,
        config,
        connection: mockConnection,
        jsonEnabled: false,
        cancellationToken,
        log: sinon.stub(),
        info: sinon.stub(),
      };

      // Spy on buildAsyncPayload to verify the testCategory parameter (RunLocalTests uses async by default)
      const buildAsyncPayloadSpy = sandbox.spy(TestService.prototype, 'buildAsyncPayload');
      
      // Stub runTestAsynchronous to avoid actual execution
      sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves({
        testRunId: '707xx0000AUS2gH',
      });

      await TestRunService.runTestCommand(context);

      expect(buildAsyncPayloadSpy.calledOnce).to.be.true;
      // The fifth parameter should be "Apex" for RunLocalTests
      expect(buildAsyncPayloadSpy.firstCall.args[4]).to.equal('Apex');
    });
  });

  describe('logic command', () => {
    it('should pass empty string as testCategory when no test-category flag is provided', async () => {
      const flags = {
        'test-level': 'RunLocalTests',
      };
      const config = {
        commandType: 'logic',
        exclusiveTestSpecifiers: [],
        binName: 'sf',
      };

      const mockConnection = {};
      const cancellationToken = new CancellationTokenSource();
      const context = {
        flags,
        config,
        connection: mockConnection,
        jsonEnabled: false,
        cancellationToken,
        log: sinon.stub(),
        info: sinon.stub(),
      };

      // Spy on buildAsyncPayload to verify the testCategory parameter (logic uses async by default)
      const buildAsyncPayloadSpy = sandbox.spy(TestService.prototype, 'buildAsyncPayload');
      
      // Stub runTestAsynchronous to avoid actual execution
      sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves({
        testRunId: '707xx0000AUS2gH',
      });

      await TestRunService.runTestCommand(context);

      expect(buildAsyncPayloadSpy.calledOnce).to.be.true;
      // The fifth parameter should be empty string for logic without test-category
      expect(buildAsyncPayloadSpy.firstCall.args[4]).to.equal('');
    });

    it('should pass test-category value when test-category flag is provided', async () => {
      const flags = {
        'test-level': 'RunLocalTests',
        'test-category': ['Flow', 'Apex'],
      };
      const config = {
        commandType: 'logic',
        exclusiveTestSpecifiers: [],
        binName: 'sf',
      };

      const mockConnection = {};
      const cancellationToken = new CancellationTokenSource();
      const context = {
        flags,
        config,
        connection: mockConnection,
        jsonEnabled: false,
        cancellationToken,
        log: sinon.stub(),
        info: sinon.stub(),
      };

      // Spy on buildAsyncPayload to verify the testCategory parameter (logic uses async by default)
      const buildAsyncPayloadSpy = sandbox.spy(TestService.prototype, 'buildAsyncPayload');
      
      // Stub runTestAsynchronous to avoid actual execution
      sandbox.stub(TestService.prototype, 'runTestAsynchronous').resolves({
        testRunId: '707xx0000AUS2gH',
      });

      await TestRunService.runTestCommand(context);

      expect(buildAsyncPayloadSpy.calledOnce).to.be.true;
      // The fifth parameter should be "Flow,Apex" for logic with test-category
      expect(buildAsyncPayloadSpy.firstCall.args[4]).to.equal('Flow,Apex');
    });
  });
});