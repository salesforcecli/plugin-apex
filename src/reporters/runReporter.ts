/*
 * Copyright 2025, Salesforce, Inc.
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
import os from 'node:os';

import { ExecuteAnonymousResponse } from '@salesforce/apex-node';
import { Messages } from '@salesforce/core';
import { StandardColors } from '@salesforce/sf-plugins-core';
import { ExecuteResult } from '../commands/apex/run.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'run');

export default class RunReporter {
  public static formatDefault(response: ExecuteAnonymousResponse): string {
    const outputText: string[] = [];
    if (response.success) {
      outputText.push(
        StandardColors.success(messages.getMessage('executeCompileSuccess')),
        StandardColors.success(messages.getMessage('executeRuntimeSuccess')),
        '',
        response.logs ?? ''
      );
    } else {
      if (!response.diagnostic) {
        throw Error('No diagnostic property found on response.');
      }
      const diagnostic = response.diagnostic[0];
      if (!response.compiled) {
        outputText.push(
          StandardColors.error(
            `Error: Line: ${diagnostic.lineNumber ?? '<not provided>'}, Column: ${
              diagnostic.columnNumber ?? '<not provided>'
            }`
          ),
          StandardColors.error(`Error: ${diagnostic.compileProblem}\n`)
        );
      } else {
        outputText.push(
          StandardColors.success(messages.getMessage('executeCompileSuccess')),
          StandardColors.error(`Error: ${diagnostic.exceptionMessage}`),
          StandardColors.error(`Error: ${diagnostic.exceptionStackTrace}`),
          '',
          response.logs ?? ''
        );
      }
    }
    return outputText.join(os.EOL);
  }

  public static formatJson(response: ExecuteAnonymousResponse): ExecuteResult {
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
