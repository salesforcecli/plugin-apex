/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { LogRecord, LogService } from '@salesforce/apex-node';
import {
  Flags,
  SfCommand,
  requiredOrgFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { buildDescription, logLevels } from '../../../../utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.load('@salesforce/plugin-apex', 'list', [
  'appColHeader',
  'commandDescription',
  'durationColHeader',
  'idColHeader',
  'jsonDescription',
  'locationColHeader',
  'logLevelDescription',
  'logLevelLongDescription',
  'longDescription',
  'noDebugLogsFound',
  'operationColHeader',
  'requestColHeader',
  'sizeColHeader',
  'statusColHeader',
  'timeColHeader',
  'userColHeader',
]);

export type LogListResult = LogRecord[];

export default class List extends SfCommand<LogListResult> {
  public static readonly summary = buildDescription(
    messages.getMessage('commandDescription'),
    messages.getMessage('longDescription')
  );
  public static readonly description = buildDescription(
    messages.getMessage('commandDescription'),
    messages.getMessage('longDescription')
  );
  public static longDescription = messages.getMessage('longDescription');
  public static readonly examples = ['$ sfdx force:apex:log:list', '$ sfdx force:apex:log:list -u me@my.org'];
  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    loglevel: Flags.enum({
      summary: messages.getMessage('logLevelDescription'),
      description: messages.getMessage('logLevelLongDescription'),
      default: 'warn',
      options: logLevels,
    }),
    'api-version': orgApiVersionFlagWithDeprecations,
  };

  public async run(): Promise<LogListResult> {
    const { flags } = await this.parse(List);

    const conn = flags['target-org'].getConnection(flags['api-version']);
    const logService = new LogService(conn);
    const logRecords = await logService.getLogRecords();

    if (logRecords.length === 0) {
      this.log(messages.getMessage('noDebugLogsFound'));
      return [];
    }

    logRecords.map((logRecord) => {
      logRecord.StartTime = this.formatTime(logRecord.StartTime);
    });

    if (!flags.json) {
      // while not required to prevent table output, save a few iterations if only printing json
      const cleanLogs = logRecords.map((logRecord) => ({
        app: logRecord.Application,
        duration: String(logRecord.DurationMilliseconds),
        id: logRecord.Id,
        location: logRecord.Location,
        size: String(logRecord.LogLength),
        user: logRecord.LogUser.Name,
        operation: logRecord.Operation,
        request: logRecord.Request,
        time: logRecord.StartTime,
        status: logRecord.Status,
      }));

      this.table(cleanLogs, {
        app: { header: messages.getMessage('appColHeader') },
        duration: { header: messages.getMessage('durationColHeader') },
        id: { header: messages.getMessage('idColHeader') },
        location: { header: messages.getMessage('locationColHeader') },
        size: { header: messages.getMessage('sizeColHeader') },
        user: { header: messages.getMessage('userColHeader') },
        operation: { header: messages.getMessage('operationColHeader') },
        request: { header: messages.getMessage('requestColHeader') },
        time: { header: messages.getMessage('timeColHeader') },
        status: { header: messages.getMessage('statusColHeader') },
      });
    }

    return logRecords;
  }

  // eslint-disable-next-line class-methods-use-this
  private formatTime(time: string): string {
    const milliIndex = time.indexOf('.');
    if (milliIndex !== -1) {
      return time.substring(0, milliIndex) + time.substring(milliIndex + 4);
    }
    return time;
  }
}
