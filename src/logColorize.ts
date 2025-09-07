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

import { StandardColors } from '@salesforce/sf-plugins-core';
import ansis from 'ansis';

/** these color matching pieces of content within a log line */
const contentColorMap = [
  [new RegExp(/\|VARIABLE_\w*\|/g), ansis.bold.cyan],
  [new RegExp(/\|METHOD_\w*\|/g), ansis.blue],
  [new RegExp(/\|SOQL_\w*\|/g), StandardColors.warning],
  [new RegExp(/\|CONSTRUCTOR_\w*\|/g), ansis.magenta],
  [new RegExp(/\|USER\w*\|/g), StandardColors.success],
  [new RegExp(/\b([\w]+\.)+(\w)+\b/g), ansis.blueBright],
  [new RegExp(/\b(DEBUG)\b/g), ansis.bold.cyan],
  [new RegExp(/\b(HINT|INFO|INFORMATION|EXCEPTION_\w*|FATAL_\w*)\b/g), StandardColors.success],
  [new RegExp(/\b(WARNING|WARN)\b/g), StandardColors.warning],
  [new RegExp(/\b(ERROR|FAILURE|FAIL)\b/g), StandardColors.error],
  [new RegExp(/\b([a-zA-Z.]*Exception)\b/g), StandardColors.error],
  [new RegExp(/"[^"]*"/g), StandardColors.error],
  [new RegExp(/\b([0-9]+|true|false|null)\b/g), ansis.blueBright],
] as const;

/** apply a single color to a single log's matching content */
const colorLogMatchingContent =
  ([regex, colorFn]: readonly [RegExp, ansis.Ansis]) =>
  (log: string): string =>
    log.replace(regex, (match) => colorFn(match));

const [colorFn1, ...colorFns] = [...contentColorMap.map(colorLogMatchingContent)];

/** one or more functions that have the same signature, returns one composed function that does them all sequentially */
export const compose = <R>(fn1: (a: R) => R, ...fns: Array<(a: R) => R>): ((a: R) => R) =>
  fns.reduce((prevFn, nextFn) => (value) => prevFn(nextFn(value)), fn1);

/** all colorizers in one */
export const colorize = compose(colorFn1, ...colorFns);

export const colorLogs = (log: string): string => {
  const [head, ...tail] = log.split('\n');
  // the first line is bolded and not otherwise styles
  return tail.length === 0
    ? ansis.bold(head)
    : [
        ansis.bold(head), // the first line is bolded and not otherwise styles
        colorize(tail.join('\n')),
      ].join('\n');
};
