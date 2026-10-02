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
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unused-vars */
import sinon from 'sinon';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { Org } from '@salesforce/core';
import GetCompileStatus from '../../../../src/commands/apex/get/compile-status.js';
import type { CompilationResult } from '../../../../src/commands/apex/get/compile-status.js';

describe('apex:get:compile-status', () => {
  let sandbox: sinon.SinonSandbox;
  let uxStub: ReturnType<typeof stubSfCommandUx>;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    uxStub = stubSfCommandUx(sandbox);
    sandbox.stub(process, 'on').resolves();
    sandbox.stub(process, 'exit');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('returns compilation result with no invalid classes', async () => {
    const mockCompilationResult: CompilationResult = {
      status: 'success',
      results: [],
    };

    const org = {
      getConnection: sandbox.stub().returns({
        tooling: {
          request: sandbox.stub().resolves(mockCompilationResult),
          _baseUrl: sandbox.stub().returns('/services/data/v68.0/tooling'),
        },
      }),
    };

    sandbox.stub(Org, 'create').resolves(org as unknown as Org);

    const result = await GetCompileStatus.run([]);
    expect(result).to.deep.equal(mockCompilationResult);
    expect(uxStub.log.called).to.be.false;
  });

  it('displays invalid classes in table format without --json flag', async () => {
    const mockCompilationResult: CompilationResult = {
      status: 'success',
      results: [
        {
          name: 'TestClass1',
          namespace: '',
          success: false,
          problems: [
            {
              line: 10,
              column: 5,
              message: 'Unexpected token: }',
            },
          ],
          warnings: [],
        },
        {
          name: 'TestClass2',
          namespace: 'myNamespace',
          success: false,
          problems: [
            {
              line: 25,
              column: 1,
              message: 'Invalid class declaration',
            },
            {
              line: 30,
              column: 10,
              message: 'Syntax error',
            },
          ],
          warnings: [],
        },
      ],
    };

    const org = {
      getConnection: sandbox.stub().returns({
        tooling: {
          request: sandbox.stub().resolves(mockCompilationResult),
          _baseUrl: sandbox.stub().returns('/services/data/v68.0/tooling'),
        },
      }),
    };

    sandbox.stub(Org, 'create').resolves(org as unknown as Org);

    const result = await GetCompileStatus.run([]);
    expect(result).to.deep.equal(mockCompilationResult);
    expect(uxStub.table.calledOnce).to.be.true;

    const tableCall = uxStub.table.firstCall;
    expect(tableCall.args[0]).to.deep.include({
      columns: ['name', 'namespace', 'success', 'problems', 'warnings'],
      title: 'Compile Status Results:',
    });

    const tableData = (tableCall.args[0] as Record<string, unknown>).data as Array<Record<string, unknown>>;
    expect(tableData).to.have.lengthOf(2);
    expect(tableData[0].name).to.equal('TestClass1');
    expect(tableData[0].problems).to.be.a('string');
    expect(JSON.parse(tableData[0].problems as string)).to.deep.equal({
      line: 10,
      column: 5,
      message: 'Unexpected token: }',
    });

    const secondClassProblems = (tableData[1].problems as string).split('\n').map((problem) => JSON.parse(problem));
    expect(secondClassProblems).to.deep.equal([
      {
        line: 25,
        column: 1,
        message: 'Invalid class declaration',
      },
      {
        line: 30,
        column: 10,
        message: 'Syntax error',
      },
    ]);
  });

  it('returns compilation result with --json flag without displaying table', async () => {
    const mockCompilationResult: CompilationResult = {
      status: 'success',
      results: [
        {
          name: 'TestClass1',
          namespace: '',
          success: false,
          warnings: [],
          problems: [
            {
              line: 10,
              column: 5,
              message: 'Unexpected token: }',
            },
          ],
        },
      ],
    };

    const org = {
      getConnection: sandbox.stub().returns({
        tooling: {
          request: sandbox.stub().resolves(mockCompilationResult),
          _baseUrl: sandbox.stub().returns('/services/data/v68.0/tooling'),
        },
      }),
    };

    sandbox.stub(Org, 'create').resolves(org as unknown as Org);
    sandbox.stub(GetCompileStatus.prototype, 'jsonEnabled').returns(true);

    const result = await GetCompileStatus.run(['--json']);
    expect(result).to.deep.equal(mockCompilationResult);
    expect(uxStub.table.called).to.be.false;
  });

  it('makes correct API request to apexCompileResults endpoint', async () => {
    const requestStub = sandbox.stub().resolves({
      status: 'success',
      results: [],
    });

    const org = {
      getConnection: sandbox.stub().returns({
        tooling: {
          request: requestStub,
          _baseUrl: sandbox.stub().returns('/services/data/v68.0/tooling'),
        },
      }),
    };

    sandbox.stub(Org, 'create').resolves(org as unknown as Org);

    await GetCompileStatus.run([]);

    expect(requestStub.calledOnce).to.be.true;
    const callArgs = requestStub.firstCall.args[0];
    expect(callArgs.url).to.include('/apexCompileResults');
    expect(callArgs.method).to.equal('POST');
    expect(callArgs.headers['Content-Type']).to.equal('application/json');
    expect(callArgs.body).to.equal('{}');
  });

  it('registers signal handlers for graceful shutdown', async () => {
    const mockCompilationResult: CompilationResult = {
      status: 'success',
      results: [],
    };

    const org = {
      getConnection: sandbox.stub().returns({
        tooling: {
          request: sandbox.stub().resolves(mockCompilationResult),
          _baseUrl: sandbox.stub().returns('/services/data/v68.0/tooling'),
        },
      }),
    };

    sandbox.stub(Org, 'create').resolves(org as unknown as Org);

    await GetCompileStatus.run([]);

    expect((process.on as sinon.SinonStub).calledWith('SIGINT')).to.be.true;
    expect((process.on as sinon.SinonStub).calledWith('SIGTERM')).to.be.true;
  });

  it('handles multiple problems per class', async () => {
    const mockCompilationResult: CompilationResult = {
      status: 'success',
      results: [
        {
          name: 'ComplexClass',
          namespace: 'testNamespace',
          success: false,
          warnings: [],
          problems: [
            {
              line: 5,
              column: 1,
              message: 'Error 1',
            },
            {
              line: 15,
              column: 20,
              message: 'Error 2',
            },
            {
              line: 42,
              column: 8,
              message: 'Error 3',
            },
          ],
        },
      ],
    };

    const org = {
      getConnection: sandbox.stub().returns({
        tooling: {
          request: sandbox.stub().resolves(mockCompilationResult),
          _baseUrl: sandbox.stub().returns('/services/data/v68.0/tooling'),
        },
      }),
    };

    sandbox.stub(Org, 'create').resolves(org as unknown as Org);

    const result = await GetCompileStatus.run([]);
    expect(result.results[0].problems).to.have.lengthOf(3);
    expect(result.results[0].problems[1].line).to.equal(15);
    expect(result.results[0].problems[2].message).to.equal('Error 3');
  });

  it('handles classes with empty namespace', async () => {
    const mockCompilationResult: CompilationResult = {
      status: 'success',
      results: [
        {
          name: 'LocalClass',
          namespace: '',
          success: false,
          warnings: [],
          problems: [
            {
              line: 1,
              column: 1,
              message: 'Error',
            },
          ],
        },
      ],
    };

    const org = {
      getConnection: sandbox.stub().returns({
        tooling: {
          request: sandbox.stub().resolves(mockCompilationResult),
          _baseUrl: sandbox.stub().returns('/services/data/v68.0/tooling'),
        },
      }),
    };

    sandbox.stub(Org, 'create').resolves(org as unknown as Org);

    const result = await GetCompileStatus.run([]);
    expect(result.results[0].namespace).to.equal('');
  });

  it('converts problem objects to JSON strings in table display', async () => {
    const mockCompilationResult: CompilationResult = {
      status: 'success',
      results: [
        {
          name: 'TestClass',
          namespace: '',
          success: false,
          problems: [
            {
              line: 10,
              column: 5,
              message: 'Test message',
            },
          ],
          warnings: [],
        },
      ],
    };

    const org = {
      getConnection: sandbox.stub().returns({
        tooling: {
          request: sandbox.stub().resolves(mockCompilationResult),
          _baseUrl: sandbox.stub().returns('/services/data/v68.0/tooling'),
        },
      }),
    };

    sandbox.stub(Org, 'create').resolves(org as unknown as Org);

    await GetCompileStatus.run([]);

    const tableCall = uxStub.table.firstCall;
    const tableData = (tableCall.args[0] as Record<string, unknown>).data as Array<Record<string, unknown>>;
    const problemString = tableData[0].problems as string;

    expect(problemString).to.be.a('string');
    const parsedProblem = JSON.parse(problemString);
    expect(parsedProblem.line).to.equal(10);
    expect(parsedProblem.column).to.equal(5);
    expect(parsedProblem.message).to.equal('Test message');
  });
});
