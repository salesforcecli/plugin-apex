/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { LogService } from '@salesforce/apex-node';
import {
  Flags,
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
  SfCommand,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { colorLogs } from '../../../utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.load('@salesforce/plugin-apex', 'get', [
  'flags.log-id.summary',
  'noResultsFound',
  'flags.number.summary',
  'flags.output-dir.summary',
  'flags.output-dir.description',
  'summary',
  'description',
  'examples',
]);

export type LogGetResult = Array<{ log: string } | string>;

export default class Log extends SfCommand<LogGetResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly deprecateAliases = true;
  public static readonly aliases = ['force:apex:log:get'];
  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    'log-id': Flags.salesforceId({
      deprecateAliases: true,
      aliases: ['logid'],
      char: 'i',
      summary: messages.getMessage('flags.log-id.summary'),
      startsWith: '07L',
      length: 'both',
    }),
    number: Flags.integer({
      char: 'n',
      min: 1,
      default: 1,
      max: 25,
      summary: messages.getMessage('flags.number.summary'),
    }),
    'output-dir': Flags.string({
      aliases: ['outputdir', 'output-directory'],
      deprecateAliases: true,
      char: 'd',
      summary: messages.getMessage('flags.output-dir.summary'),
      description: messages.getMessage('flags.output-dir.description'),
    }),
  };

  public async run(): Promise<LogGetResult> {
    const { flags } = await this.parse(Log);
    const conn = flags['target-org'].getConnection(flags['api-version']);
    const logService = new LogService(conn);

    const logResults = await logService.getLogs({
      logId: flags['log-id'],
      numberOfLogs: flags.number,
      outputDir: flags['output-dir'],
    });

    if (logResults.length === 0) {
      this.log(messages.getMessage('noResultsFound'));
      return [];
    }

    if (flags['output-dir']) {
      this.log(`Log files written to ${flags['output-dir']}`);
      // TODO: look at this --outputdir will change what --json returns
      return logResults.map((logResult) => logResult.log);
    }

    return logResults.map((logResult) => {
      this.log(colorLogs(logResult.log));
      return { log: logResult.log };
    });
  }
}
