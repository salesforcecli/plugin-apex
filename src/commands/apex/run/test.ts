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
  arrayWithDeprecation,
  Flags,
  loglevel,
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
  SfCommand,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { codeCoverageFlag, resultFormatFlag } from '../../../flags.js';
import { TestRunService, TestLevelValues, RunCommandResult, TestRunConfig } from '../../../shared/TestRunService.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-apex', 'runtest');

const exclusiveTestSpecifiers = ['class-names', 'suite-names', 'tests'];
export default class Test extends SfCommand<RunCommandResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly deprecateAliases = true;
  public static readonly aliases = ['force:apex:test:run'];

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
    'code-coverage': codeCoverageFlag,
    'output-dir': Flags.directory({
      aliases: ['outputdir', 'output-directory'],
      deprecateAliases: true,
      char: 'd',
      summary: messages.getMessage('flags.output-dir.summary'),
    }),
    'test-level': Flags.string({
      deprecateAliases: true,
      aliases: ['testlevel'],
      char: 'l',
      summary: messages.getMessage('flags.test-level.summary'),
      description: messages.getMessage('flags.test-level.description'),
      options: TestLevelValues,
    }),
    'class-names': arrayWithDeprecation({
      deprecateAliases: true,
      aliases: ['classnames'],
      char: 'n',
      summary: messages.getMessage('flags.class-names.summary'),
      description: messages.getMessage('flags.class-names.description'),
      exclusive: exclusiveTestSpecifiers.filter((specifier) => specifier !== 'class-names'),
    }),
    'result-format': resultFormatFlag,
    'suite-names': arrayWithDeprecation({
      deprecateAliases: true,
      aliases: ['suitenames'],
      char: 's',
      summary: messages.getMessage('flags.suite-names.summary'),
      description: messages.getMessage('flags.suite-names.description'),
      exclusive: exclusiveTestSpecifiers.filter((specifier) => specifier !== 'suite-names'),
    }),
    tests: arrayWithDeprecation({
      char: 't',
      summary: messages.getMessage('flags.tests.summary'),
      description: messages.getMessage('flags.tests.description'),
      exclusive: exclusiveTestSpecifiers.filter((specifier) => specifier !== 'tests'),
    }),
    'poll-interval': Flags.duration({
      unit: 'seconds',
      char: 'i',
      summary: messages.getMessage('flags.poll-interval.summary'),
      min: 1,
    }),
    // we want to pass `undefined` to the API
    // eslint-disable-next-line sf-plugin/flag-min-max-default
    wait: Flags.duration({
      unit: 'minutes',
      char: 'w',
      summary: messages.getMessage('flags.wait.summary'),
      min: 0,
    }),
    synchronous: Flags.boolean({
      char: 'y',
      summary: messages.getMessage('flags.synchronous.summary'),
    }),
    'detailed-coverage': Flags.boolean({
      deprecateAliases: true,
      aliases: ['detailedcoverage'],
      char: 'v',
      summary: messages.getMessage('flags.detailed-coverage.summary'),
      dependsOn: ['code-coverage'],
    }),
    concise: Flags.boolean({
      summary: messages.getMessage('flags.concise.summary'),
    }),
  };

  protected cancellationTokenSource = new CancellationTokenSource();

  public async run(): Promise<RunCommandResult> {
    const { flags } = await this.parse(Test);

    const config: TestRunConfig = {
      commandType: 'apex',
      exclusiveTestSpecifiers,
      binName: this.config.bin,
    };

    // graceful shutdown
    const exitHandler = async (): Promise<void> => {
      await this.cancellationTokenSource.asyncCancel();
      process.exit();
    };

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on('SIGINT', exitHandler);
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on('SIGTERM', exitHandler);

    // Generate connection in the command
    const connection = flags['target-org'].getConnection(flags['api-version']);

    const context = {
      flags,
      config,
      connection,
      jsonEnabled: this.jsonEnabled(),
      cancellationToken: this.cancellationTokenSource,
      log: (message: string) => this.log(message),
      info: (message: string) => this.info(message),
    };

    return TestRunService.runTestCommand(context);
  }
}
