/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { resolve } from 'path';
import { LogService } from '@salesforce/apex-node';
import { Config } from '@oclif/core';
import { createSandbox } from 'sinon';
import { SfCommand } from '@salesforce/sf-plugins-core';
import { Org } from '@salesforce/core';
import { expect } from 'chai';
import List from '../../../../src/commands/apex/log/list';

const rawLogResult = {
  status: 0,
  result: {
    '0': {
      Id: '07L5tgg0005PGdTnEAL',
      Application: 'Unknown',
      DurationMilliseconds: 75,
      Location: 'Unknown',
      LogLength: 450,
      LogUser: {
        Name: 'Test User',
        attributes: {},
      },
      Operation: 'API',
      Request: 'API',
      StartTime: '2020-10-13T05:39:43.000+0000',
      Status: 'Assertion Failed',
    },
    '1': {
      Id: '07L5tgg0005PGdTnFPL',
      Application: 'Unknown',
      DurationMilliseconds: 75,
      Location: 'Unknown',
      LogLength: 450,
      LogUser: {
        Name: 'Test User2',
        attributes: {},
      },
      Operation: 'API',
      Request: 'API',
      StartTime: '2020-10-13T05:39:43.000+0000',
      Status: 'Successful',
    },
  },
};

const logRecords = [rawLogResult.result[0], rawLogResult.result[1]];

describe('apex:log:list', () => {
  const config = new Config({ root: resolve(__dirname, '../../package.json') });
  let sandbox: sinon.SinonSandbox;
  let logStub: sinon.SinonStub;
  let tableStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = createSandbox();
    logStub = sandbox.stub(SfCommand.prototype, 'log');
    tableStub = sandbox.stub(SfCommand.prototype, 'table');
    sandbox.stub(Org, 'create').resolves(Org.prototype);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('will list 0 logs', async () => {
    sandbox.stub(LogService.prototype, 'getLogRecords').resolves([]);
    const result = await new List([], config).run();
    expect(result).to.deep.equal([]);
    expect(logStub.firstCall.args[0]).to.equal('No debug logs found in org');
  });

  it('will list 0 logs --json', async () => {
    sandbox.stub(LogService.prototype, 'getLogRecords').resolves([]);
    const result = await new List(['--json'], config).run();
    expect(result).to.deep.equal([]);
    expect(logStub.firstCall.args[0]).to.equal('No debug logs found in org');
  });

  it('will list multiple logs', async () => {
    sandbox.stub(LogService.prototype, 'getLogRecords').resolves(logRecords);
    const result = await new List([], config).run();
    expect(result).to.deep.equal(logRecords);
    expect(tableStub.firstCall.args[0]).to.deep.equal([
      {
        app: 'Unknown',
        duration: '75',
        id: '07L5tgg0005PGdTnEAL',
        location: 'Unknown',
        operation: 'API',
        request: 'API',
        size: '450',
        status: 'Assertion Failed',
        time: '2020-10-13T05:39:43+0000',
        user: 'Test User',
      },
      {
        app: 'Unknown',
        duration: '75',
        id: '07L5tgg0005PGdTnFPL',
        location: 'Unknown',
        operation: 'API',
        request: 'API',
        size: '450',
        status: 'Successful',
        time: '2020-10-13T05:39:43+0000',
        user: 'Test User2',
      },
    ]);
  });

  it('will list multiple logs --json', async () => {
    sandbox.stub(LogService.prototype, 'getLogRecords').resolves(logRecords);
    const result = await new List([], config).run();
    expect(result).to.deep.equal(logRecords);
    expect(tableStub.firstCall.args[0]).to.deep.equal([
      {
        app: 'Unknown',
        duration: '75',
        id: '07L5tgg0005PGdTnEAL',
        location: 'Unknown',
        operation: 'API',
        request: 'API',
        size: '450',
        status: 'Assertion Failed',
        time: '2020-10-13T05:39:43+0000',
        user: 'Test User',
      },
      {
        app: 'Unknown',
        duration: '75',
        id: '07L5tgg0005PGdTnFPL',
        location: 'Unknown',
        operation: 'API',
        request: 'API',
        size: '450',
        status: 'Successful',
        time: '2020-10-13T05:39:43+0000',
        user: 'Test User2',
      },
    ]);
  });
});