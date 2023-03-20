import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import axiosRetry from "axios-retry";
import Debug from "debug";
import _ from "lodash";
import prettyMilliseconds from "pretty-ms";
import { ValidationError } from "../errors";
import { warn } from "../log";
import { getCurrentsVersion, getCypressVersion, getRunId } from "../state";
import { getAPIBaseUrl, getDelay, isRetriableError } from "./config";
import { maybePrintErrors } from "./printErrors";

const debug = Debug("currents:api");

const MAX_RETRIES = 3;

let _client: AxiosInstance | null = null;

export function getClient() {
  if (_client) {
    return _client;
  }
  _client = axios.create({
    baseURL: getAPIBaseUrl(),
  });

  _client.interceptors.request.use((config) => {
    const req = {
      ...config,
      headers: {
        ...config.headers,

        // @ts-ignore
        "x-cypress-request-attempt": config["axios-retry"]?.retryCount ?? 0,
        "x-cypress-run-id": getRunId(),
        "x-cypress-version": getCypressVersion(),
        "x-ccy-version": getCurrentsVersion() ?? "0.0.0",
        "Content-Type": "application/json",
      },
    };
    debug(
      "network request: %o %o",
      _.pick(req, "method", "url", "data", "headers", "baseURL")
    );
    return req;
  });

  axiosRetry(_client, {
    retries: MAX_RETRIES,
    retryCondition: isRetriableError,
    retryDelay: getDelay,
    // @ts-ignore
    onRetry,
  });
  return _client;
}

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
  return getClient()<D, AxiosResponse<T>>(config)
    .then((res) => {
      debug("network request response: %o", _.omit(res, "request", "config"));
      return res;
    })
    .catch((error) => {
      maybePrintErrors(error);
      throw new ValidationError(error.message);
    });
};
