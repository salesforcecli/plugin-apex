/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { resolve } from 'path';
import * as fs from 'fs';
import { Connection, Org } from '@salesforce/core';
import { createSandbox, SinonSandbox } from 'sinon';
import { SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { Config } from '@oclif/core';
import { expect } from 'chai';
import { TestService } from '@salesforce/apex-node';
import Report from '../../../../src/commands/apex/test/report';
import { runWithFailures, testRunSimple, testRunSimpleResult, testRunWithFailuresResult } from './testData';

let logStub: sinon.SinonStub;
let warnStub: sinon.SinonStub;
let styledJsonStub: sinon.SinonStub;
// TODO: migrate reporter to class and test only once

describe('apex:test:report', () => {
  let sandbox: SinonSandbox;
  const config = new Config({ root: resolve(__dirname, '../../package.json') });

  beforeEach(async () => {
    sandbox = createSandbox();
    logStub = sandbox.stub(Ux.prototype, 'log');
    warnStub = sandbox.stub(SfCommand.prototype, 'warn');
    styledJsonStub = sandbox.stub(Ux.prototype, 'styledJSON');
    sandbox.stub(Connection.prototype, 'getUsername').returns('test@example.com');

    sandbox.stub(Org, 'create').resolves(Org.prototype);
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

      const result = await new Report(['--testrunid', '707xxxxxxxxxxxx', '--resultformat', 'human'], config).run();

      expect(result).to.deep.equal(testRunWithFailuresResult);
      expect(logStub.firstCall.args[0]).to.include('=== Test Summary');
      expect(logStub.firstCall.args[0]).to.include('=== Test Results');
      expect(logStub.firstCall.args[0]).to.include('Test Run Id          707xx0000AUS2gH');
      expect(logStub.firstCall.args[0]).to.include('MyApexTests.testConfig  Fail');
    });

    it('should return a success tap format message with async', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(runWithFailures);

      const result = await new Report(['--testrunid', '707xxxxxxxxxxxx', '--resultformat', 'tap'], config).run();

      expect(result).to.deep.equal(testRunWithFailuresResult);
      expect(logStub.firstCall.args[0]).to.include('1..1');
      expect(logStub.firstCall.args[0]).to.include('ok 1 MyApexTests.testConfig');
      expect(logStub.firstCall.args[0]).to.include('# Run "sfdx apex test report');
    });

    it('should return a success junit format message with async', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(runWithFailures);
      const result = await new Report(['--testrunid', '707xxxxxxxxxxxx', '--resultformat', 'junit'], config).run();
      expect(result).to.deep.equal(testRunWithFailuresResult);
      expect(logStub.firstCall.args[0]).to.include('<property name="failRate" value="50%"/>');
      expect(logStub.firstCall.args[0]).to.include('<property name="outcome" value="Failed"/>');
      expect(logStub.firstCall.args[0]).to.include('<failure message=""><![CDATA[Error running test]]></failure>');
    });

    it('should return a success json format message with async', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(runWithFailures);
      const result = await new Report(['--testrunid', '707xxxxxxxxxxxx', '--resultformat', 'json'], config).run();
      expect(result).to.deep.equal(testRunWithFailuresResult);
      expect(styledJsonStub.firstCall.args[0]).to.deep.equal({ result: testRunWithFailuresResult, status: 100 });
    });

    it('should return a success --json format message with sync', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(runWithFailures);
      sandbox.stub(Org.prototype, 'getUsername').returns('test@user.com');
      const result = await new Report(['--testrunid', '707xxxxxxxxxxxx', '--json'], config).run();
      expect(result).to.deep.equal(testRunWithFailuresResult);
      expect(styledJsonStub.notCalled).to.be.true;
    });

    it('should return a success human format with synchronous', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(runWithFailures);
      await new Report(['--testrunid', '707xxxxxxxxxxxx', '--resultformat', 'human'], config).run();
      expect(logStub.firstCall.args[0]).to.contain('Test Summary');
      expect(logStub.firstCall.args[0]).to.contain('Test Results');
      expect(logStub.firstCall.args[0]).to.not.contain('Apex Code Coverage by Class');
    });

    it('should warn when using --outputdir', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(runWithFailures);
      await new Report(
        ['--outputdir', 'myDirectory', '--testrunid', '707xxxxxxxxxxxx', '--resultformat', 'human'],
        config
      ).run();
      expect(logStub.firstCall.args[0]).to.contain('Test result files written to myDirectory');
      expect(warnStub.firstCall.args[0]).to.contain('The "--outputdir" flag has been');
    });
  });

  describe('test success', () => {
    it('should return a success human format message with async', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(testRunSimple);

      const result = await new Report(['--testrunid', '707xxxxxxxxxxxx', '--resultformat', 'human'], config).run();

      expect(result).to.deep.equal(testRunSimpleResult);
      expect(logStub.firstCall.args[0]).to.include('=== Test Summary');
      expect(logStub.firstCall.args[0]).to.include('=== Test Results');
      expect(logStub.firstCall.args[0]).to.include('Test Run Id          707xx0000AUS2gH');
      expect(logStub.firstCall.args[0]).to.include('MyApexTests.testConfig  Pass              53');
    });

    it('should return a success tap format message with async', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(testRunSimple);
      sandbox.stub(Org.prototype, 'getUsername').returns('test@example.com');

      const result = await new Report(['--testrunid', '707xxxxxxxxxxxx', '--resultformat', 'tap'], config).run();

      expect(result).to.deep.equal(testRunSimpleResult);
      expect(logStub.firstCall.args[0]).to.include('1..1');
      expect(logStub.firstCall.args[0]).to.include('ok 1 MyApexTests.testConfig');
      expect(logStub.firstCall.args[0]).to.include('# Run "sfdx apex test report');
    });

    it('should return a success junit format message with async', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(testRunSimple);
      const result = await new Report(['--testrunid', '707xxxxxxxxxxxx', '--resultformat', 'junit'], config).run();
      expect(result).to.deep.equal(testRunSimpleResult);
      expect(logStub.firstCall.args[0]).to.contain('<testcase name="testConfig" classname="MyApexTests" time="0.05">');
      expect(logStub.firstCall.args[0]).to.contain('<property name="testsRan" value="1"/>');
    });

    it('should return a success json format message with async', async () => {
      process.exitCode = 0;
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(testRunSimple);
      const result = await new Report(['--testrunid', '707xxxxxxxxxxxx', '--resultformat', 'json'], config).run();
      expect(result).to.deep.equal(testRunSimpleResult);
      expect(styledJsonStub.firstCall.args[0]).to.deep.equal({ result: testRunSimpleResult, status: 0 });
    });

    it('should return a success --json format message with sync', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(testRunSimple);
      sandbox.stub(Org.prototype, 'getUsername').returns('test@user.com');
      const result = await new Report(['--testrunid', '707xxxxxxxxxxxx', '--json'], config).run();
      expect(result).to.deep.equal(testRunSimpleResult);
      expect(styledJsonStub.notCalled).to.be.true;
    });

    it('should return a success human format with synchronous', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(testRunSimple);
      await new Report(['--testrunid', '707xxxxxxxxxxxx', '--resultformat', 'human'], config).run();
      expect(logStub.firstCall.args[0]).to.contain('Test Summary');
      expect(logStub.firstCall.args[0]).to.contain('Test Results');
      expect(logStub.firstCall.args[0]).to.not.contain('Apex Code Coverage by Class');
    });

    it('should warn when using --outputdir', async () => {
      sandbox.stub(TestService.prototype, 'reportAsyncResults').resolves(testRunSimple);
      await new Report(
        ['--outputdir', 'myDirectory', '--testrunid', '707xxxxxxxxxxxx', '--resultformat', 'human'],
        config
      ).run();
      expect(logStub.firstCall.args[0]).to.contain('Test result files written to myDirectory');
      expect(warnStub.firstCall.args[0]).to.contain('The "--outputdir" flag has been deprecated');
    });
  });
});
