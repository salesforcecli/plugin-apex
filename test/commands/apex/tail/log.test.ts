/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
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
