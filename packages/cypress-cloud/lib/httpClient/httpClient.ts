import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import axiosRetry from "axios-retry";
import Debug from "debug";
import { omit } from "lodash";
import prettyMilliseconds from "pretty-ms";
import { warn } from "../log";
import { getBaseUrl, getDelay, isRetriableError } from "./config";
import { maybePrintErrors } from "./printErrors";

const debug = Debug("currents:api");

const MAX_RETRIES = 3;

const client = axios.create({
  baseURL: getBaseUrl(),
});

client.interceptors.request.use((config) => ({
  ...config,
  headers: {
    ...config.headers,
    // @ts-ignore
    "x-cypress-request-attempt": config["axios-retry"]?.retryCount ?? 0,
    "x-cypress-run-id": _runId,
    "x-cypress-version": _cypressVersion,
    "x-ccy-version": _currentsVersion ?? "0.0.0",
  },
}));

axiosRetry(client, {
  retries: MAX_RETRIES,
  retryCondition: isRetriableError,
  retryDelay: getDelay,
  // @ts-ignore
  onRetry,
});

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

function onRetry(
  retryCount: number,
  err: AxiosError<{ message: string; errors?: string[] }>,
  _config: AxiosRequestConfig
) {
  warn(
    "Network request failed: '%s'. Next attempt is in %s (%d/%d).",
    err.message,
    prettyMilliseconds(getDelay(retryCount)),
    retryCount,
    MAX_RETRIES
  );
}

export const makeRequest = <T = any, D = any>(
  config: AxiosRequestConfig<D>
) => {
  debug("network request: %O", config);

  return client<D, AxiosResponse<T>>(config)
    .then((res) => {
      debug("network request response: %o", omit(res, "request", "config"));
      return res;
    })
    .catch((error) => {
      maybePrintErrors(error);
      throw new Error(error.message);
    });
};
