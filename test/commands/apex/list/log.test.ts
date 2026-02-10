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
import { LogService } from '@salesforce/apex-node';
import sinon from 'sinon';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { Org } from '@salesforce/core';
import { expect } from 'chai';
import Log, { formatStartTime } from '../../../../src/commands/apex/list/log.js';

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
  let sandbox: sinon.SinonSandbox;
  let uxStub: ReturnType<typeof stubSfCommandUx>;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    uxStub = stubSfCommandUx(sandbox);
    sandbox.stub(Org, 'create').resolves({ getConnection: () => ({}) } as Org);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('will list 0 logs', async () => {
    sandbox.stub(LogService.prototype, 'getLogRecords').resolves([]);
    const result = await Log.run([]);
    expect(result).to.deep.equal([]);
    expect(uxStub.log.firstCall.args[0]).to.equal('No debug logs found in org');
  });

  it('will list 0 logs --json', async () => {
    sandbox.stub(LogService.prototype, 'getLogRecords').resolves([]);
    const result = await Log.run(['--json']);
    expect(result).to.deep.equal([]);
    expect(uxStub.log.firstCall.args[0]).to.equal('No debug logs found in org');
  });

  it('will list multiple logs', async () => {
    sandbox.stub(LogService.prototype, 'getLogRecords').resolves(structuredClone(logRecords));
    await Log.run([]);
    expect(uxStub.table.args[0][0].data).to.deep.equal([
      {
        Id: '07L5tgg0005PGdTnEAL',
        Application: 'Unknown',
        DurationMilliseconds: '75',
        Location: 'Unknown',
        LogLength: 450,
        LogUser: { Name: 'Test User', attributes: {} },
        Operation: 'API',
        Request: 'API',
        StartTime: '2020-10-13T05:39:43+0000',
        Status: 'Assertion Failed',
        User: 'Test User',
      },
      {
        Id: '07L5tgg0005PGdTnFPL',
        Application: 'Unknown',
        DurationMilliseconds: '75',
        Location: 'Unknown',
        LogLength: 450,
        LogUser: { Name: 'Test User2', attributes: {} },
        Operation: 'API',
        Request: 'API',
        StartTime: '2020-10-13T05:39:43+0000',
        Status: 'Successful',
        User: 'Test User2',
      },
    ]);
  });

  it('will list multiple logs --json', async () => {
    sandbox.stub(LogService.prototype, 'getLogRecords').resolves(logRecords);
    const result = await Log.run(['--json']);
    expect(result).to.deep.equal(logRecords.map(formatStartTime));
  });
});
