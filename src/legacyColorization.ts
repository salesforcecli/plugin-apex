/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { readFile } from 'node:fs/promises';
import chalk from 'chalk';
import convert from 'color-convert';
import colorName from 'color-name';
import { Logger } from '@salesforce/core';

type ColorMap = Record<
  'CONSTRUCTOR_' | 'EXCEPTION_' | 'FATAL_' | 'METHOD_' | 'SOQL_' | 'USER_' | 'VARIABLE_',
  keyof typeof colorName
>;

const DEFAULT_COLOR_MAP: ColorMap = {
  CONSTRUCTOR_: 'magenta',
  EXCEPTION_: 'red',
  FATAL_: 'red',
  METHOD_: 'blue',
  SOQL_: 'yellow',
  USER_: 'green',
  VARIABLE_: 'darkcyan',
};

/**
 * @description this is a holdover from the toolbelt API, which allows for custom colorization of the logs.
 * @param log - full debug log retrieved from an org.
 * @returns colorized log
 */
export async function colorizeLog(log: string): Promise<string> {
  const logger = await Logger.child('apexLogApi', { tag: 'tail' });
  let colorMap = DEFAULT_COLOR_MAP;

  const localColorMapFile = process.env.SFDX_APEX_LOG_COLOR_MAP;
  if (localColorMapFile) {
    try {
      colorMap = JSON.parse(await readFile(localColorMapFile, 'utf-8')) as ColorMap;
    } catch (err) {
      logger.warn(`Color registry not found: ${localColorMapFile}`);
    }
  }

  const logLines = log.split(/\n/g);
  if (!logLines || logLines.length < 1) {
    logger.warn('colorizeLog unable to split logLines');
    return log;
  }

  const line1 = chalk.bold(logLines.shift());

  return [
    line1,
    ...logLines.map((logLine) => {
      for (const [key, color] of Object.entries(colorMap)) {
        if (logLine.includes(`|${key}`)) {
          const hex = convert.keyword.hex(color);
          const colorFn = chalk.hex(hex);

          if (typeof colorFn !== 'function') {
            logger.warn(`Color ${color} is not supported`);
            return logLine;
          }

          const count = (logLine.match(/\|/g) ?? []).length;
          if (count === 1) {
            return colorFn(logLine);
          }
          const first = logLine.indexOf('|', logLine.indexOf('|') + 1);
          return `${colorFn(logLine.substring(0, first))}${logLine.substring(first)}`;
        }
      }
      return logLine;
    }),
  ].join('\n');
}
