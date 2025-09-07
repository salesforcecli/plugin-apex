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
import { expect, config } from 'chai';
import { colorize } from '../src/logColorize.js';
config.truncateThreshold = 0;

describe('Colorize Logs', () => {
  it('should color time/date format correctly', () => {
    const testData = '12:47:29.584';
    const coloredData = colorize(testData);
    expect(coloredData).to.eql(
      '\u001b[94m12\u001b[39m:\u001b[94m47\u001b[39m:\u001b[94m29\u001b[39m.\u001b[94m584\u001b[39m'
    );
  });

  it('should color exception message correctly', () => {
    const testData =
      '$CalloutInTestmethodException: Methods defined as TestMethod do not support Web service callouts"';
    const coloredData = colorize(testData);
    expect(coloredData).to.eql(
      '$\u001b[1m\u001b[31mCalloutInTestmethodException\u001b[39m\u001b[22m: Methods defined as TestMethod do not support Web service callouts"'
    );
  });

  it('should color debug message correctly', () => {
    const testData = 'SYSTEM,DEBUG;VALIDATION';
    const coloredData = colorize(testData);
    expect(coloredData).to.eql('SYSTEM,\u001b[1m\u001b[36mDEBUG\u001b[39m\u001b[22m;VALIDATION');
  });

  it('should color basic strings correctly', () => {
    const testData = 'testdevhub@ria.com';
    const coloredData = colorize(testData);
    expect(coloredData).to.eql('testdevhub@\u001b[94mria.com\u001b[39m');
  });

  it('should color info text correctly', () => {
    const testData = 'APEX_PROFILING,INFO;';
    const coloredData = colorize(testData);
    expect(coloredData).to.eql('APEX_PROFILING,\u001b[1m\u001b[32mINFO\u001b[39m\u001b[22m;');
  });

  it('should color warn text correctly', () => {
    const testData = 'APEX_PROFILING,WARN;';
    const coloredData = colorize(testData);
    expect(coloredData).to.eql('APEX_PROFILING,\u001b[1m\u001b[33mWARN\u001b[39m\u001b[22m;');
  });
});
