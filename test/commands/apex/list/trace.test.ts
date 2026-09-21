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

import sinon from 'sinon';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { Org } from '@salesforce/core';
import { expect } from 'chai';
import Trace from '../../../../src/commands/apex/list/trace.js';

const traceFlagRecords = [
  {
    Id: '7tf000000000001AAA',
    TracedEntityId: '005000000000001AAA',
    LogType: 'DEVELOPER_LOG',
    DebugLevelId: '7dl000000000001AAA',
    StartDate: '2026-09-21T00:00:00.000+0000',
    ExpirationDate: '2026-09-21T00:30:00.000+0000',
    DebugLevel: { DeveloperName: 'SFDC_DevConsole' },
    TracedEntity: { Name: 'Test User' },
  },
  {
    Id: '7tf000000000002AAA',
    TracedEntityId: '005000000000002AAA',
    LogType: 'USER_DEBUG',
    DebugLevelId: '7dl000000000002AAA',
    StartDate: '2026-09-20T12:00:00.000+0000',
    ExpirationDate: '2026-09-20T12:30:00.000+0000',
    DebugLevel: { DeveloperName: 'MyDebugLevel' },
    TracedEntity: { Name: 'Another User' },
  },
];

describe('apex:list:trace', () => {
  let sandbox: sinon.SinonSandbox;
  let uxStub: ReturnType<typeof stubSfCommandUx>;
  let mockToolingQuery: sinon.SinonStub;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    uxStub = stubSfCommandUx(sandbox);
    mockToolingQuery = sandbox.stub();
    const mockConnection = { tooling: { query: mockToolingQuery } };
    sandbox.stub(Org, 'create').resolves({
      getConnection: () => mockConnection,
    } as unknown as Org);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('lists 0 trace flags', async () => {
    mockToolingQuery.resolves({ totalSize: 0, records: [] });
    const result = await Trace.run([]);
    expect(result).to.deep.equal([]);
    expect(uxStub.log.firstCall.args[0]).to.equal('No trace flags found in org.');
  });

  it('lists multiple trace flags', async () => {
    mockToolingQuery.resolves({ totalSize: 2, records: structuredClone(traceFlagRecords) });
    await Trace.run([]);
    expect(uxStub.table.args[0][0].data).to.deep.equal([
      {
        Id: '7tf000000000001AAA',
        'Traced Entity': 'Test User',
        'Log Type': 'DEVELOPER_LOG',
        'Debug Level': 'SFDC_DevConsole',
        'Start Date': '2026-09-21T00:00:00.000+0000',
        'Expiration Date': '2026-09-21T00:30:00.000+0000',
      },
      {
        Id: '7tf000000000002AAA',
        'Traced Entity': 'Another User',
        'Log Type': 'USER_DEBUG',
        'Debug Level': 'MyDebugLevel',
        'Start Date': '2026-09-20T12:00:00.000+0000',
        'Expiration Date': '2026-09-20T12:30:00.000+0000',
      },
    ]);
  });

  it('lists trace flags with --json', async () => {
    mockToolingQuery.resolves({ totalSize: 2, records: traceFlagRecords });
    const result = await Trace.run(['--json']);
    expect(result).to.deep.equal(traceFlagRecords);
  });
});
