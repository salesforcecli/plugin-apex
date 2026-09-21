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
import { expect, config } from 'chai';
import { AuthInfo, Connection } from '@salesforce/core';
import { TraceFlagListResult } from '../../../src/commands/apex/list/trace.js';
import { TraceFlagCreateResult } from '../../../src/commands/apex/create/trace.js';
import { TraceFlagDeleteResult } from '../../../src/commands/apex/delete/trace.js';

config.truncateThreshold = 0;

describe('apex trace flag lifecycle', () => {
  let session: TestSession;
  let userId: string;
  let debugLevelName: string;
  let createdTraceFlagId: string;

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

    const conn = await Connection.create({
      authInfo: await AuthInfo.create({ username: session.orgs.get('default')?.username }),
    });

    // get the current user's ID for tracing
    const userResult = await conn.query<{ Id: string }>(`SELECT Id FROM User WHERE Username = '${conn.getUsername()}'`);
    userId = userResult.records[0].Id;

    // ensure a DebugLevel exists (create SFDC_DevConsole if not present)
    debugLevelName = 'SFDC_DevConsole';
    const dlResult = await conn.tooling.query<{ Id: string }>(
      `SELECT Id FROM DebugLevel WHERE DeveloperName = '${debugLevelName}'`
    );
    if (!dlResult.records?.length) {
      await conn.tooling.create('DebugLevel', {
        DeveloperName: debugLevelName,
        MasterLabel: debugLevelName,
        ApexCode: 'FINEST',
        Visualforce: 'FINER',
      });
    }

    // clean up any existing trace flags for this user to start fresh
    const existingFlags = await conn.tooling.query<{ Id: string }>(
      `SELECT Id FROM TraceFlag WHERE TracedEntityId = '${userId}'`
    );
    await Promise.all((existingFlags.records ?? []).map((flag) => conn.tooling.delete('TraceFlag', flag.Id)));
  });

  after(async () => {
    await session?.zip(undefined, 'artifacts');
    await session?.clean();
  });

  it('lists no trace flags initially', () => {
    const result = execCmd<TraceFlagListResult>('apex:list:trace --json', { ensureExitCode: 0 }).jsonOutput?.result;
    expect(result).to.be.an('array').with.lengthOf(0);
  });

  it('lists no trace flags (human output)', () => {
    const result = execCmd('apex:list:trace', { ensureExitCode: 0 }).shellOutput.stdout;
    expect(result).to.include('No trace flags found in org');
  });

  it('creates a trace flag', () => {
    const result = execCmd<TraceFlagCreateResult>(
      `apex:create:trace --traced-entity-id ${userId} --debug-level ${debugLevelName} --duration 30 --json`,
      { ensureExitCode: 0 }
    ).jsonOutput?.result;

    expect(result).to.have.property('success', true);
    expect(result).to.have.property('id').that.is.a('string');
    createdTraceFlagId = result!.id;
  });

  it('lists the created trace flag --json', () => {
    const result = execCmd<TraceFlagListResult>('apex:list:trace --json', { ensureExitCode: 0 }).jsonOutput?.result;
    expect(result).to.be.an('array').with.lengthOf.greaterThanOrEqual(1);

    const created = result?.find((r) => r.Id === createdTraceFlagId);
    expect(created).to.exist;
    expect(created).to.have.property('LogType', 'DEVELOPER_LOG');
    expect(created).to.have.nested.property('DebugLevel.DeveloperName', debugLevelName);
    expect(created).to.have.property('TracedEntityId', userId);
  });

  it('lists the created trace flag (human output)', () => {
    const result = execCmd('apex:list:trace', {
      ensureExitCode: 0,
      env: { ...process.env, SF_NO_TABLE_STYLE: 'true' },
    }).shellOutput.stdout;

    expect(result).to.include(createdTraceFlagId);
    expect(result).to.include('DEVELOPER_LOG');
    expect(result).to.include(debugLevelName);
  });

  it('fails to create with a nonexistent debug level', () => {
    const result = execCmd(
      `apex:create:trace --traced-entity-id ${userId} --debug-level NonExistentLevel_12345 --json`,
      { ensureExitCode: 1 }
    ).jsonOutput;

    expect(result?.status).to.equal(1);
    expect(result?.message).to.include('NonExistentLevel_12345');
  });

  it('deletes the trace flag', () => {
    const result = execCmd<TraceFlagDeleteResult>(`apex:delete:trace --trace-flag-id ${createdTraceFlagId} --json`, {
      ensureExitCode: 0,
    }).jsonOutput?.result;

    expect(result).to.have.property('success', true);
    expect(result).to.have.property('id', createdTraceFlagId);
  });

  it('lists no trace flags after deletion', () => {
    const result = execCmd<TraceFlagListResult>('apex:list:trace --json', { ensureExitCode: 0 }).jsonOutput?.result;
    const deleted = result?.find((r) => r.Id === createdTraceFlagId);
    expect(deleted).to.be.undefined;
  });

  it('fails to delete a nonexistent trace flag', () => {
    const result = execCmd(`apex:delete:trace --trace-flag-id ${createdTraceFlagId} --json`, {
      ensureExitCode: 1,
    }).jsonOutput;

    expect(result?.status).to.equal(1);
  });
});
