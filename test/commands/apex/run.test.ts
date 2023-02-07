/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { resolve } from 'path';
import * as fs from 'fs';
import { expect } from 'chai';
import { ExecuteService } from '@salesforce/apex-node';
import { createSandbox, SinonSandbox } from 'sinon';
import { Org } from '@salesforce/core';
import { Config } from '@oclif/core';
import { SfCommand } from '@salesforce/sf-plugins-core';
import Run from '../../../src/commands/apex/run';

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

const compileProblem = {
  column: 1,
  line: 11,
  compiled: false,
  compileProblem: 'problem compiling',
  exceptionMessage: 'exception',
  exceptionStackTrace: 'exception stack',
  success: false,
  logs: undefined,
};

const runtimeProblem = {
  logs: undefined,
  column: 1,
  line: 11,
  compiled: true,
  compileProblem: '',
  exceptionMessage: 'problem at runtime',
  exceptionStackTrace: 'Issue in mock file',
  success: false,
};

describe('apex:execute', () => {
  let sandboxStub: SinonSandbox;
  let logStub: sinon.SinonStub;
  const config = new Config({ root: resolve(__dirname, '../../package.json') });

  beforeEach(() => {
    sandboxStub = createSandbox();
    logStub = sandboxStub.stub(SfCommand.prototype, 'log');

    sandboxStub.stub(Org, 'create').resolves(Org.prototype);
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
    const file = path.join('Users', 'test', 'path', 'to', 'file');
    const executeServiceStub = sandboxStub
      .stub(ExecuteService.prototype, 'executeAnonymous')
      .resolves({ compiled: true, success: true, logs: log });

    const result = await new Run(['--apexcodefile', file], config).run();

    expect(result).to.deep.equal(expectedSuccessResult);
    expect(logStub.calledTwice).to.be.true;

    expect(logStub.secondCall.args[0]).to.include('Compiled successfully.');
    expect(logStub.secondCall.args[0]).to.include('Executed successfully.');
    expect(logStub.secondCall.args[0]).to.include(log);
    expect(executeServiceStub.args[0]).to.deep.equal([
      {
        apexFilePath: file,
      },
    ]);
  });

  it('runs command with filepath + json flags and successful result', async () => {
    const file = path.join('Users', 'test', 'path', 'to', 'file');
    const executeServiceStub = sandboxStub
      .stub(ExecuteService.prototype, 'executeAnonymous')
      .resolves({ compiled: true, success: true, logs: log });

    const result = await new Run(['--apexcodefile', file, '--json'], config).run();

    expect(result).to.deep.equal(expectedSuccessResult);
    expect(logStub.calledTwice).to.be.true;
    expect(logStub.secondCall.args[0]).to.include('Compiled successfully.');
    expect(logStub.secondCall.args[0]).to.include('Executed successfully.');
    expect(logStub.secondCall.args[0]).to.include(log);
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

    const result = await new Run(['--json'], config).run();

    expect(result).to.deep.equal(expectedSuccessResult);
    expect(logStub.calledOnce).to.be.true;
    expect(logStub.firstCall.args[0]).to.include('Compiled successfully.');
    expect(logStub.firstCall.args[0]).to.include('Executed successfully.');
    expect(logStub.firstCall.args[0]).to.include(log);
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

    const result = await new Run([], config).run();

    expect(result).to.deep.equal(expectedSuccessResult);
    expect(logStub.calledOnce).to.be.true;
    expect(logStub.firstCall.args[0]).to.include('Compiled successfully.');
    expect(logStub.firstCall.args[0]).to.include('Executed successfully.');
    expect(logStub.firstCall.args[0]).to.include(log);
    expect(executeServiceStub.args[0]).to.deep.equal([
      {
        userInput: true,
      },
    ]);
  });

  it('runs default command with json and compile problem', async () => {
    const executeServiceStub = sandboxStub.stub(ExecuteService.prototype, 'executeAnonymous').resolves({
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

    const result = await new Run(['--json'], config).run();

    expect(result).to.deep.equal(compileProblem);
    expect(logStub.calledOnce).to.be.true;
    expect(logStub.firstCall.args[0]).to.include('Error: Line');
    expect(logStub.firstCall.args[0]).to.include('Error: problem compiling');
    expect(executeServiceStub.args[0]).to.deep.equal([
      {
        userInput: true,
      },
    ]);
  });

  it('runs default command with a compile problem', async () => {
    const executeServiceStub = sandboxStub.stub(ExecuteService.prototype, 'executeAnonymous').resolves({
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

    const result = await new Run([], config).run();

    expect(result).to.deep.equal(compileProblem);
    expect(logStub.calledOnce).to.be.true;
    expect(logStub.firstCall.args[0]).to.include('Error: Line: 11, Column: 1');
    expect(logStub.firstCall.args[0]).to.include('Error: problem compiling');
    expect(executeServiceStub.args[0]).to.deep.equal([
      {
        userInput: true,
      },
    ]);
  });

  it('runs default command with a runtime problem', async () => {
    const executeServiceStub = sandboxStub.stub(ExecuteService.prototype, 'executeAnonymous').resolves({
      compiled: true,
      success: false,
      logs: undefined,
      diagnostic: [
        {
          lineNumber: 11,
          columnNumber: 1,
          compileProblem: '',
          exceptionMessage: 'problem at runtime',
          exceptionStackTrace: 'Issue in mock file',
          className: 'testClass',
        },
      ],
    });

    const result = await new Run([], config).run();

    expect(result).to.deep.equal(runtimeProblem);
    expect(logStub.calledOnce).to.be.true;
    expect(logStub.firstCall.args[0]).to.include('Compiled successfully.');
    expect(logStub.firstCall.args[0]).to.include('Error: problem at runtime');
    expect(logStub.firstCall.args[0]).to.include('Error: Issue in mock file');
    expect(executeServiceStub.args[0]).to.deep.equal([
      {
        userInput: true,
      },
    ]);
  });
});
