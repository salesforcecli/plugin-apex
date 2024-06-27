/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
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
