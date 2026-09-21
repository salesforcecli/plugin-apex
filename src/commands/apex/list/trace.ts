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

import {
  SfCommand,
  requiredOrgFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
  loglevel,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'listtrace');

export type TraceFlagRecord = {
  Id: string;
  TracedEntityId: string;
  LogType: string;
  DebugLevelId: string;
  StartDate: string;
  ExpirationDate: string;
  DebugLevel: { DeveloperName: string };
  TracedEntity: { Name: string };
};

export type TraceFlagListResult = TraceFlagRecord[];

export default class Trace extends SfCommand<TraceFlagListResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly deprecateAliases = true;
  public static readonly aliases = ['force:apex:trace:list'];

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
  };

  public async run(): Promise<TraceFlagListResult> {
    const { flags } = await this.parse(Trace);
    const conn = flags['target-org'].getConnection(flags['api-version']);

    const query =
      'SELECT Id, TracedEntityId, LogType, DebugLevelId, StartDate, ExpirationDate, DebugLevel.DeveloperName, TracedEntity.Name FROM TraceFlag ORDER BY CreatedDate DESC';
    const result = await conn.tooling.query<TraceFlagRecord>(query);
    const records = result.records ?? [];

    if (records.length === 0) {
      this.log(messages.getMessage('noTraceFlagsFound'));
      return [];
    }

    if (!flags.json) {
      this.table({
        data: records.map((r) => ({
          Id: r.Id,
          'Traced Entity': r.TracedEntity?.Name ?? r.TracedEntityId,
          'Log Type': r.LogType,
          'Debug Level': r.DebugLevel?.DeveloperName ?? r.DebugLevelId,
          'Start Date': r.StartDate,
          'Expiration Date': r.ExpirationDate,
        })),
        overflow: 'wrap',
      });
    }

    return records;
  }
}
