/*
 * Copyright 2025, Salesforce, Inc.
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
import { expect } from 'chai';
import { JsonReporter } from '../../src/reporters/index.js';
import {
  jsonResult,
  testRunSimple,
  runWithCoverage,
  jsonWithCoverage,
  runWithFailures,
  failureResult,
  runWithMixed,
  mixedResult,
} from '../testData.js';

describe('JSON Test Reporter', () => {
  it('should report successful test results without code coverage', () => {
    const reporter = new JsonReporter();
    const formatted = reporter.format(testRunSimple);
    expect(formatted).to.deep.equal(jsonResult);
  });

  it('should report test results with code coverage', () => {
    const reporter = new JsonReporter();
    const formatted = reporter.format(runWithCoverage);
    expect(formatted).to.deep.equal(jsonWithCoverage);
  });

  it('should report results with test failures', () => {
    const reporter = new JsonReporter();
    const formatted = reporter.format(runWithFailures);
    expect(formatted).to.deep.equal(failureResult);
  });

  it('should report results with skipped tests', () => {
    const reporter = new JsonReporter();
    const formatted = reporter.format(runWithMixed);
    expect(formatted).to.deep.equal(mixedResult);
  });
});
