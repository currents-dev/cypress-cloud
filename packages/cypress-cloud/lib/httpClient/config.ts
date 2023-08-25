import { AxiosError, isAxiosError } from "axios";

export const isRetriableError = (err: AxiosError): boolean => {
  if (err.code === "ECONNABORTED") {
    return true;
  }
  if (err.code === "ECONNREFUSED") {
    return true;
  }
  if (err.code === "ETIMEDOUT") {
    return true;
  }

  if (!isAxiosError(err)) {
    return false;
  }

  return !!(
    err?.response?.status &&
    500 <= err.response.status &&
    err.response.status < 600
  );
};

export const getDelay = (i: number) => [5 * 1000, 10 * 1000, 30 * 1000][i - 1];

let baseURL = "https://cy.currents.dev";
export const getAPIBaseUrl = () => baseURL ?? "https://cy.currents.dev";
export const setAPIBaseUrl = (url?: string) =>
  (baseURL = url ?? "https://cy.currents.dev");
