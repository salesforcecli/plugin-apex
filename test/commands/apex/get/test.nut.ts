/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import * as fs from 'fs';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { RunResult } from '../../../../src/reporters';

describe('apex get test', () => {
  let session: TestSession;
  let testId: string | undefined;
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

    execCmd('project:deploy:start -o org --source-dir force-app', { ensureExitCode: 0 });
    testId = execCmd<RunResult>('apex:test:run', { ensureExitCode: 0 }).jsonOutput?.result?.summary?.testRunId;
    expect(testId).to.be.a('string');
  });

  after(async () => {
    await session?.zip(undefined, 'artifacts');
    await session?.clean();
  });

  describe('--result-format', () => {
    it('will print tap format', async () => {
      const result = execCmd(`apex:get:test --result-format tap --test-run-id ${testId}`, { ensureExitCode: 0 })
        .shellOutput.stdout;
      expect(result).to.include('1..1');
      expect(result).to.include('ok 1');
      expect(result).to.include('--result-format <format>" to retrieve test results in a different format.');
    });
    it('will print junit format', async () => {
      const result = execCmd(`apex:get:test --result-format junit --test-run-id ${testId}`, { ensureExitCode: 0 })
        .shellOutput.stdout;
      expect(result).to.include('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).to.include('<testsuites>');
      expect(result).to.include('<testsuite name="force.apex" timestamp="');
      expect(result).to.include(
        '<testcase name="testGetPicturesWithResults" classname="TestPropertyController" time="'
      );
    });
  });

  it('will run report on test', async () => {
    const result = execCmd(`apex:get:test --test-run-id ${testId}`, { ensureExitCode: 0 }).shellOutput.stdout;
    expect(result).to.include('=== Test Summary');
    expect(result).to.include('=== Test Results');
  });

  it('will get tests --json', async () => {
    const result = execCmd<RunResult>(`apex:get:test ${testId} --json`, { ensureExitCode: 0 }).jsonOutput?.result;
    expect(result?.tests).length.to.equal(11);
    expect(result?.summary.outcome).to.equal('Passed');
    expect(result?.summary.testsRan).to.equal(11);
    expect(result?.summary).to.have.all.keys(
      'outcome',
      'testsRan',
      'passing',
      'failing',
      'skipped',
      'passRate',
      'failRate',
      'testStartTime',
      'testExecutionTime',
      'testTotalTime',
      'commandTime',
      'hostname',
      'orgId',
      'username',
      'testRunId',
      'userId'
    );
    expect(result?.tests[0]).to.have.all.keys(
      'Id',
      'QueueItemId',
      'StackTrace',
      'Message',
      'AsyncApexJobId',
      'MethodName',
      'Outcome',
      'ApexClass',
      'RunTime',
      'FullName'
    );
  });

  describe('--code-coverage', () => {
    it('will run default tests sync with --code-coverage', async () => {
      const result = execCmd(`apex:get:test --test-run-id ${testId} --code-coverage`, { ensureExitCode: 0 }).shellOutput
        .stdout;
      expect(result).to.include('=== Apex Code Coverage by Class');
      expect(result).to.include(/CLASSES\w+PERCENT\w+UNCOVERED LINES/);
      expect(result).to.include('SampleDataController  100%');
    });
    it('will run default tests sync with --code-coverage --json', async () => {
      const result = execCmd<RunResult>(`apex:get:test --test-run-id ${testId} --code-coverage --json`, {
        ensureExitCode: 0,
      }).jsonOutput?.result;
      expect(result?.summary).to.have.all.keys('totalLines', 'coveredLines', 'orgWideCoverage', 'testRunCoverage');
      expect(result?.coverage?.coverage).to.have.all.keys(
        'id',
        'name',
        'lines',
        'totalLines',
        'totalCovered',
        'coveredPercent'
      );
    });
    it('will run default tests sync with --code-coverage --detailed-coverage', async () => {
      const result = execCmd(`apex:get:test --test-run-id ${testId} --code-coverage --detailed-coverage`, {
        ensureExitCode: 0,
      }).shellOutput.stdout;
      expect(result).to.include('=== Apex Code Coverage for Test Run 707');
      expect(result).to.include(/TEST NAME\w+CLASS BEING TESTED\w+OUTCOME\w+PERCENT\w+MESSAGE\w+RUNTIME (MS)/);
    });
  });

  it('will create --output-dir', () => {
    const result = execCmd(`apex:get:test --output-dir testresults --code-coverage --test-run-id ${testId}`, {
      ensureExitCode: 0,
    }).shellOutput.stdout;
    expect(result).to.include('Test result files written to testresults');
    const outputDir = path.join(session.project.dir, 'testresults');
    expect(fs.statSync(outputDir).isDirectory()).to.be.true;
    expect(fs.readdirSync(outputDir)).length.to.equal(6);
    expect(fs.existsSync(path.join(outputDir, 'test-result-codecoverage.json'))).to.be.true;
    expect(fs.existsSync(path.join(outputDir, 'test-result.txt'))).to.be.true;
    expect(fs.existsSync(path.join(outputDir, 'test-run-id.txt'))).to.be.true;
  });
});
