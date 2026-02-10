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

import { ApexExecuteOptions, ExecuteService } from '@salesforce/apex-node';
import {
  Flags,
  loglevel,
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
  SfCommand,
} from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';
import RunReporter from '../../reporters/runReporter.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
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
