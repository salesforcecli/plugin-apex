/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join } from 'node:path';
import fs from 'node:fs';
import { expect } from 'chai';
import { ExecuteService } from '@salesforce/apex-node';
import sinon from 'sinon';
import { Org, SfError } from '@salesforce/core';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import Run from '../../../src/commands/apex/run.js';

const log = '47.0 APEX_CODE,DEBUG;APEX_PROFILING,INFO\nExecute Anonymous: System.assert(true);|EXECUTION_FINISHED\n';

const expectedSuccessResult = {
  column: -1,
  line: -1,
  compiled: true,
  compileProblem: '',
  exceptionMessage: '',
  exceptionStackTrace: '',
  success: true,
  logs: log,
};

describe('apex:execute', () => {
  let sandboxStub: sinon.SinonSandbox;
  let uxStub: ReturnType<typeof stubSfCommandUx>;

  beforeEach(async () => {
    sandboxStub = sinon.createSandbox();
    uxStub = stubSfCommandUx(sandboxStub);
    sandboxStub.stub(Org, 'create').resolves({ getConnection: () => ({}) } as Org);
  });

  afterEach(() => {
    sandboxStub.restore();

    try {
      // the library writes to a directory, so we need to clean it up :(
      fs.rmSync('Users', { recursive: true });
    } catch (e) {
      // do nothing
    }
  });

  it('runs command with filepath flag and successful result', async () => {
    const file = join('Users', 'test', 'path', 'to', 'file');
    const executeServiceStub = sandboxStub
      .stub(ExecuteService.prototype, 'executeAnonymous')
      .resolves({ compiled: true, success: true, logs: log });

    const result = await Run.run(['--file', file]);

    expect(result).to.deep.equal(expectedSuccessResult);
    expect(uxStub.log.calledOnce).to.be.true;

    expect(uxStub.log.firstCall.args[0]).to.include('Compiled successfully.');
    expect(uxStub.log.firstCall.args[0]).to.include('Executed successfully.');
    expect(uxStub.log.firstCall.args[0]).to.include(log);
    expect(executeServiceStub.args[0]).to.deep.equal([
      {
        apexFilePath: file,
      },
    ]);
  });

  it('runs command with filepath + json flags and successful result', async () => {
    const file = join('Users', 'test', 'path', 'to', 'file');
    const executeServiceStub = sandboxStub
      .stub(ExecuteService.prototype, 'executeAnonymous')
      .resolves({ compiled: true, success: true, logs: log });

    const result = await Run.run(['--apexcodefile', file, '--json']);

    expect(result).to.deep.equal(expectedSuccessResult);
    expect(uxStub.log.firstCall.args[0]).to.include('Compiled successfully.');
    expect(uxStub.log.firstCall.args[0]).to.include('Executed successfully.');
    expect(uxStub.log.firstCall.args[0]).to.include(log);
    expect(executeServiceStub.args[0]).to.deep.equal([
      {
        apexFilePath: file,
      },
    ]);
  });

  it('runs default command with json and successful result', async () => {
    const executeServiceStub = sandboxStub
      .stub(ExecuteService.prototype, 'executeAnonymous')
      .resolves({ compiled: true, success: true, logs: log });

    const result = await Run.run(['--json']);

    expect(result).to.deep.equal(expectedSuccessResult);
    expect(uxStub.log.calledOnce).to.be.true;
    expect(uxStub.log.firstCall.args[0]).to.include('Compiled successfully.');
    expect(uxStub.log.firstCall.args[0]).to.include('Executed successfully.');
    expect(uxStub.log.firstCall.args[0]).to.include(log);
    expect(executeServiceStub.args[0]).to.deep.equal([
      {
        userInput: true,
      },
    ]);
  });

  it('runs default command with a  successful result', async () => {
    const executeServiceStub = sandboxStub
      .stub(ExecuteService.prototype, 'executeAnonymous')
      .resolves({ compiled: true, success: true, logs: log });

    const result = await Run.run([]);

    expect(result).to.deep.equal(expectedSuccessResult);
    expect(uxStub.log.calledOnce).to.be.true;
    expect(uxStub.log.firstCall.args[0]).to.include('Compiled successfully.');
    expect(uxStub.log.firstCall.args[0]).to.include('Executed successfully.');
    expect(uxStub.log.firstCall.args[0]).to.include(log);
    expect(executeServiceStub.args[0]).to.deep.equal([
      {
        userInput: true,
      },
    ]);
  });

  it('throws an error when it fails to compile', async () => {
    sandboxStub.stub(ExecuteService.prototype, 'executeAnonymous').resolves({
      compiled: false,
      success: false,
      diagnostic: [
        {
          lineNumber: 11,
          columnNumber: 1,
          compileProblem: 'problem compiling',
          exceptionMessage: 'exception',
          exceptionStackTrace: 'exception stack',
          className: 'testClass',
        },
      ],
    });
    try {
      await Run.run(['--json']);
    } catch (e) {
      const err = e as SfError;
      expect(err.name).to.equal('executeCompileFailure');
      expect(err.data).to.deep.equal({
        success: false,
        compiled: false,
        compileProblem: 'problem compiling',
        exceptionMessage: 'exception',
        exceptionStackTrace: 'exception stack',
        line: 11,
        logs: undefined,
        column: 1,
      });
    }
  });

  it('throws an error when it has a runtime error', async () => {
    sandboxStub.stub(ExecuteService.prototype, 'executeAnonymous').resolves({
      compiled: true,
      success: false,
      diagnostic: [
        {
          lineNumber: 11,
          columnNumber: 1,
          compileProblem: 'runtime error',
          exceptionMessage: 'exception',
          exceptionStackTrace: 'exception stack',
          className: 'testClass',
        },
      ],
    });
    try {
      await Run.run(['--json']);
    } catch (e) {
      const err = e as SfError;
      expect(err.name).to.equal('executeRuntimeFailure');
      expect(err.data).to.deep.equal({
        success: false,
        compiled: true,
        compileProblem: 'runtime error',
        exceptionMessage: 'exception',
        exceptionStackTrace: 'exception stack',
        line: 11,
        logs: undefined,
        column: 1,
      });
    }
  });
});
