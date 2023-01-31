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
import { buildDescription, colorLogs, logLevels } from '../../../../utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.load('@salesforce/plugin-apex', 'get', [
  'commandDescription',
  'jsonDescription',
  'logIDDescription',
  'logLevelDescription',
  'logLevelLongDescription',
  'longDescription',
  'noResultsFound',
  'numberDescription',
  'outputDirDescription',
  'outputDirLongDescription',
]);

export type LogGetResult = Array<{ log: string } | string>;

export default class Get extends SfCommand<LogGetResult> {
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
    '$ sfdx force:apex:log:get -i <log id>',
    '$ sfdx force:apex:log:get -i <log id> -u me@my.org',
    '$ sfdx force:apex:log:get -n 2 -c',
    '$ sfdx force:apex:log:get -d Users/Desktop/logs -n 2',
  ];

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    loglevel: Flags.enum({
      summary: messages.getMessage('logLevelDescription'),
      description: messages.getMessage('logLevelLongDescription'),
      default: 'warn',
      options: logLevels,
    }),
    'api-version': orgApiVersionFlagWithDeprecations,
    logid: Flags.salesforceId({
      char: 'i',
      summary: messages.getMessage('logIDDescription'),
      startsWith: '07L',
    }),
    number: Flags.integer({
      char: 'n',
      min: 1,
      default: 1,
      max: 25,
      summary: messages.getMessage('numberDescription'),
    }),
    outputdir: Flags.string({
      char: 'd',
      summary: messages.getMessage('outputDirDescription'),
      description: messages.getMessage('outputDirLongDescription'),
    }),
  };
  public async run(): Promise<LogGetResult> {
    const { flags } = await this.parse(Get);
    const conn = flags['target-org'].getConnection(flags['api-version']);
    const logService = new LogService(conn);

    const logResults = await logService.getLogs({
      logId: flags.logid,
      numberOfLogs: flags.number,
      outputDir: flags.outputdir,
    });

    if (logResults.length === 0) {
      this.log(messages.getMessage('noResultsFound'));
      return [];
    }

    if (flags.outputdir) {
      this.log(`Log files written to ${flags.outputdir}`);
      // TODO: look at this --outputdir will change what --json returns
      return logResults.map((logResult) => logResult.log);
    }

    return logResults.map((logResult) => {
      this.log(colorLogs(logResult.log));
      return { log: logResult.log };
    });
  }
}
