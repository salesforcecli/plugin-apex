/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { resolve } from 'path';
import * as fs from 'fs';
import { Config } from '@oclif/core';
import { createSandbox } from 'sinon';
import { LogService } from '@salesforce/apex-node';
import { expect } from 'chai';
import { SfCommand } from '@salesforce/sf-plugins-core';
import { Org } from '@salesforce/core';
import Log from '../../../../src/commands/apex/get/log';

describe('apex:log:get', () => {
  const config = new Config({ root: resolve(__dirname, '../../package.json') });
  let sandbox: sinon.SinonSandbox;
  let logStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = createSandbox();
    logStub = sandbox.stub(SfCommand.prototype, 'log');
    sandbox.stub(Org, 'create').resolves({ getConnection: () => ({}) } as Org);
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

  it('0 logs to get', async () => {
    sandbox.stub(LogService.prototype, 'getLogs').resolves([]);
    const result = await new Log([], config).run();
    expect(result).to.deep.equal([]);
    expect(logStub.firstCall.args[0]).to.equal('No results found');
  });

  it('outputdir will write to fs', async () => {
    sandbox.stub(LogService.prototype, 'getLogs').resolves([{ log: 'myLog' }]);
    const result = await new Log(['--output-dir', 'myDirectory'], config).run();
    expect(result).to.deep.equal(['myLog']);
    expect(logStub.firstCall.args[0]).to.equal('Log files written to myDirectory');
  });

  it('outputdir will write to fs --json', async () => {
    sandbox.stub(LogService.prototype, 'getLogs').resolves([{ log: 'myLog' }]);
    const result = await new Log(['--outputdir', 'myDirectory', '--json'], config).run();
    expect(result).to.deep.equal(['myLog']);
    expect(logStub.firstCall.args[0]).to.equal('Log files written to myDirectory');
  });

  it('multiple results', async () => {
    sandbox.stub(LogService.prototype, 'getLogs').resolves([{ log: 'myLog' }, { log: 'myLog2' }]);
    const result = await new Log([], config).run();
    expect(result).to.deep.equal([{ log: 'myLog' }, { log: 'myLog2' }]);
    expect(logStub.firstCall.args[0]).to.equal('myLog');
    expect(logStub.secondCall.args[0]).to.equal('myLog2');
  });

  it('multiple results --json', async () => {
    sandbox.stub(LogService.prototype, 'getLogs').resolves([{ log: 'myLog' }, { log: 'myLog2' }]);
    const result = await new Log(['--json'], config).run();
    expect(result).to.deep.equal([{ log: 'myLog' }, { log: 'myLog2' }]);
    expect(logStub.firstCall.args[0]).to.equal('myLog');
    expect(logStub.secondCall.args[0]).to.equal('myLog2');
  });
});
