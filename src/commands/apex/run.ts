/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { ApexExecuteOptions, ExecuteService } from '@salesforce/apex-node';
import {
  Flags,
  loglevel,
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
  SfCommand,
} from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';
import RunReporter from '../../reporters/runReporter';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'run');

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

export default class Run extends SfCommand<ExecuteResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:apex:execute'];
  public static deprecateAliases = true;

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
    file: Flags.file({
      deprecateAliases: true,
      aliases: ['apexcodefile'],
      char: 'f',
      summary: messages.getMessage('flags.file.summary'),
    }),
  };

  public async run(): Promise<ExecuteResult> {
    const { flags } = await this.parse(Run);
    const conn = flags['target-org'].getConnection(flags['api-version']);
    const exec = new ExecuteService(conn);

    const execAnonOptions: ApexExecuteOptions = {
      ...(flags.file ? { apexFilePath: flags.file } : { userInput: true }),
    };

    const result = await exec.executeAnonymous(execAnonOptions);

    const formattedResult = RunReporter.formatJson(result);

    if (!result.compiled || !result.success) {
      const err = !result.compiled
        ? new SfError(
            messages.getMessage('executeCompileFailure', [
              formattedResult.line,
              formattedResult.column,
              formattedResult.compileProblem,
            ]),
            'executeCompileFailure'
          )
        : new SfError(
            messages.getMessage('executeRuntimeFailure', [formattedResult.exceptionMessage]),
            'executeRuntimeFailure',
            []
          );
      err.setData(formattedResult);
      throw err;
    }

    this.log(RunReporter.formatDefault(result));

    return formattedResult;
  }
}
