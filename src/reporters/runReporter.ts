/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { ExecuteAnonymousResponse } from '@salesforce/apex-node';
import { Messages } from '@salesforce/core';
import { colorError, colorSuccess } from '../utils';
import { ExecuteResult } from '../commands/apex/run';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'execute');

export default class RunReporter {
  public static formatDefault(response: ExecuteAnonymousResponse): string {
    const outputText: string[] = [];
    if (response.success) {
      outputText.push(
        colorSuccess(messages.getMessage('executeCompileSuccess')),
        colorSuccess(messages.getMessage('executeRuntimeSuccess')),
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
          colorError(`Error: Line: ${diagnostic.lineNumber}, Column: ${diagnostic.columnNumber}`),
          colorError(`Error: ${diagnostic.compileProblem}\n`)
        );
      } else {
        outputText.push(
          colorSuccess(messages.getMessage('executeCompileSuccess')),
          colorError(`Error: ${diagnostic.exceptionMessage}`),
          colorError(`Error: ${diagnostic.exceptionStackTrace}`),
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
