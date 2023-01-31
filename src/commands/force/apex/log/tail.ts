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
} from '@salesforce/sf-plugins-core';
import { Connection, Messages } from '@salesforce/core';
import { buildDescription, logLevels } from '../../../../utils';
import { colorizeLog } from '../../../../legacyColorization';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.load('@salesforce/plugin-apex', 'tail', [
  'colorDescription',
  'commandDescription',
  'debugLevelDescription',
  'finishedTailing',
  'jsonDescription',
  'logLevelDescription',
  'logLevelLongDescription',
  'longDescription',
  'skipTraceFlagDescription',
]);

export default class Tail extends SfCommand<void> {
  public static readonly summary = buildDescription(
    messages.getMessage('commandDescription'),
    messages.getMessage('longDescription')
  );
  public static readonly description = buildDescription(
    messages.getMessage('commandDescription'),
    messages.getMessage('longDescription')
  );
  public static longDescription = messages.getMessage('longDescription');
  public static readonly examples = [
    '$ sfdx force:apex:log:tail',
    '$ sfdx force:apex:log:tail --debuglevel MyDebugLevel',
    '$ sfdx force:apex:log:tail -c -s',
  ];
  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel: Flags.enum({
      summary: messages.getMessage('logLevelDescription'),
      description: messages.getMessage('logLevelLongDescription'),
      default: 'warn',
      options: logLevels,
    }),
    color: Flags.boolean({
      char: 'c',
      summary: messages.getMessage('colorDescription'),
    }),
    debuglevel: Flags.string({
      char: 'd',
      summary: messages.getMessage('debugLevelDescription'),
    }),
    skiptraceflag: Flags.boolean({
      char: 's',
      summary: messages.getMessage('skipTraceFlagDescription'),
    }),
  };
  private json: boolean | undefined;
  private color: boolean | undefined;

  public async run(): Promise<void> {
    const { flags } = await this.parse(Tail);
    this.json = flags.json;
    this.color = flags.color;

    const conn = flags['target-org'].getConnection(flags['api-version']);
    const logService = this.getLogService(conn);

    if (!flags.skiptraceflag) {
      await logService.prepareTraceFlag(flags.debuglevel ?? '');
    }
    // TODO: come back and try to fix this
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await logService.tail(flags['target-org'], this.logTailer.bind(this));
    this.log(messages.getMessage('finishedTailing'));
  }

  public async logTailer(fullLog: string): Promise<void> {
    if (fullLog) {
      if (this.json) {
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
