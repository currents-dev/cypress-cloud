import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

let _runId: string | undefined = undefined;
export const setRunId = (runId: string) => {
  _runId = runId;
};

let _cypressVersion: string | undefined = undefined;
export const setCypressVersion = (cypressVersion: string) => {
  _cypressVersion = cypressVersion;
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

  console.log(
    "Currents API Request:",
    `${config.method || "GET"} ${baseURL}/${config.url || ""}`
  );
  return retryWithBackoff(
    (retryIndex: number) =>
      axios({
        baseURL,
        ...config,
        headers: {
          "x-cypress-request-attempt": retryIndex,
          "x-cypress-run-id": _runId,
          "x-cypress-version": _cypressVersion,
          ...config.headers,
        },
      }),
    retryOptions
  ) as Promise<AxiosResponse<T, D>>;
};

const DELAYS = [30 * 1000, 60 * 1000, 2 * 60 * 1000]; // 30s, 1min, 2min

const isRetriableError = (err: { response?: { status?: number } }) => {
  return (
    err?.response?.status &&
    500 <= err.response.status &&
    err.response.status < 600
  );
};

const retryWithBackoff = (fn: Function, retryOptions?: RetryOptions) => {
  let attempt: any;

  const options = {
    delays: DELAYS,
    isRetriableError: isRetriableError,
    ...retryOptions,
  };

  return (attempt = (retryIndex: number) => {
    return promiseTry(() => fn(retryIndex)).catch((err) => {
      if (!options.isRetriableError(err)) throw err;

      if (retryIndex > options.delays.length) {
        throw err;
      }

      const delay = options.delays[retryIndex];

      console.warn("API failed retrying", {
        delay,
        tries: options.delays.length - retryIndex,
        response: err,
      });

      retryIndex++;

      return promiseDelay(delay).then(() => {
        console.debug(`Retry #${retryIndex} after ${delay}ms`);

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
