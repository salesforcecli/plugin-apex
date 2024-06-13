/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { StandardColors } from '@salesforce/sf-plugins-core';
import ansis from 'ansis';

/** these color the entire line if the matching content is found */
const lineColorMap = [
  ['CONSTRUCTOR_', ansis.magenta],
  ['EXCEPTION_', StandardColors.error],
  ['FATAL_', StandardColors.error],
  ['METHOD_', ansis.blue],
  ['SOQL_', StandardColors.warning],
  ['USER_', StandardColors.success],
  ['VARIABLE_', ansis.bold.cyan],
] as const;

/** these color matching pieces of content within a line */
const contentColorMap = [
  [new RegExp(/\b([\w]+\.)+(\w)+\b/g), ansis.blueBright],
  [new RegExp(/\b(DEBUG)\b/g), ansis.bold.cyan],
  [new RegExp(/\b(HINT|INFO|INFORMATION)\b/g), StandardColors.success],
  [new RegExp(/\b(WARNING|WARN)\b/g), StandardColors.warning],
  [new RegExp(/\b(ERROR|FAILURE|FAIL)\b/g), StandardColors.error],
  [new RegExp(/\b([a-zA-Z.]*Exception)\b/g), StandardColors.error],
  [new RegExp(/"[^"]*"/g), StandardColors.error],
  [new RegExp(/\b([0-9]+|true|false|null)\b/g), ansis.blueBright],
] as const;

const colorEntireLineIfMatch =
  ([matchThis, colorFn]: readonly [string, ansis.Ansis]) =>
  (log: string): string =>
    log.includes(matchThis) ? colorFn(log) : log;

/** apply a single color to a single log's matching content */
const colorLogMatchingContent =
  ([regex, colorFn]: readonly [RegExp, ansis.Ansis]) =>
  (log: string): string =>
    log.replace(regex, (match) => colorFn(match));

const [colorFn1, ...colorFns] = [
  ...lineColorMap.map(colorEntireLineIfMatch),
  ...contentColorMap.map(colorLogMatchingContent),
];

/** one or more functions that have the same signature, returns one composed function that does them all sequentially */
export const compose = <R>(fn1: (a: R) => R, ...fns: Array<(a: R) => R>): ((a: R) => R) =>
  fns.reduce((prevFn, nextFn) => (value) => prevFn(nextFn(value)), fn1);

/** all colorizers in one */
const allColorizers = compose(colorFn1, ...colorFns);

export const colorLogs = (log: string): string => allColorizers(log);
