import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import Debug from "debug";
import { omit } from "lodash";
import prettyMS from "pretty-ms";
import VError from "verror";
import { warn } from "../../lib/log";
import { getDelays, isRetriableError } from "./config";
const debug = Debug("currents:api");

let _runId: string | undefined = undefined;
export const setRunId = (runId: string) => {
  _runId = runId;
};

let _cypressVersion: string | undefined = undefined;
export const setCypressVersion = (cypressVersion: string) => {
  _cypressVersion = cypressVersion;
};

let _currentsVersion: string | undefined = undefined;
export const setCurrentsVersion = (v: string) => {
  _currentsVersion = v;
};

type RetryOptions = {
  delays?: number[];
  isRetriableError?: (...args: any[]) => boolean;
};

export const makeRequest = <T = any, D = any>(
  config: AxiosRequestConfig<D>,
  retryOptions?: RetryOptions
) => {
  const baseURL =
    process.env.CURRENTS_API_BASE_URL || "https://cy.currents.dev";

  return retryWithBackoff((retryIndex: number) => {
    const requestConfig = {
      baseURL,
      ...config,
      headers: {
        "x-cypress-request-attempt": retryIndex,
        "x-cypress-run-id": _runId,
        "x-cypress-version": _cypressVersion,
        "x-currents-version": _currentsVersion,
        ...config.headers,
      },
    };

    debug("sending network request: %o", requestConfig);
    return axios(requestConfig).then((res) => {
      debug("network request response: %o", omit(res, "request", "config"));
      return res;
    });
  }, retryOptions) as Promise<AxiosResponse<T, D>>;
};

const retryWithBackoff = (fn: Function, retryOptions?: RetryOptions) => {
  let attempt: any;

  const options = {
    delays: getDelays(),
    isRetriableError,
    ...retryOptions,
  };

  return (attempt = (retryIndex: number) => {
    return promiseTry(() => fn(retryIndex)).catch((err) => {
      debug("network request failed: %O", err.toJSON ? err.toJSON() : err);
      const shouldRetry = options.isRetriableError(err);

      if (!shouldRetry) {
        throw new VError(err);
      }

      if (retryIndex >= options.delays.length) {
        throw new VError(err, "Max retries reached");
      }

      const delay = options.delays[retryIndex];

      warn(
        "Network request failed: '%s'. Retrying %s time(s) with a %s delay ",
        err.message,
        options.delays.length - retryIndex,
        prettyMS(delay)
      );

      retryIndex++;

      return promiseDelay(delay).then(() => {
        debug(`Retry #${retryIndex} after ${delay}ms`);
        return attempt(retryIndex);
      });
    });
  })(0);
};

const promiseTry = (fn: Function) => {
  return new Promise((resolve) => resolve(fn()));
};

const promiseDelay = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));
