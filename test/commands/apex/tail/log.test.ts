/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sinon from 'sinon';
import { LogService } from '@salesforce/apex-node';
import { Config } from '@oclif/core';
import { expect } from 'chai';
import { Org } from '@salesforce/core';
import Log from '../../../../src/commands/apex/tail/log.js';

describe('apex:log:tail', () => {
  let sandbox: sinon.SinonSandbox;
  const config = new Config({ root: resolve(dirname(fileURLToPath(import.meta.url)), '../../package.json') });

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    sandbox.stub(Org, 'create').resolves({ getConnection: () => ({}) } as Org);
    sandbox.stub(LogService.prototype, 'tail').resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('will skip trace flag correctly', async () => {
    const traceFlagStub = sandbox.stub(LogService.prototype, 'prepareTraceFlag');
    const tail = new Log(['-o', 'test@username.com'], config);
    // @ts-ignore private method
    sandbox.stub(tail, 'getLogService').returns(LogService.prototype);
    const result = await tail.run();
    expect(traceFlagStub.called).to.be.true;
    expect(result).to.deep.equal(undefined);
  });

  it('will call trace flag correctly', async () => {
    const traceFlagStub = sandbox.stub(LogService.prototype, 'prepareTraceFlag');
    const tail = new Log(['-o', 'test@username.com', '--skip-trace-flag'], config);
    // @ts-ignore private method
    sandbox.stub(tail, 'getLogService').returns(LogService.prototype);
    const result = await tail.run();
    expect(traceFlagStub.called).to.be.false;
    expect(result).to.deep.equal(undefined);
  });
});
