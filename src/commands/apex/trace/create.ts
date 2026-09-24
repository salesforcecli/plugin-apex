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
  Flags,
  SfCommand,
  requiredOrgFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
  loglevel,
} from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'createtrace');

export type TraceFlagCreateResult = {
  id: string;
  success: boolean;
};

export default class CreateTrace extends SfCommand<TraceFlagCreateResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
    'traced-entity-id': Flags.salesforceId({
      char: 'i',
      required: true,
      summary: messages.getMessage('flags.traced-entity-id.summary'),
      length: 'both',
    }),
    'debug-level': Flags.string({
      char: 'd',
      required: true,
      summary: messages.getMessage('flags.debug-level.summary'),
    }),
    'log-type': Flags.string({
      char: 'l',
      summary: messages.getMessage('flags.log-type.summary'),
      options: ['DEVELOPER_LOG', 'USER_DEBUG'] as const,
      default: 'DEVELOPER_LOG',
    }),
    duration: Flags.integer({
      summary: messages.getMessage('flags.duration.summary'),
      default: 30,
      min: 1,
      max: 1440,
    }),
  };

  public async run(): Promise<TraceFlagCreateResult> {
    const { flags } = await this.parse(CreateTrace);
    const conn = flags['target-org'].getConnection(flags['api-version']);

    const escapedName = flags['debug-level'].replace(/'/g, "\\'");
    const debugLevelQuery = `SELECT Id FROM DebugLevel WHERE DeveloperName = '${escapedName}'`;
    const debugLevelResult = await conn.tooling.query<{ Id: string }>(debugLevelQuery);

    if (!debugLevelResult.records?.length) {
      throw new SfError(messages.getMessage('debugLevelNotFound', [flags['debug-level']]));
    }

    const debugLevelId = debugLevelResult.records[0].Id;
    const startDate = new Date();
    const expirationDate = new Date(startDate.getTime() + flags.duration * 60 * 1000);

    const result = (await conn.tooling.create('TraceFlag', {
      TracedEntityId: flags['traced-entity-id'],
      LogType: flags['log-type'],
      DebugLevelId: debugLevelId,
      StartDate: startDate.toISOString(),
      ExpirationDate: expirationDate.toISOString(),
    })) as { id: string; success: boolean; errors: string[] };

    if (!result.success) {
      throw new SfError(messages.getMessage('traceFlagCreateFailed'), undefined, result.errors);
    }

    this.log(messages.getMessage('traceFlagCreateSuccess', [result.id]));
    return { id: result.id, success: true };
  }
}
