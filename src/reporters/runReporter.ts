/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { ExecuteAnonymousResponse } from '@salesforce/apex-node';
import { Messages } from '@salesforce/core';
import { colorError, colorSuccess } from '../utils';
import { ExecuteResult } from '../commands/apex/run/live';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.load('@salesforce/plugin-apex', 'execute', [
  'apexCodeFileDescription',
  'executeCompileSuccess',
  'executeRuntimeSuccess',
  'longDescription',
  'examples',
  'summary',
]);

export default class RunReporter {
  public static formatDefault(response: ExecuteAnonymousResponse): string {
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
