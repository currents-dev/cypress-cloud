/*! @preserve

### MIT

Parts of this code was copied from https://github.com/cypress-io/cypress and is subject to MIT license.

MIT License

Copyright (c) 2022 Cypress.io

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import _ from "lodash";
import assert from "node:assert";
import { error } from "../../lib/log";

const nestedObjectsInCurlyBracesRe = /\{(.+?)\}/g;
const nestedArraysInSquareBracketsRe = /\[(.+?)\]/g;
const everythingAfterFirstEqualRe = /=(.*)/;

// https://github.com/cypress-io/cypress/blob/afb66abc7023ce71e2893cb6de67d24706ff7a1f/packages/server/lib/util/args.js#L162
export const sanitizeAndConvertNestedArgs = <T extends Record<string, unknown>>(
  str: unknown,
  argName: unknown
): T | undefined => {
  if (!str) {
    return;
  }
  assert(_.isString(argName) && argName.trim() !== "");

  try {
    if (typeof str === "object") {
      return str as T;
    }

    // if this is valid JSON then just
    // parse it and call it a day
    const parsed = tryJSONParse(str as string);

    if (parsed) {
      return parsed;
    }

    // invalid JSON, so assume mixed usage
    // first find foo={a:b,b:c} and bar=[1,2,3]
    // syntax and turn those into
    // foo: a:b|b:c
    // bar: 1|2|3

    return _.chain(str)
      .replace(nestedObjectsInCurlyBracesRe, commasToPipes)
      .replace(nestedArraysInSquareBracketsRe, commasToPipes)
      .split(",")
      .map((pair) => {
        return pair.split(everythingAfterFirstEqualRe);
      })
      .fromPairs()
      .mapValues(JSONOrCoerce)
      .value() as Record<string, unknown> as T;
  } catch (err) {
    error("could not parse CLI option '%s' value: %s", argName, str);
    error("error %o", err);
    return undefined;
  }
};

const tryJSONParse = (str: string) => {
  try {
    return JSON.parse(str) === Infinity ? null : JSON.parse(str);
  } catch (err) {
    return null;
  }
};

const commasToPipes = (match: string) => {
  return match.split(",").join("|");
};

// foo=bar,version=1.2.3
const pipesToCommas = (str: string) => {
  return str.split("|").join(",");
};

const JSONOrCoerce = (str: string) => {
  // valid JSON? horray
  const parsed = tryJSONParse(str);

  if (parsed) {
    return parsed;
  }

  // convert bars back to commas
  str = pipesToCommas(str);

  // try to parse again?
  const parsed2 = tryJSONParse(str);

  if (parsed2) {
    return parsed2;
  }

  // nupe :-(
  return coerce(str);
};

export const coerce = (value: any) => {
  const num = _.toNumber(value);

  if (_.invoke(num, "toString") === value) {
    return num;
  }

  const bool = toBoolean(value);

  if (_.invoke(bool, "toString") === value) {
    return bool;
  }

  const obj = tryJSONParse(value);

  if (obj && typeof obj === "object") {
    return obj;
  }

  const arr = _.toArray(value);

  if (_.invoke(arr, "toString") === value) {
    return arr;
  }

  return value;
};

const toBoolean = (value: string) => {
  switch (value) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      return value;
  }
};
