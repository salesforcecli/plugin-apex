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
import Trace from '../../../../src/commands/apex/trace/delete.js';

describe('apex:trace:delete', () => {
  let sandbox: sinon.SinonSandbox;
  let uxStub: ReturnType<typeof stubSfCommandUx>;
  let mockToolingDelete: sinon.SinonStub;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    uxStub = stubSfCommandUx(sandbox);
    mockToolingDelete = sandbox.stub();
    const mockConnection = {
      tooling: {
        delete: mockToolingDelete,
      },
    };
    sandbox.stub(Org, 'create').resolves({
      getConnection: () => mockConnection,
    } as unknown as Org);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('deletes a trace flag successfully', async () => {
    mockToolingDelete.resolves({ id: '7tf000000000001AAA', success: true, errors: [] });

    const result = await Trace.run(['--trace-flag-id', '7tf000000000001AAA']);

    expect(result).to.deep.equal({ id: '7tf000000000001AAA', success: true });
    expect(uxStub.log.firstCall.args[0]).to.equal('Successfully deleted trace flag 7tf000000000001AAA.');
    expect(mockToolingDelete.firstCall.args).to.deep.equal(['TraceFlag', '7tf000000000001AAA']);
  });

  it('throws when delete fails', async () => {
    mockToolingDelete.resolves({ success: false, errors: ['ENTITY_IS_DELETED'] });

    try {
      await Trace.run(['--trace-flag-id', '7tf000000000001AAA']);
      expect.fail('should have thrown');
    } catch (e) {
      expect((e as Error).message).to.include('Failed to delete trace flag');
    }
  });
});
