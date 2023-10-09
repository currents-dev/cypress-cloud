import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  RawAxiosRequestHeaders,
} from "axios";
import axiosRetry from "axios-retry";
import Debug from "debug";
import _ from "lodash";
import prettyMilliseconds from "pretty-ms";
import { getCurrentsConfig } from "../config";
import { ValidationError } from "../errors";
import { warn } from "../log";
import { getAPIBaseUrl, getDelay, isRetriableError } from "./config";
import { maybePrintErrors } from "./printErrors";

const debug = Debug("currents:api");

const MAX_RETRIES = 3;
const TIMEOUT_MS = 30 * 1000;
let _client: AxiosInstance | null = null;

export async function getClient() {
  if (_client) {
    return _client;
  }
  const currentsConfig = await getCurrentsConfig();
  _client = axios.create({
    baseURL: getAPIBaseUrl(),
    timeout: TIMEOUT_MS,
  });

  _client.interceptors.request.use((config) => {
    const ccyVerson = _currentsVersion ?? "0.0.0";
    const headers: RawAxiosRequestHeaders = {
      ...config.headers,
      // @ts-ignore
      "x-cypress-request-attempt": config["axios-retry"]?.retryCount ?? 0,
      "x-cypress-version": _cypressVersion ?? "0.0.0",
      "x-ccy-version": ccyVerson,
      "User-Agent": `estefafdez-cloud/${ccyVerson}`,
    };
    if (_runId) {
      headers["x-cypress-run-id"] = _runId;
    }
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    if (currentsConfig.networkHeaders) {
      const filteredHeaders = _.omit(currentsConfig.networkHeaders, [
        "x-cypress-request-attempt",
        "x-cypress-version",
        "x-ccy-version",
        "x-cypress-run-id",
        "Content-Type",
      ]);
      debug("using custom network headers: %o", filteredHeaders);
      Object.assign(headers, filteredHeaders);
    }

    const req = {
      ...config,
      headers,
    };

    debug("network request: %o", {
      ..._.pick(req, "method", "url", "headers"),
      data: Buffer.isBuffer(req.data) ? "buffer" : req.data,
    });

    return req;
  });

  axiosRetry(_client, {
    retries: MAX_RETRIES,
    retryCondition: isRetriableError,
    retryDelay: getDelay,
    // @ts-ignore
    onRetry,
    shouldResetTimeout: true,
  });
  return _client;
}

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
  config: AxiosRequestConfig
) {
  warn(
    "Network request '%s' failed: '%s'. Next attempt is in %s (%d/%d).",
    `${config.method} ${config.url}`,
    err.message,
    prettyMilliseconds(getDelay(retryCount)),
    retryCount,
    MAX_RETRIES
  );
}

export const makeRequest = async <T = any, D = any>(
  config: AxiosRequestConfig<D>
) => {
  return (await getClient())<D, AxiosResponse<T>>(config)
    .then((res) => {
      debug("network response: %o", _.omit(res, "request", "config"));
      return res;
    })
    .catch((error) => {
      maybePrintErrors(error);
      throw new ValidationError(error.message);
    });
};
