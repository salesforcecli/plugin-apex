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
import { LogService } from '@salesforce/apex-node';
import { expect } from 'chai';
import { Org } from '@salesforce/core';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import Log from '../../../../src/commands/apex/tail/log.js';

describe('apex:log:tail', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    stubSfCommandUx(sandbox);
    sandbox.stub(Org, 'create').resolves({ getConnection: () => ({}) } as Org);
    sandbox.stub(LogService.prototype, 'tail').resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('will skip trace flag correctly', async () => {
    const traceFlagStub = sandbox.stub(LogService.prototype, 'prepareTraceFlag');
    // @ts-ignore private method
    sandbox.stub(Log.prototype, 'getLogService').returns(LogService.prototype);

    const result = await Log.run(['-o', 'test@username.com']);
    expect(traceFlagStub.called).to.be.true;
    expect(result).to.deep.equal(undefined);
  });

  it('will call trace flag correctly', async () => {
    const traceFlagStub = sandbox.stub(LogService.prototype, 'prepareTraceFlag');
    // @ts-ignore private method
    sandbox.stub(Log.prototype, 'getLogService').returns(LogService.prototype);
    const result = await Log.run(['-o', 'test@username.com', '--skip-trace-flag']);
    expect(traceFlagStub.called).to.be.false;
    expect(result).to.deep.equal(undefined);
  });
});
