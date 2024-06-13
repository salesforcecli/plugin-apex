/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'node:fs';
import { Config } from '@oclif/core';
import sinon from 'sinon';
import { LogService } from '@salesforce/apex-node';
import { expect } from 'chai';
import { SfCommand } from '@salesforce/sf-plugins-core';
import { Org } from '@salesforce/core';
import ansis from 'ansis';
import Log, { LogGetResult } from '../../../../src/commands/apex/get/log.js';

const strip = new ansis.Ansis().strip;
const logStripper = (log: LogGetResult[number]) => (typeof log === 'string' ? strip(log) : { log: strip(log.log) });

describe('apex:log:get', () => {
  let config: Config;
  let sandbox: sinon.SinonSandbox;
  let logStub: sinon.SinonStub;

  beforeEach(async () => {
    config = await Config.load(import.meta.url);
    sandbox = sinon.createSandbox();
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

  it('verify log stripper', () => {
    expect(strip('\u001b[1mmyLog\u001b[22m\n')).to.equal('myLog\n');
    expect(logStripper('\u001b[1mmyLog\u001b[22m\n')).to.equal('myLog\n');
    expect(logStripper({ log: '\u001b[1mmyLog\u001b[22m\n' })).to.deep.equal({ log: 'myLog\n' });
  });

  it('0 logs to get', async () => {
    sandbox.stub(LogService.prototype, 'getLogs').resolves([]);
    const result = await Log.run([], config);
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
    const result = (await new Log([], config).run()).map(logStripper);
    expect(result).to.deep.equal([{ log: 'myLog' }, { log: 'myLog2' }]);
    expect(logStripper(logStub.firstCall.args[0] as string)).to.equal('myLog');
    expect(logStripper(logStub.secondCall.args[0] as string)).to.equal('myLog2');
  });

  it('multiple results --json', async () => {
    sandbox.stub(LogService.prototype, 'getLogs').resolves([{ log: 'myLog' }, { log: 'myLog2' }]);
    const result = (await new Log(['--json'], config).run()).map(logStripper);
    expect(result).to.deep.equal([{ log: 'myLog' }, { log: 'myLog2' }]);
    expect(logStripper(logStub.firstCall.args[0] as string)).to.equal('myLog');
    expect(logStripper(logStub.secondCall.args[0] as string)).to.equal('myLog2');
  });
});
