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
import path from 'node:path';
import fs from 'node:fs';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect, config } from 'chai';
import { TestRunIdResult } from '@salesforce/apex-node/lib/src/tests/types.js';
import { RunResult } from '../../../../src/reporters/index.js';

config.truncateThreshold = 0;

describe('logic run test', () => {
  let session: TestSession;
  before(async () => {
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/trailheadapps/dreamhouse-lwc.git',
      },
      devhubAuthStrategy: 'AUTO',
      scratchOrgs: [
        {
          config: path.resolve('test', 'nuts', 'unifiedFrameworkProject', 'config', 'project-scratch-def.json'),
          setDefault: true,
          alias: 'org',
        },
      ],
    });

    // Add flow to the project
    const flowXml = path.join('test', 'nuts', 'unifiedFrameworkProject', 'force-app', 'main', 'default', 'flows', 'Populate_opp_description.flow-meta.xml');
    const flowsDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'flows');
    const targetFile = path.join(flowsDir, 'Populate_opp_description.flow-meta.xml');
    fs.copyFileSync(flowXml, targetFile);
    // Add flow test to the project
    const flowTestXml = path.join('test', 'nuts', 'unifiedFrameworkProject', 'force-app', 'main', 'default', 'flowtests', 'test_opportunity_updates.flowtest-meta.xml');
    const flowTestsDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'flowtests');
    const targetTestFile = path.join(flowTestsDir, 'test_opportunity_updates.flowtest-meta.xml');
    fs.mkdirSync(flowTestsDir, { recursive: true });
    fs.copyFileSync(flowTestXml, targetTestFile);  const sfdxProjectPath = path.join(session.project.dir, 'sfdx-project.json');
  
    // We need to update the sourceApiVersion to 65.0 because the changes ub the api are not supported in 64.0
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const sfdxProject = JSON.parse(fs.readFileSync(sfdxProjectPath, 'utf8'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    sfdxProject.sourceApiVersion = parseInt(sfdxProject.sourceApiVersion, 10) < 65 ? '65.0' : sfdxProject.sourceApiVersion;
    fs.writeFileSync(sfdxProjectPath, JSON.stringify(sfdxProject, null, 2));

    execCmd('project:deploy:start -o org --source-dir force-app', { ensureExitCode: 0, cli: 'sf' });
  });

  after(async () => {
    await session?.zip(undefined, 'artifacts');
    await session?.clean();
  });

  describe('--test-category', () => {
    it('will run tests with Apex category', async () => {
      const result = execCmd('logic:run:test --test-category Apex --test-level RunLocalTests --wait 10', { 
        ensureExitCode: 0 
      }).shellOutput.stdout;
      expect(result).to.include('CATEGORY');
      expect(result).to.include('Apex');
      expect(result).to.not.include('Flow');
    });

    it('will run tests with Flow category', async () => {
      const result = execCmd('logic:run:test --test-category Flow --test-level RunLocalTests --wait 10', { 
        ensureExitCode: 0 
      }).shellOutput.stdout;
      expect(result).to.include('CATEGORY');
      expect(result).to.include('Flow');
      expect(result).to.not.include('Apex');
    });

    it('will run tests with multiple categories', async () => {
      const result = execCmd('logic:run:test --test-category Apex --test-category Flow --test-level RunLocalTests --wait 10', { 
        ensureExitCode: 0 
      }).shellOutput.stdout;
      expect(result).to.include('CATEGORY');
      expect(result).to.include('Apex');
      expect(result).to.include('Flow');
    });
  });

  describe('--class-names', () => {
    it('will run specified class', async () => {
      const result = execCmd('logic:run:test --class-names GeocodingServiceTest --wait 10', { 
        ensureExitCode: 0 
      }).shellOutput.stdout;
      expect(result).to.match(/Tests Ran\s+3/);
      expect(result).to.include('GeocodingServiceTest');
      expect(result).to.include('CATEGORY');
      expect(result).to.include('Apex');
    });

    it('will run multiple specified classes from different categories', async () => {
      const result = execCmd('logic:run:test --class-names GeocodingServiceTest --class-names FlowTesting.Populate_opp_description --wait 10', { 
        ensureExitCode: 0 
      }).shellOutput.stdout;
      expect(result).to.match(/Tests Ran\s+4/);
      expect(result).to.include('CATEGORY');
      expect(result).to.include('Apex');
      expect(result).to.include('Flow');
    });
  });  

  describe('--tests', () => {
    it('will run specified test methods', async () => {
      const result = execCmd('logic:run:test --tests FlowTesting.Populate_opp_description.test_opportunity_updates --wait 10', { 
        ensureExitCode: 0 
      }).shellOutput.stdout;
      expect(result).to.match(/Tests Ran\s+1/);
      expect(result).to.include('CATEGORY');
      expect(result).to.include('Flow');
      expect(result).to.include('Populate_opp_description.test_opportunity_updates');
    });

    it('will run multiple test methods from different categories', async () => {
      const result = execCmd('logic:run:test --tests TestPropertyController.testGetPicturesWithResults --tests FlowTesting.Populate_opp_description.test_opportunity_updates --wait 10', { 
        ensureExitCode: 0 
      }).shellOutput.stdout;
      expect(result).to.match(/Tests Ran\s+2/);
      expect(result).to.include('CATEGORY');
      expect(result).to.include('Apex');
      expect(result).to.include('Flow');
      expect(result).to.include('TestPropertyController.testGetPicturesWithResults');
      expect(result).to.include('Populate_opp_description.test_opportunity_updates');
    });
  });

  describe('JSON output', () => {
    it('will run tests and return JSON with Category property', async () => {
      const result = execCmd<RunResult>('logic:run:test --test-level RunLocalTests --wait 10 --json', { 
        ensureExitCode: 0 
      }).jsonOutput?.result;
      expect(result?.tests.length).to.be.greaterThan(0);
      expect(result?.summary.outcome).to.equal('Passed');
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
        'Category',
        'MethodName',
        'Outcome',
        'ApexClass',
        'RunTime',
        'FullName'
      );
    });
  });

  describe('async execution', () => {
    it('will run tests async and return test run id', async () => {
      const result = execCmd<TestRunIdResult>('logic:run:test --test-category Flow --test-level RunLocalTests --json', { 
        ensureExitCode: 0 
      }).jsonOutput?.result;
      expect(result?.testRunId).to.be.a('string');
      expect(result?.testRunId.startsWith('707')).to.be.true;
    });
  });

  describe('--synchronous', () => {
    it('will run tests synchronously', async () => {
      const result = execCmd('logic:run:test --test-category Apex --test-level RunLocalTests --synchronous', { 
        ensureExitCode: 0 
      }).shellOutput.stdout;
      expect(result).to.include('Outcome');
      expect(result).to.include('CATEGORY');
      expect(result).to.include('Apex');
      expect(result).to.include('Passed');
    });
  });
});
