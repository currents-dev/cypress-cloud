import { chain, invoke, isString, toArray, toNumber } from "lodash";
import assert from "node:assert";
import { error } from "../log";

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
  assert(isString(argName) && argName.trim() !== "");

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

    return chain(str)
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
  const num = toNumber(value);

  if (invoke(num, "toString") === value) {
    return num;
  }

  const bool = toBoolean(value);

  if (invoke(bool, "toString") === value) {
    return bool;
  }

  const obj = tryJSONParse(value);

  if (obj && typeof obj === "object") {
    return obj;
  }

  const arr = toArray(value);

  if (invoke(arr, "toString") === value) {
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
