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
/* eslint-disable @typescript-eslint/no-unused-vars */
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

  it('passes debug-level flag to executeAnonymous', async () => {
    const file = join('Users', 'test', 'path', 'to', 'file');
    const executeServiceStub = sandboxStub
      .stub(ExecuteService.prototype, 'executeAnonymous')
      .resolves({ compiled: true, success: true, logs: log });

    await Run.run(['--file', file, '--debug-level', 'DETAIL']);

    expect(executeServiceStub.args[0]).to.deep.equal([
      {
        apexFilePath: file,
        debugLevel: 'DETAIL',
      },
    ]);
  });

  it('passes category-level flags to executeAnonymous', async () => {
    const file = join('Users', 'test', 'path', 'to', 'file');
    const executeServiceStub = sandboxStub
      .stub(ExecuteService.prototype, 'executeAnonymous')
      .resolves({ compiled: true, success: true, logs: log });

    await Run.run(['--file', file, '--category-level', 'Apex_code=FINEST', '--category-level', 'Db=FINE']);

    expect(executeServiceStub.args[0]).to.deep.equal([
      {
        apexFilePath: file,
        debugCategories: [
          { category: 'Apex_code', level: 'FINEST' },
          { category: 'Db', level: 'FINE' },
        ],
      },
    ]);
  });

  it('throws on invalid category-level format', async () => {
    sandboxStub.stub(ExecuteService.prototype, 'executeAnonymous').resolves({ compiled: true, success: true });

    try {
      await Run.run(['--file', 'test.apex', '--category-level', 'bad-format']);
      expect.fail('should have thrown');
    } catch (e) {
      expect((e as Error).message).to.include('Invalid --category-level format');
    }
  });

  it('throws on invalid category name', async () => {
    sandboxStub.stub(ExecuteService.prototype, 'executeAnonymous').resolves({ compiled: true, success: true });

    try {
      await Run.run(['--file', 'test.apex', '--category-level', 'FakeCategory=FINEST']);
      expect.fail('should have thrown');
    } catch (e) {
      expect((e as Error).message).to.include('Invalid category');
    }
  });

  it('throws on invalid category level value', async () => {
    sandboxStub.stub(ExecuteService.prototype, 'executeAnonymous').resolves({ compiled: true, success: true });

    try {
      await Run.run(['--file', 'test.apex', '--category-level', 'Apex_code=INVALID']);
      expect.fail('should have thrown');
    } catch (e) {
      expect((e as Error).message).to.include('Invalid level');
    }
  });

  it('deduplicates category-level entries with last-wins', async () => {
    const file = join('Users', 'test', 'path', 'to', 'file');
    const executeServiceStub = sandboxStub
      .stub(ExecuteService.prototype, 'executeAnonymous')
      .resolves({ compiled: true, success: true, logs: log });

    await Run.run(['--file', file, '--category-level', 'Apex_code=DEBUG', '--category-level', 'Apex_code=FINEST']);

    expect(executeServiceStub.args[0]).to.deep.equal([
      {
        apexFilePath: file,
        debugCategories: [{ category: 'Apex_code', level: 'FINEST' }],
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
