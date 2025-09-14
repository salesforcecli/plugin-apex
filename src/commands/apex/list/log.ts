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

import { LogRecord, LogService } from '@salesforce/apex-node';
import {
  SfCommand,
  requiredOrgFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
  loglevel,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'list');

export type LogListResult = LogRecord[];
type LogForTable = Omit<LogRecord, 'DurationMilliseconds' | 'User'> & { DurationMilliseconds: string; User: string };

export default class Log extends SfCommand<LogListResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly deprecateAliases = true;
  public static readonly aliases = ['force:apex:log:list'];

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
  };

  public async run(): Promise<LogListResult> {
    const { flags } = await this.parse(Log);

    const logService = new LogService(flags['target-org'].getConnection(flags['api-version']));
    const logRecords = (await logService.getLogRecords()).map(formatStartTime);

    if (logRecords.length === 0) {
      this.log(messages.getMessage('noDebugLogsFound'));
      return [];
    }

    if (!flags.json) {
      // while not required to prevent table output, save a few iterations if only printing json
      this.table({
        data: logRecords.map(formatForTable),
        columns: [
          'Application',
          { key: 'DurationMilliseconds', name: 'Duration (ms)' },
          'Id',
          'Location',
          { key: 'LogLength', name: 'Size (B)' },
          { key: 'User', name: 'Log User' },
          'Operation',
          'Request',
          { key: 'StartTime', name: 'Start Time' },
          'Status',
        ],
        overflow: 'wrap',
      });
    }

    return logRecords;
  }
}

const formatForTable = (logRecord: LogRecord): LogForTable => ({
  ...logRecord,
  DurationMilliseconds: String(logRecord.DurationMilliseconds),
  User: logRecord.LogUser.Name,
});

export const formatStartTime = (lr: LogRecord): LogRecord => ({ ...lr, StartTime: formatTime(lr.StartTime) });

const formatTime = (time: string): string => {
  const msIndex = time.indexOf('.');
  return msIndex !== -1 ? time.substring(0, msIndex) + time.substring(msIndex + 4) : time;
};
