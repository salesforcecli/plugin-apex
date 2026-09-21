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
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'deletetrace');

export type TraceFlagDeleteResult = {
  id: string;
  success: boolean;
};

export default class Trace extends SfCommand<TraceFlagDeleteResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly deprecateAliases = true;
  public static readonly aliases = ['force:apex:trace:delete'];

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
    'trace-flag-id': Flags.salesforceId({
      char: 'i',
      required: true,
      summary: messages.getMessage('flags.trace-flag-id.summary'),
      length: 'both',
    }),
  };

  public async run(): Promise<TraceFlagDeleteResult> {
    const { flags } = await this.parse(Trace);
    const conn = flags['target-org'].getConnection(flags['api-version']);

    const traceFlagId = flags['trace-flag-id'];
    const result = (await conn.tooling.delete('TraceFlag', traceFlagId)) as {
      id: string;
      success: boolean;
      errors: string[];
    };

    if (!result.success) {
      throw new SfError(messages.getMessage('traceFlagDeleteFailed', [traceFlagId]), undefined, result.errors);
    }

    this.log(messages.getMessage('traceFlagDeleteSuccess', [traceFlagId]));
    return { id: traceFlagId, success: true };
  }
}
