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

import { CancellationTokenSource } from '@salesforce/apex-node';
import {
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
  SfCommand,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'get-compile-status');

export type ApexClassProblem = {
  line: number;
  column: number;
  message: string;
};

export type InvalidApexClassResult = {
  name: string;
  namespace: string;
  success: boolean;
  problems: ApexClassProblem[];
  warnings: ApexClassProblem[];
};

export type CompilationResult = {
  status: string;
  results: InvalidApexClassResult[];
};

export default class GetCompileStatus extends SfCommand<CompilationResult> {
  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
  };
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  protected cancellationTokenSource = new CancellationTokenSource();

  public async run(): Promise<CompilationResult> {
    const { flags } = await this.parse(GetCompileStatus);

    // graceful shutdown
    const exitHandler = async (): Promise<void> => {
      await this.cancellationTokenSource.asyncCancel();
      process.exit();
    };

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on('SIGINT', exitHandler);
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on('SIGTERM', exitHandler);

    this.spinner.start('Retrieving Apex compilation results');

    const connection = flags['target-org'].getConnection(flags['api-version']);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const invalidApexResponse = (await connection.tooling.request({
      // eslint-disable-next-line no-underscore-dangle
      url: `${connection.tooling._baseUrl()}/apexCompileResults`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })) as CompilationResult;

    // the actual command output is only displayed when --json is passed as a flag
    // so we format the results for everyone else
    if (!this.jsonEnabled() && invalidApexResponse.results.length > 0) {
      if (invalidApexResponse.results.length > 0) {
        const tableFormatter = (tableItems: ApexClassProblem[]): string =>
          tableItems.map((tableItem) => JSON.stringify(tableItem)).join('\n');
        this.table({
          columns: ['name', 'namespace', 'success', 'problems', 'warnings'],
          data: invalidApexResponse.results.map((result) => ({
            ...result,
            problems: tableFormatter(result.problems),
            warnings: tableFormatter(result.warnings),
          })),
          title: 'Compile Status Results:',
        });
      } else {
        this.log('No Apex compiler issues found!');
      }
    }

    this.spinner.stop();
    return invalidApexResponse;
  }
}
