/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
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
      this.table(logRecords.map(formatForTable), tableHeaders, { 'no-truncate': true });
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

const tableHeaders = {
  Application: { header: 'Application' },
  DurationMilliseconds: { header: 'Duration (ms)' },
  Id: { header: 'Id' },
  Location: { header: 'Location' },
  LogLength: { header: 'Size (B)' },
  User: { header: 'Log User' },
  Operation: { header: 'Operation' },
  Request: { header: 'Request' },
  StartTime: { header: 'Start Time' },
  Status: { header: 'Status' },
};
