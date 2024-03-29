/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from 'chai';
import { JsonReporter } from '../src/reporters/index.js';
import {
  jsonResult,
  testRunSimple,
  runWithCoverage,
  jsonWithCoverage,
  runWithFailures,
  failureResult,
  runWithMixed,
  mixedResult,
} from './testData.js';

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
