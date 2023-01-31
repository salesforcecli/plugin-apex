/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { ApexExecuteOptions, ExecuteAnonymousResponse, ExecuteService } from '@salesforce/apex-node';
import {
  Flags,
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
  SfCommand,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { buildDescription, colorError, colorSuccess, logLevels } from '../../../utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.load('@salesforce/plugin-apex', 'execute', [
  'apexCodeFileDescription',
  'commandDescription',
  'executeCompileSuccess',
  'executeRuntimeSuccess',
  'logLevelDescription',
  'logLevelLongDescription',
  'longDescription',
]);

export type ExecuteResult = {
  compiled: boolean;
  success: boolean;
  line: number;
  column: number;
  exceptionStackTrace: string;
  compileProblem: string;
  logs: string | undefined;
  exceptionMessage: string;
};

export default class Execute extends SfCommand<ExecuteResult> {
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
    '$ sfdx force:apex:execute -u testusername@salesforce.org -f ~/test.apex',
    '$ sfdx force:apex:execute -f ~/test.apex',
    '$ sfdx force:apex:execute \nStart typing Apex code. Press the Enter key after each line, then press CTRL+D when finished.',
  ];

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    apexcodefile: Flags.file({
      char: 'f',
      summary: messages.getMessage('apexCodeFileDescription'),
    }),
    loglevel: Flags.enum({
      summary: messages.getMessage('logLevelDescription'),
      description: messages.getMessage('logLevelLongDescription'),
      default: 'warn',
      options: logLevels,
    }),
  };

  public async run(): Promise<ExecuteResult> {
    const { flags } = await this.parse(Execute);
    const conn = flags['target-org'].getConnection(flags['api-version']);
    const exec = new ExecuteService(conn);

    const execAnonOptions: ApexExecuteOptions = {
      ...(flags.apexcodefile ? { apexFilePath: flags.apexcodefile } : { userInput: true }),
    };

    const result = await exec.executeAnonymous(execAnonOptions);

    this.log(this.formatDefault(result));

    return this.formatJson(result);
  }

  // eslint-disable-next-line class-methods-use-this
  private formatDefault(response: ExecuteAnonymousResponse): string {
    let outputText = '';
    if (response.success) {
      outputText += `${colorSuccess(messages.getMessage('executeCompileSuccess'))}\n`;
      outputText += `${colorSuccess(messages.getMessage('executeRuntimeSuccess'))}\n`;
      outputText += `\n${response.logs}`;
    } else {
      if (!response.diagnostic) {
        throw Error('No diagnostic property found on response.');
      }
      const diagnostic = response.diagnostic[0];

      if (!response.compiled) {
        outputText += colorError(`Error: Line: ${diagnostic.lineNumber}, Column: ${diagnostic.columnNumber}\n`);
        outputText += colorError(`Error: ${diagnostic.compileProblem}\n`);
      } else {
        outputText += `${colorSuccess(messages.getMessage('executeCompileSuccess'))}\n`;
        outputText += colorError(`Error: ${diagnostic.exceptionMessage}\n`);
        outputText += colorError(`Error: ${diagnostic.exceptionStackTrace}\n`);
        outputText += `\n${response.logs}`;
      }
    }
    return outputText;
  }

  // eslint-disable-next-line class-methods-use-this
  private formatJson(response: ExecuteAnonymousResponse): ExecuteResult {
    return {
      success: response.success,
      compiled: response.compiled,
      compileProblem: response.diagnostic?.[0].compileProblem ?? '',
      exceptionMessage: response.diagnostic?.[0].exceptionMessage ?? '',
      exceptionStackTrace: response.diagnostic?.[0].exceptionStackTrace ?? '',
      line: response.diagnostic?.[0].lineNumber ?? -1,
      column: response.diagnostic?.[0].columnNumber ?? -1,
      logs: response.logs,
    };
  }
}
