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
  Status: 'Active' | 'Expired';
  DebugLevel: { DeveloperName: string } | null;
  TracedEntity: { Name: string } | null;
};

export type TraceFlagListResult = TraceFlagRecord[];

export default class ListTrace extends SfCommand<TraceFlagListResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
  };

  public async run(): Promise<TraceFlagListResult> {
    const { flags } = await this.parse(ListTrace);
    const conn = flags['target-org'].getConnection(flags['api-version']);

    const query =
      'SELECT Id, TracedEntityId, LogType, DebugLevelId, StartDate, ExpirationDate, DebugLevel.DeveloperName, TracedEntity.Name FROM TraceFlag ORDER BY CreatedDate DESC';
    const result = await conn.tooling.query<Omit<TraceFlagRecord, 'Status'>>(query);
    const now = new Date();
    const records: TraceFlagRecord[] = (result.records ?? []).map((r) => ({
      ...r,
      Status: new Date(r.ExpirationDate) > now ? 'Active' : 'Expired',
    }));

    if (records.length === 0) {
      this.log(messages.getMessage('noTraceFlagsFound'));
      return [];
    }

    if (!flags.json) {
      this.table({
        data: records.map(formatForTable),
        columns: [
          'Id',
          { key: 'TracedEntity', name: 'Traced Entity' },
          { key: 'LogType', name: 'Log Type' },
          { key: 'DebugLevel', name: 'Debug Level' },
          'Status',
          { key: 'ExpirationDate', name: 'Expiration Date' },
        ],
        overflow: 'wrap',
      });
    }

    return records;
  }
}

const formatForTable = (r: TraceFlagRecord): Record<string, string> => ({
  Id: r.Id,
  TracedEntity: r.TracedEntity?.Name ?? r.TracedEntityId,
  LogType: r.LogType,
  DebugLevel: r.DebugLevel?.DeveloperName ?? r.DebugLevelId,
  Status: r.Status,
  ExpirationDate: r.ExpirationDate,
});
