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
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect, config } from 'chai';
import { AuthInfo, Connection } from '@salesforce/core';
import { LogGetResult } from '../../../src/commands/apex/get/log.js';
import { LogListResult } from '../../../src/commands/apex/list/log.js';

config.truncateThreshold = 0;

describe('apex log *', () => {
  let session: TestSession;
  let logId: string | undefined;
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
    await session?.zip(undefined, 'artifacts');
    await session?.clean();
  });

  it('will print no logs found', async () => {
    const result = execCmd('apex:list:log', { ensureExitCode: 0 }).shellOutput.stdout;
    expect(result).to.include('No debug logs found in org');
  });

  it('will print no logs found --json', async () => {
    const result = execCmd<LogGetResult>('apex:list:log --json', { ensureExitCode: 0 }).jsonOutput?.result;
    expect(result?.length).to.equal(0);
  });

  it('will generate the TraceFlag for the user', async () => {
    const conn = await Connection.create({
      authInfo: await AuthInfo.create({ username: session.orgs.get('default')?.username }),
    });
    const query = await conn.singleRecordQuery<{ TracedEntityId: string; DebugLevelId: string }>(
      'SELECT TracedEntityId, DebugLevelId FROM TraceFlag',
      { tooling: true }
    );
    const now = new Date();
    // set it to expire in 24 hours and convert to format
    const expiration = new Date(new Date(now).getTime() + 60 * 60 * 24 * 1000)
      .toISOString()
      .replace(/\.\d{3}Z$/, '+0000');

    await conn.tooling.sobject('TraceFlag').create({
      ExpirationDate: expiration,
      TracedEntityId: query.TracedEntityId,
      LogType: 'USER_DEBUG',
      DebugLevelId: query.DebugLevelId,
    });
  });

  it('will run an apex class to generate logs', async () => {
    const result = execCmd(
      `apex:run --file ${path.join('force-app', 'main', 'default', 'classes', 'PagedResult.cls')}`,
      {
        ensureExitCode: 0,
      }
    ).shellOutput.stdout;
    expect(result).to.include('Compiled successfully.');
    expect(result).to.include('Executed successfully.');
  });

  it('will list the debug logs', async () => {
    const result = execCmd('apex:list:log', { ensureExitCode: 0, env: { ...process.env, SF_NO_TABLE_STYLE: 'true' } })
      .shellOutput.stdout;

    expect(result).to.match(
      /Application\s+Duration \(ms\)\s+Id\s+Location\s+Size \(B\)\s+Log User\s+Operation\s+Request\s+Start Time\s+Status/
    );
    expect(result).to.match(/User User\s+Api\s+Api\s+\d{4}-\d{2}-.*\s+Success/);
  });

  it('will list the debug logs --json', async () => {
    const result = execCmd<LogListResult>('apex:list:log --json', { ensureExitCode: 0 }).jsonOutput?.result;
    expect(result?.length).to.equal(1);
    const log = result?.filter((l) => l)[0];
    expect(log).to.have.all.keys(
      'attributes',
      'Application',
      'DurationMilliseconds',
      'Id',
      'Location',
      'LogLength',
      'LogUser',
      'Operation',
      'Request',
      'StartTime',
      'Status'
    );
    expect(log?.Status).to.equal('Success');
    expect(log?.Location).to.equal('Monitoring');
    logId = log?.Id;
    expect(logId?.startsWith('07L')).to.be.true;
  });

  it('will get the debug log', async () => {
    const result = execCmd(`apex:get:log -i ${logId}`, { ensureExitCode: 0 }).shellOutput.stdout;
    expect(result).to.include('Number of SOQL queries:');
    expect(result).to.include('Number of queueable jobs added to the queue:');
    expect(result).to.include('CODE_UNIT_STARTED|[EXTERNAL]|execute_anonymous_apex');
    expect(result).to.include('|CUMULATIVE_LIMIT_USAGE_END');
    expect(result).to.include('|EXECUTION_FINISHED');
  });

  it('will get the debug log --number', async () => {
    const result = execCmd('apex:get:log --number 1', { ensureExitCode: 0 }).shellOutput.stdout;
    expect(result).to.include('Number of SOQL queries:');
    expect(result).to.include('Number of queueable jobs added to the queue:');
    expect(result).to.include('CODE_UNIT_STARTED|[EXTERNAL]|execute_anonymous_apex');
    expect(result).to.include('|CUMULATIVE_LIMIT_USAGE_END');
    expect(result).to.include('|EXECUTION_FINISHED');
  });

  it('will get the debug log --number --json', async () => {
    const result = execCmd<LogGetResult>('apex:get:log --number 1 --json', { ensureExitCode: 0 }).jsonOutput?.result;
    expect(result?.length).to.equal(1);
    const log = (result?.filter((l) => l)[0] as { log: string }).log;
    expect(log).to.include('Number of SOQL queries:');
    expect(log).to.include('Number of queueable jobs added to the queue:');
    expect(log).to.include('CODE_UNIT_STARTED|[EXTERNAL]|execute_anonymous_apex');
    expect(log).to.include('|CUMULATIVE_LIMIT_USAGE_END');
    expect(log).to.include('|EXECUTION_FINISHED');
  });
});
