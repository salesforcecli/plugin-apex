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

import fs from 'node:fs';
import path from 'node:path';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { config, expect } from 'chai';
import type { CompilationResult } from '../../../../src/commands/apex/get/compile-status.js';

config.truncateThreshold = 0;

const APEX_META_XML = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">',
  '    <apiVersion>62.0</apiVersion>',
  '    <status>Active</status>',
  '</ApexClass>',
].join('\n');

const HELPER_CLASS = [
  'public with sharing class CompileStatusHelper {',
  "    public static final String SOME_CONSTANT = 'hello';",
  '    public static void doSomething(String a, String b) {',
  '        System.debug(a + b);',
  '    }',
  '    public CompileStatusHelper(String arg) {',
  '        System.debug(arg);',
  '    }',
  '}',
].join('\n');

const BROKEN_CLASS = [
  'public with sharing class CompileStatusBroken {',
  '    public static String getBadVariable() {',
  '        return CompileStatusHelper.SOME_CONSTANT;',
  '    }',
  '    public static void callBadMethod() {',
  "        CompileStatusHelper.doSomething('param1', 'param2');",
  '    }',
  '    public static void callBadConstructor() {',
  "        CompileStatusHelper obj = new CompileStatusHelper('arg1');",
  '    }',
  '}',
].join('\n');

describe('apex get compile-status NUT', () => {
  let session: TestSession;
  let classesDir: string;

  before(async () => {
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/trailheadapps/dreamhouse-lwc.git',
      },
      devhubAuthStrategy: 'AUTO',
    });

    classesDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'classes');

    // TODO(2026-10-10): remove --release preview after GA release
    execCmd(
      'org:create:scratch -f config/project-scratch-def.json --set-default --alias org --release preview --wait 10 --duration-days 1',
      { ensureExitCode: 0, cli: 'sf' }
    );

    execCmd('project:deploy:start -o org --source-dir force-app', { ensureExitCode: 0, cli: 'sf' });
  });

  after(async () => {
    try {
      execCmd('org:delete:scratch -o org --no-prompt', { cli: 'sf' });
    } catch {
      // best-effort cleanup
    }
    await session?.zip(undefined, 'artifacts');
    await session?.clean();
  });

  describe('clean org', () => {
    it('reports no compile issues', () => {
      const result = execCmd('apex:get:compile-status', { ensureExitCode: 0 }).shellOutput.stdout;
      expect(result).to.include('No Apex compiler issues found');
    });

    it('returns empty results with --json', () => {
      const result = execCmd<CompilationResult>('apex:get:compile-status --json', { ensureExitCode: 0 }).jsonOutput
        ?.result;
      expect(result?.results).to.be.an('array').with.lengthOf(0);
    });
  });

  describe('org with broken apex references', () => {
    before(() => {
      fs.writeFileSync(path.join(classesDir, 'CompileStatusHelper.cls'), HELPER_CLASS);
      fs.writeFileSync(path.join(classesDir, 'CompileStatusHelper.cls-meta.xml'), APEX_META_XML);
      fs.writeFileSync(path.join(classesDir, 'CompileStatusBroken.cls'), BROKEN_CLASS);
      fs.writeFileSync(path.join(classesDir, 'CompileStatusBroken.cls-meta.xml'), APEX_META_XML);

      execCmd('project:deploy:start -o org --source-dir force-app/main/default/classes', {
        ensureExitCode: 0,
        cli: 'sf',
      });

      execCmd('project:delete:source -o org -m ApexClass:CompileStatusHelper --no-prompt', {
        ensureExitCode: 0,
        cli: 'sf',
      });
    });

    it('shows the broken class in human-readable output', () => {
      const result = execCmd('apex:get:compile-status', { ensureExitCode: 0 }).shellOutput.stdout;
      expect(result).to.include('CompileStatusBroken');
      expect(result).to.include('CompileStatusHelper');
    });

    it('returns problems for the broken class with --json', () => {
      const result = execCmd<CompilationResult>('apex:get:compile-status --json', { ensureExitCode: 0 }).jsonOutput
        ?.result;
      expect(result).to.have.property('status');
      expect(result?.results).to.be.an('array').with.length.greaterThan(0);

      const brokenResult = result?.results.find((r) => r.name === 'CompileStatusBroken');
      expect(brokenResult).to.not.be.undefined;
      expect(brokenResult?.success).to.equal(false);
      expect(brokenResult?.problems).to.be.an('array').with.length.greaterThan(0);

      const problemMessages = brokenResult?.problems.map((p) => p.message) ?? [];
      expect(problemMessages.some((m) => m.includes('CompileStatusHelper'))).to.be.true;
      expect(brokenResult?.warnings).to.be.an('array');
    });

    it('includes line and column info in problems', () => {
      const result = execCmd<CompilationResult>('apex:get:compile-status --json', { ensureExitCode: 0 }).jsonOutput
        ?.result;
      const brokenResult = result?.results.find((r) => r.name === 'CompileStatusBroken');
      expect(brokenResult).to.not.be.undefined;
      expect(brokenResult?.problems).to.be.an('array').that.is.not.empty;
      const problem = brokenResult?.problems[0];
      expect(problem).to.have.property('line').that.is.a('number');
      expect(problem).to.have.property('column').that.is.a('number');
      expect(problem).to.have.property('message').that.is.a('string');
    });
  });
});
