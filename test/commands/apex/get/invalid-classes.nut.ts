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

import path from 'node:path';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { config, expect } from 'chai';
import type { CompilationResult } from '../../../../src/commands/apex/get/invalid-classes.js';

config.truncateThreshold = 0;

describe('apex get invalid-classes NUT', () => {
  let session: TestSession;
  let invalidClassId: string | undefined;

  before(async () => {
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/trailheadapps/dreamhouse-lwc.git',
      },
      devhubAuthStrategy: 'AUTO',
      scratchOrgs: [
        {
          config: path.join('config', 'project-scratch-def.json'),
          setDefault: true,
          alias: 'org',
        },
      ],
    });

    execCmd('project:deploy:start -o org --source-dir force-app', { ensureExitCode: 0, cli: 'sf' });
  });

  after(async () => {
    if (invalidClassId) {
      execCmd(`api:rest "/tooling/sobjects/ApexClass/${invalidClassId}" --method DELETE -o org`, { cli: 'sf' });
    }
    await session?.clean();
  });

  it('all valid: should return no invalid classes on a clean org', () => {
    const result = execCmd<CompilationResult>('apex:get:invalid-classes --json -o org', {
      ensureExitCode: 0,
    });
    expect(result.jsonOutput?.result).to.have.property('status');
    expect(result.jsonOutput?.result.results).to.be.an('array').with.lengthOf(0);
  });

  it('all invalid: should return invalid classes after introducing broken Apex', () => {
    const createResponse = execCmd<{ id: string }>(
      `api:rest "/tooling/sobjects/ApexClass" --method POST --body '${JSON.stringify({
        Name: 'NutBrokenClass',
        Body: 'public class NutBrokenClass { this is intentionally broken syntax }',
      })}' -o org --json`,
      { ensureExitCode: 0, cli: 'sf' }
    );
    invalidClassId = createResponse.jsonOutput?.result?.id;
    expect(invalidClassId).to.be.a('string');

    const result = execCmd<CompilationResult>('apex:get:invalid-classes --json -o org', {
      ensureExitCode: 0,
    });
    const compilationResult = result.jsonOutput?.result;
    expect(compilationResult).to.have.property('status');
    expect(compilationResult?.results).to.be.an('array').with.length.greaterThan(0);

    const brokenEntry = compilationResult?.results.find((r) => r.name === 'NutBrokenClass');
    expect(brokenEntry).to.be.ok;
    expect(brokenEntry?.success).to.equal(false);
    expect(brokenEntry?.problems).to.be.an('array').with.length.greaterThan(0);
    expect(brokenEntry?.problems[0]).to.have.property('message').that.is.a('string');
    expect(brokenEntry?.problems[0]).to.have.property('line').that.is.a('number');
  });

  it('mixed: should show only invalid classes alongside valid deployed code', () => {
    const result = execCmd<CompilationResult>('apex:get:invalid-classes --json -o org', {
      ensureExitCode: 0,
    });
    const compilationResult = result.jsonOutput?.result;
    expect(compilationResult?.results).to.be.an('array');

    for (const entry of compilationResult?.results ?? []) {
      expect(entry).to.have.property('name').that.is.a('string');
      expect(entry).to.have.property('namespace').that.is.a('string');
      expect(entry).to.have.property('success').that.is.a('boolean');
      expect(entry).to.have.property('problems').that.is.an('array');
    }

    const validDreamhouseClasses = compilationResult?.results.filter((r) => r.name !== 'NutBrokenClass') ?? [];
    expect(validDreamhouseClasses).to.have.lengthOf(0);
  });

  it('back to valid: should return no invalid classes after removing broken Apex', () => {
    expect(invalidClassId).to.be.a('string');
    execCmd(`api:rest "/tooling/sobjects/ApexClass/${invalidClassId}" --method DELETE -o org`, {
      ensureExitCode: 0,
      cli: 'sf',
    });
    invalidClassId = undefined;

    const result = execCmd<CompilationResult>('apex:get:invalid-classes --json -o org', {
      ensureExitCode: 0,
    });
    expect(result.jsonOutput?.result.results).to.be.an('array').with.lengthOf(0);
  });

  it('human-readable: should display output without --json', () => {
    const result = execCmd('apex:get:invalid-classes -o org', {
      ensureExitCode: 0,
    });
    expect(result).to.be.ok;
  });
});
