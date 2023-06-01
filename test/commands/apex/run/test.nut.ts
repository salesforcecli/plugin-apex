/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import * as fs from 'fs';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect, config } from 'chai';
import { TestRunIdResult } from '@salesforce/apex-node/lib/src/tests/types';
import { RunResult } from '../../../../src/reporters';

config.truncateThreshold = 0;

describe('apex run test', () => {
  let session: TestSession;
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
  });

  after(async () => {
    await session?.zip(undefined, 'artifacts');
    await session?.clean();
  });

  describe('--result-format', () => {
    it('will print tap format', async () => {
      const result = execCmd('apex:run:test --result-format tap --wait 10', { ensureExitCode: 0 }).shellOutput.stdout;
      expect(result).to.include('1..1');
      expect(result).to.include('ok 1');
      expect(result).to.include('--result-format <format>" to retrieve test results in a different format.');
    });
    it('will print junit format', async () => {
      const result = execCmd('apex:run:test --result-format junit --wait 10', { ensureExitCode: 0 }).shellOutput.stdout;
      expect(result).to.include('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).to.include('<testsuites>');
      expect(result).to.include('<testsuite name="force.apex" timestamp="');
      expect(result).to.include(
        '<testcase name="testGetPicturesWithResults" classname="TestPropertyController" time="'
      );
    });
  });

  describe('--code-coverage', () => {
    it('will run default tests sync with --code-coverage', async () => {
      const result = execCmd('apex:run:test --wait 10 --code-coverage', { ensureExitCode: 0 }).shellOutput.stdout;
      expect(result).to.include('=== Apex Code Coverage by Class');
      expect(result).to.match(/CLASSES\s+PERCENT\s+UNCOVERED LINES/);
      expect(result).to.include('SampleDataController  100%');
    });
    it('will run default tests sync with --code-coverage --json', async () => {
      const result = execCmd<RunResult>('apex:run:test --wait 10 --code-coverage --json', { ensureExitCode: 0 })
        .jsonOutput?.result;
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
        'userId',
        'orgWideCoverage',
        'testRunCoverage'
      );

      expect(result?.coverage?.coverage[0]).to.have.all.keys(
        'id',
        'name',
        'lines',
        'totalLines',
        'totalCovered',
        'coveredPercent'
      );
    });
    it('will run default tests sync with --code-coverage --detailed-coverage', async () => {
      const result = execCmd('apex:run:test --wait 10 --code-coverage --detailed-coverage', { ensureExitCode: 0 })
        .shellOutput.stdout;
      expect(result).to.include('=== Apex Code Coverage for Test Run 707');
      expect(result).to.match(/TEST NAME\s+CLASS BEING TESTED\s+OUTCOME\s+PERCENT\s+MESSAGE\s+RUNTIME \(MS\)/);
    });
  });

  it('will create --output-dir', () => {
    const result = execCmd('apex:run:test --output-dir testresults --code-coverage --wait 10', { ensureExitCode: 0 })
      .shellOutput.stdout;
    expect(result).to.include('Test result files written to testresults');
    const outputDir = path.join(session.project.dir, 'testresults');
    expect(fs.statSync(outputDir).isDirectory()).to.be.true;
    expect(fs.readdirSync(outputDir).length).to.equal(6);
    expect(fs.existsSync(path.join(outputDir, 'test-result-codecoverage.json'))).to.be.true;
    expect(fs.existsSync(path.join(outputDir, 'test-result.txt'))).to.be.true;
    expect(fs.existsSync(path.join(outputDir, 'test-run-id.txt'))).to.be.true;
  });
  it('will run default tests and wait', async () => {
    const result = execCmd('apex:run:test --wait 10', { ensureExitCode: 0 }).shellOutput.stdout;
    expect(result).to.include('Outcome');
    expect(result).to.include('Passed');
    expect(result).to.include('GeocodingServiceTest.blankAddress');
    expect(result).to.include('TestPropertyController.testGetPicturesWithResults');
  });

  it('will run default tests and wait --json', async () => {
    const result = execCmd<RunResult>('apex:run:test --wait 10 --json', { ensureExitCode: 0 }).jsonOutput?.result;
    expect(result?.tests.length).to.equal(11);
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

  it('will run specified classes --class-names', async () => {
    const result = execCmd('apex:run:test -w 10 --class-names TestPropertyController', { ensureExitCode: 0 })
      .shellOutput.stdout;
    expect(result).to.match(/Tests Ran\s+3/);

    const result1 = execCmd('apex:run:test -w 10 --class-names TestPropertyController -n GeocodingServiceTest', {
      ensureExitCode: 0,
    }).shellOutput.stdout;
    expect(result1).to.match(/Tests Ran\s+6/);

    const result2 = execCmd(
      'apex:run:test -w 10 --class-names TestPropertyController -n GeocodingServiceTest,FileUtilitiesTest',
      {
        ensureExitCode: 0,
      }
    ).shellOutput.stdout;
    expect(result2).to.match(/Tests Ran\s+10/);
  });

  it('will run specified tests --tests', async () => {
    const result = execCmd('apex:run:test -w 10 --tests TestPropertyController', { ensureExitCode: 0 }).shellOutput
      .stdout;
    expect(result).to.match(/Tests Ran\s+3/);

    const result1 = execCmd('apex:run:test -w 10 --tests TestPropertyController -t GeocodingServiceTest', {
      ensureExitCode: 0,
    }).shellOutput.stdout;
    expect(result1).to.match(/Tests Ran\s+6/);

    const result2 = execCmd(
      'apex:run:test -w 10 --tests TestPropertyController -t GeocodingServiceTest,FileUtilitiesTest',
      {
        ensureExitCode: 0,
      }
    ).shellOutput.stdout;
    expect(result2).to.match(/Tests Ran\s+10/);
  });

  it('will run default tests and default async --json', async () => {
    const result = execCmd<TestRunIdResult>('apex:run:test --json', { ensureExitCode: 0 }).jsonOutput?.result;
    expect(result?.testRunId).to.be.a('string');
    expect(result?.testRunId.startsWith('707')).to.be.true;
    // get the test results to make sure it's not 'ALREADY IN PROGRESS' or 'QUEUED' for the next test
    execCmd(`apex:get:test -i ${result?.testRunId}`, { ensureExitCode: 0 });
  });

  it('will run default tests and default async', async () => {
    const result = execCmd('apex:run:test', { ensureExitCode: 0 }).shellOutput.stdout;
    expect(result).to.include('apex get test -i 707');
    expect(result).to.include('-o');
    expect(result).to.include('" to retrieve test results');
    // .match returns RegExpArray | undefined, and typing ?[0] makes TS think it's a ternary, not an undefined array accessor
    // and we can't use ?.at yet
    const id = result.match(/707[\d\w]+\s/)?.find((i) => i);
    // get the test results to make sure it's not 'ALREADY IN PROGRESS' or 'QUEUED' for the next test
    execCmd(`apex:get:test -i ${id}`, { ensureExitCode: 0 });
  });
});
