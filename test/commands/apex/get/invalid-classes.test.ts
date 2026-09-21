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
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { Org, SfError } from '@salesforce/core';
import GetInvalidClasses from '../../../../src/commands/apex/get/invalid-classes.js';
import type { CompilationResult } from '../../../../src/commands/apex/get/invalid-classes.js';

describe('apex get invalid-classes', () => {
  let sandbox: sinon.SinonSandbox;
  let uxStub: ReturnType<typeof stubSfCommandUx>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    uxStub = stubSfCommandUx(sandbox);
  });

  afterEach(() => {
    sandbox.restore();
  });

  const stubOrg = (requestStub: sinon.SinonStub): void => {
    sandbox.stub(Org, 'create').resolves({
      getConnection: () => ({
        tooling: {
          request: requestStub,
          _baseUrl: () => '/services/data/v68.0/tooling',
        },
      }),
    } as unknown as Org);
  };

  it('returns empty results when no invalid classes', async () => {
    const mockResult: CompilationResult = { status: 'success', results: [] };
    const requestStub = sandbox.stub().resolves(mockResult);
    stubOrg(requestStub);

    const result = await GetInvalidClasses.run([]);
    expect(result).to.deep.equal(mockResult);
    expect(uxStub.log.calledOnce).to.be.true;
    expect(uxStub.table.called).to.be.false;
  });

  it('displays invalid classes in table format', async () => {
    const mockResult: CompilationResult = {
      status: 'success',
      results: [
        {
          name: 'BrokenClass',
          namespace: '',
          success: false,
          problems: [{ line: 10, column: 5, message: 'Unexpected token: }' }],
        },
        {
          name: 'AnotherClass',
          namespace: 'ns',
          success: false,
          problems: [
            { line: 25, column: 1, message: 'Invalid declaration' },
            { line: 30, column: 10, message: 'Syntax error' },
          ],
        },
      ],
    };
    const requestStub = sandbox.stub().resolves(mockResult);
    stubOrg(requestStub);

    const result = await GetInvalidClasses.run([]);
    expect(result).to.deep.equal(mockResult);
    expect(uxStub.table.calledOnce).to.be.true;
  });

  it('suppresses table when --json is passed', async () => {
    const mockResult: CompilationResult = {
      status: 'success',
      results: [
        {
          name: 'BrokenClass',
          namespace: '',
          success: false,
          problems: [{ line: 1, column: 1, message: 'Error' }],
        },
      ],
    };
    const requestStub = sandbox.stub().resolves(mockResult);
    stubOrg(requestStub);

    const result = await GetInvalidClasses.run(['--json']);
    expect(result).to.deep.equal(mockResult);
    expect(uxStub.table.called).to.be.false;
  });

  it('makes correct POST request to apexCompileResults endpoint', async () => {
    const requestStub = sandbox.stub().resolves({ status: 'success', results: [] });
    stubOrg(requestStub);

    await GetInvalidClasses.run([]);

    expect(requestStub.calledOnce).to.be.true;
    const callArgs = requestStub.firstCall.args[0] as Record<string, unknown>;
    expect(callArgs.url).to.include('/apexCompileResults');
    expect(callArgs.method).to.equal('POST');
    expect((callArgs.headers as Record<string, string>)['Content-Type']).to.equal('application/json');
    expect(callArgs.body).to.equal('{}');
  });

  it('handles multiple problems per class', async () => {
    const mockResult: CompilationResult = {
      status: 'success',
      results: [
        {
          name: 'ComplexClass',
          namespace: 'testNs',
          success: false,
          problems: [
            { line: 5, column: 1, message: 'Error 1' },
            { line: 15, column: 20, message: 'Error 2' },
            { line: 42, column: 8, message: 'Error 3' },
          ],
        },
      ],
    };
    const requestStub = sandbox.stub().resolves(mockResult);
    stubOrg(requestStub);

    const result = await GetInvalidClasses.run([]);
    expect(result.results[0].problems).to.have.lengthOf(3);
  });

  it('throws when the API request fails', async () => {
    const requestStub = sandbox.stub().rejects(new SfError('INVALID_SESSION_ID'));
    stubOrg(requestStub);

    try {
      await GetInvalidClasses.run([]);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).to.have.property('message').that.includes('INVALID_SESSION_ID');
    }
  });

  it('handles missing results array gracefully', async () => {
    const requestStub = sandbox.stub().resolves({ status: 'success' });
    stubOrg(requestStub);

    const result = await GetInvalidClasses.run([]);
    expect(result.results).to.be.undefined;
    expect(uxStub.log.calledOnce).to.be.true;
  });
});
