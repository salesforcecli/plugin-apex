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
import fs from 'node:fs';
import sinon from 'sinon';
import { LogService } from '@salesforce/apex-node';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { Org } from '@salesforce/core';
import ansis from 'ansis';
import Log, { LogGetResult } from '../../../../src/commands/apex/get/log.js';

// eslint-disable-next-line @typescript-eslint/unbound-method
const strip = new ansis.Ansis().strip;
const logStripper = (log: LogGetResult[number]) => (typeof log === 'string' ? strip(log) : { log: strip(log.log) });

describe('apex:log:get', () => {
  let sandbox: sinon.SinonSandbox;
  let uxStub: ReturnType<typeof stubSfCommandUx>;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    uxStub = stubSfCommandUx(sandbox);
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
    const result = await Log.run([]);
    expect(result).to.deep.equal([]);
    expect(uxStub.log.firstCall.args[0]).to.equal('No results found');
  });

  it('outputdir will write to fs', async () => {
    sandbox.stub(LogService.prototype, 'getLogs').resolves([{ log: 'myLog' }]);
    const result = await Log.run(['--output-dir', 'myDirectory']);
    expect(result).to.deep.equal(['myLog']);
    expect(uxStub.log.firstCall.args[0]).to.equal('Log files written to myDirectory');
  });

  it('outputdir will write to fs --json', async () => {
    sandbox.stub(LogService.prototype, 'getLogs').resolves([{ log: 'myLog' }]);
    const result = await Log.run(['--outputdir', 'myDirectory', '--json']);
    expect(result).to.deep.equal(['myLog']);
    expect(uxStub.log.firstCall.args[0]).to.equal('Log files written to myDirectory');
  });

  it('multiple results', async () => {
    sandbox.stub(LogService.prototype, 'getLogs').resolves([{ log: 'myLog' }, { log: 'myLog2' }]);
    const result = (await Log.run([])).map(logStripper);
    expect(result).to.deep.equal([{ log: 'myLog' }, { log: 'myLog2' }]);
    expect(logStripper(uxStub.log.firstCall.args[0] as string)).to.equal('myLog');
    expect(logStripper(uxStub.log.secondCall.args[0] as string)).to.equal('myLog2');
  });

  it('multiple results --json', async () => {
    sandbox.stub(LogService.prototype, 'getLogs').resolves([{ log: 'myLog' }, { log: 'myLog2' }]);
    const result = (await Log.run(['--json'])).map(logStripper);
    expect(result).to.deep.equal([{ log: 'myLog' }, { log: 'myLog2' }]);
    expect(logStripper(uxStub.log.firstCall.args[0] as string)).to.equal('myLog');
    expect(logStripper(uxStub.log.secondCall.args[0] as string)).to.equal('myLog2');
  });
});
