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

import {
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
  SfCommand,
  loglevel,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'get-invalid-classes');

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
};

export type CompilationResult = {
  status: string;
  results: InvalidApexClassResult[];
};

export default class GetInvalidClasses extends SfCommand<CompilationResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
  };

  public async run(): Promise<CompilationResult> {
    const { flags } = await this.parse(GetInvalidClasses);

    this.spinner.start('Retrieving invalid Apex classes...');

    const connection = flags['target-org'].getConnection(flags['api-version']);
    // eslint-disable-next-line no-underscore-dangle
    const toolingUrl = connection.tooling._baseUrl();

    const compilationResult = await connection.tooling.request<CompilationResult>({
      url: `${toolingUrl}/apexCompileResults`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    this.spinner.stop();

    const results = compilationResult.results ?? [];

    if (results.length === 0) {
      this.log(messages.getMessage('noResultsFound'));
      return compilationResult;
    }

    if (!flags.json) {
      this.table({
        data: results.map((r) => ({
          ...r,
          problems: r.problems.map((p) => `Line ${String(p.line)}:${String(p.column)} — ${p.message}`).join('\n'),
        })),
        columns: [
          { key: 'name', name: 'Name' },
          { key: 'namespace', name: 'Namespace' },
          { key: 'success', name: 'Success' },
          { key: 'problems', name: 'Problems' },
        ],
        overflow: 'wrap',
      });
    }

    return compilationResult;
  }
}
