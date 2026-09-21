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
import Trace from '../../../../src/commands/apex/create/trace.js';

describe('apex:create:trace', () => {
  let sandbox: sinon.SinonSandbox;
  let uxStub: ReturnType<typeof stubSfCommandUx>;
  let mockToolingQuery: sinon.SinonStub;
  let mockToolingCreate: sinon.SinonStub;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    uxStub = stubSfCommandUx(sandbox);
    mockToolingQuery = sandbox.stub();
    mockToolingCreate = sandbox.stub();
    const mockConnection = {
      tooling: {
        query: mockToolingQuery,
        create: mockToolingCreate,
      },
    };
    sandbox.stub(Org, 'create').resolves({
      getConnection: () => mockConnection,
    } as unknown as Org);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('creates a trace flag successfully', async () => {
    mockToolingQuery.resolves({ totalSize: 1, records: [{ Id: '7dl000000000001AAA' }] });
    mockToolingCreate.resolves({ id: '7tf000000000001AAA', success: true, errors: [] });

    const result = await Trace.run(['--traced-entity-id', '005000000000001AAA', '--debug-level', 'SFDC_DevConsole']);

    expect(result).to.deep.equal({ id: '7tf000000000001AAA', success: true });
    expect(uxStub.log.firstCall.args[0]).to.equal('Successfully created trace flag 7tf000000000001AAA.');
    expect(mockToolingCreate.firstCall.args[0]).to.equal('TraceFlag');
    expect(mockToolingCreate.firstCall.args[1]).to.have.property('TracedEntityId', '005000000000001AAA');
    expect(mockToolingCreate.firstCall.args[1]).to.have.property('LogType', 'DEVELOPER_LOG');
    expect(mockToolingCreate.firstCall.args[1]).to.have.property('DebugLevelId', '7dl000000000001AAA');
    const createPayload = mockToolingCreate.firstCall.args[1] as Record<string, string>;
    expect(createPayload).to.have.property('StartDate').that.is.a('string');
    expect(createPayload).to.have.property('ExpirationDate').that.is.a('string');
    const start = new Date(createPayload.StartDate);
    const expiration = new Date(createPayload.ExpirationDate);
    const durationMs = expiration.getTime() - start.getTime();
    expect(durationMs).to.equal(30 * 60 * 1000);
  });

  it('creates a trace flag with custom log type and duration', async () => {
    mockToolingQuery.resolves({ totalSize: 1, records: [{ Id: '7dl000000000001AAA' }] });
    mockToolingCreate.resolves({ id: '7tf000000000002AAA', success: true, errors: [] });

    const result = await Trace.run([
      '--traced-entity-id',
      '005000000000001AAA',
      '--debug-level',
      'MyDebugLevel',
      '--log-type',
      'USER_DEBUG',
      '--duration',
      '60',
    ]);

    expect(result).to.deep.equal({ id: '7tf000000000002AAA', success: true });
    expect(mockToolingCreate.firstCall.args[1]).to.have.property('LogType', 'USER_DEBUG');
  });

  it('throws when debug level not found', async () => {
    mockToolingQuery.resolves({ totalSize: 0, records: [] });

    try {
      await Trace.run(['--traced-entity-id', '005000000000001AAA', '--debug-level', 'NonExistent']);
      expect.fail('should have thrown');
    } catch (e) {
      expect((e as Error).message).to.include('NonExistent');
    }
  });

  it('throws when create fails', async () => {
    mockToolingQuery.resolves({ totalSize: 1, records: [{ Id: '7dl000000000001AAA' }] });
    mockToolingCreate.resolves({ success: false, errors: ['DUPLICATE_VALUE'] });

    try {
      await Trace.run(['--traced-entity-id', '005000000000001AAA', '--debug-level', 'SFDC_DevConsole']);
      expect.fail('should have thrown');
    } catch (e) {
      expect((e as Error).message).to.include('Failed to create trace flag');
    }
  });
});
