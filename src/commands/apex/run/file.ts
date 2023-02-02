/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { ApexExecuteOptions, ExecuteService } from '@salesforce/apex-node';
import {
  Flags,
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
  SfCommand,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import RunReporter from '../../../reporters/runReporter';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.load('@salesforce/plugin-apex', 'execute', [
  'apexCodeFileDescription',
  'executeCompileSuccess',
  'executeRuntimeSuccess',
  'longDescription',
  'examples',
  'summary',
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
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('summary');
  public static longDescription = messages.getMessage('longDescription');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    'apex-code-file': Flags.file({
      char: 'f',
      required: true,
      summary: messages.getMessage('apexCodeFileDescription'),
    }),
  };

  public async run(): Promise<ExecuteResult> {
    const { flags } = await this.parse(Execute);
    const conn = flags['target-org'].getConnection(flags['api-version']);
    const exec = new ExecuteService(conn);

    const execAnonOptions: ApexExecuteOptions = {
      ...{ apexFilePath: flags['apex-code-file'] },
    };

    const result = await exec.executeAnonymous(execAnonOptions);

    this.log(RunReporter.formatDefault(result));

    return RunReporter.formatJson(result);
  }
}
