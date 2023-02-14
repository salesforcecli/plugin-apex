/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { LogService } from '@salesforce/apex-node';
import {
  Flags,
  SfCommand,
  requiredOrgFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
  loglevel,
} from '@salesforce/sf-plugins-core';
import { Connection, Messages } from '@salesforce/core';
import { colorizeLog } from '../../../legacyColorization';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'tail');

export default class Log extends SfCommand<void> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly deprecateAliases = true;
  public static readonly aliases = ['force:apex:log:tail'];

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
    color: Flags.boolean({
      char: 'c',
      summary: messages.getMessage('flags.color.summary'),
    }),
    'debug-level': Flags.string({
      deprecateAliases: true,
      aliases: ['debuglevel'],
      char: 'd',
      summary: messages.getMessage('flags.debug-level.summary'),
      exclusive: ['skip-trace-flag'],
    }),
    'skip-trace-flag': Flags.boolean({
      deprecateAliases: true,
      aliases: ['skiptraceflag'],
      char: 's',
      summary: messages.getMessage('flags.skip-trace-flag.summary'),
    }),
  };
  private color: boolean | undefined;

  public async run(): Promise<void> {
    const { flags } = await this.parse(Log);
    this.color = flags.color;

    const conn = flags['target-org'].getConnection(flags['api-version']);
    const logService = this.getLogService(conn);

    if (!flags['skip-trace-flag']) {
      await logService.prepareTraceFlag(flags['debug-level'] ?? '');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await logService.tail(flags['target-org'], this.logTailer.bind(this));
    this.log(messages.getMessage('finishedTailing'));
  }

  public async logTailer(fullLog: string): Promise<void> {
    if (fullLog) {
      if (this.jsonEnabled()) {
        this.styledJSON({
          status: process.exitCode,
          result: fullLog,
        });
      } else {
        const output = this.color ? await colorizeLog(fullLog) : fullLog;
        this.log(output);
      }
    }
  }

  /**
   * for UT purposes
   *
   * @param conn : Connection to the org
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  private getLogService(conn: Connection): LogService {
    return new LogService(conn);
  }
}
