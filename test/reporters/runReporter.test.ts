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
import os from 'node:os';
import { ExecuteAnonymousResponse } from '@salesforce/apex-node';
import { StandardColors } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import { RunReporter } from '../../src/reporters/runReporter.js';

const logs = '47.0 APEX_CODE,DEBUG\nExecute Anonymous: System.debug(1);|EXECUTION_FINISHED\n';

describe('RunReporter', () => {
  describe('formatDefault', () => {
    it('reports compile and runtime success with logs', () => {
      const output = RunReporter.formatDefault({ compiled: true, success: true, logs });

      expect(output).to.equal(
        [
          StandardColors.success('Compiled successfully.'),
          StandardColors.success('Executed successfully.'),
          '',
          logs,
        ].join(os.EOL)
      );
    });

    it('uses an empty log section when logs are omitted', () => {
      const output = RunReporter.formatDefault({ compiled: true, success: true });

      expect(output).to.equal(
        [
          StandardColors.success('Compiled successfully.'),
          StandardColors.success('Executed successfully.'),
          '',
          '',
        ].join(os.EOL)
      );
    });

    it('reports a compile failure with line and column', () => {
      const output = RunReporter.formatDefault({
        compiled: false,
        success: false,
        diagnostic: [
          {
            lineNumber: 4,
            columnNumber: 12,
            compileProblem: 'Unexpected token',
            exceptionMessage: '',
            exceptionStackTrace: '',
          },
        ],
      });

      expect(output).to.equal(
        [StandardColors.error('Error: Ln 4, Col 12'), StandardColors.error('Error: Unexpected token\n')].join(os.EOL)
      );
    });

    it('uses placeholders when a compile failure omits line and column', () => {
      const output = RunReporter.formatDefault({
        compiled: false,
        success: false,
        diagnostic: [
          {
            compileProblem: 'Missing semicolon',
            exceptionMessage: '',
            exceptionStackTrace: '',
          },
        ],
      });

      expect(output).to.equal(
        [
          StandardColors.error('Error: Ln <not provided>, Col <not provided>'),
          StandardColors.error('Error: Missing semicolon\n'),
        ].join(os.EOL)
      );
    });

    it('reports a runtime failure after a successful compile', () => {
      const output = RunReporter.formatDefault({
        compiled: true,
        success: false,
        logs,
        diagnostic: [
          {
            exceptionMessage: 'System.AssertException: Assertion Failed',
            exceptionStackTrace: 'AnonymousBlock: line 2, column 1',
            compileProblem: '',
          },
        ],
      });

      expect(output).to.equal(
        [
          StandardColors.success('Compiled successfully.'),
          StandardColors.error('Error: System.AssertException: Assertion Failed'),
          StandardColors.error('Error: AnonymousBlock: line 2, column 1'),
          '',
          logs,
        ].join(os.EOL)
      );
    });

    it('uses an empty log section for a runtime failure without logs', () => {
      const output = RunReporter.formatDefault({
        compiled: true,
        success: false,
        diagnostic: [
          {
            exceptionMessage: 'System.LimitException',
            exceptionStackTrace: 'AnonymousBlock: line 1, column 1',
            compileProblem: '',
          },
        ],
      });

      expect(output).to.equal(
        [
          StandardColors.success('Compiled successfully.'),
          StandardColors.error('Error: System.LimitException'),
          StandardColors.error('Error: AnonymousBlock: line 1, column 1'),
          '',
          '',
        ].join(os.EOL)
      );
    });

    it('throws when a failed response has no diagnostic', () => {
      const response: ExecuteAnonymousResponse = { compiled: false, success: false };

      expect(() => RunReporter.formatDefault(response)).to.throw('No diagnostic property found on response.');
    });
  });

  describe('formatJson', () => {
    it('defaults diagnostic fields when the response has no diagnostic', () => {
      const result = RunReporter.formatJson({ compiled: true, success: true, logs });

      expect(result).to.deep.equal({
        success: true,
        compiled: true,
        compileProblem: '',
        exceptionMessage: '',
        exceptionStackTrace: '',
        line: -1,
        column: -1,
        logs,
      });
    });

    it('maps the first diagnostic onto the execute result', () => {
      const result = RunReporter.formatJson({
        compiled: false,
        success: false,
        logs,
        diagnostic: [
          {
            lineNumber: 11,
            columnNumber: 3,
            compileProblem: 'Variable does not exist: foo',
            exceptionMessage: 'exception',
            exceptionStackTrace: 'stack',
          },
          {
            lineNumber: 99,
            columnNumber: 1,
            compileProblem: 'ignored',
            exceptionMessage: 'ignored',
            exceptionStackTrace: 'ignored',
          },
        ],
      });

      expect(result).to.deep.equal({
        success: false,
        compiled: false,
        compileProblem: 'Variable does not exist: foo',
        exceptionMessage: 'exception',
        exceptionStackTrace: 'stack',
        line: 11,
        column: 3,
        logs,
      });
    });

    it('defaults missing diagnostic numbers and strings', () => {
      const result = RunReporter.formatJson({
        compiled: true,
        success: false,
        diagnostic: [
          {
            compileProblem: undefined as unknown as string,
            exceptionMessage: undefined as unknown as string,
            exceptionStackTrace: undefined as unknown as string,
          },
        ],
      });

      expect(result).to.deep.equal({
        success: false,
        compiled: true,
        compileProblem: '',
        exceptionMessage: '',
        exceptionStackTrace: '',
        line: -1,
        column: -1,
        logs: undefined,
      });
    });
  });
});
