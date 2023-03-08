import { AxiosError, isAxiosError } from "axios";
import { getCurrentsConfig } from "../config";

export const isRetriableError = (err: AxiosError): boolean => {
  if (!isAxiosError(err)) {
    return false;
  }
  if (err.code === "ECONNREFUSED") {
    return true;
  }
  return !!(
    err?.response?.status &&
    500 <= err.response.status &&
    err.response.status < 600
  );
};

export const getDelay = (i: number) => [15 * 1000, 30 * 1000, 60 * 1000][i - 1];

export const getBaseUrl = () =>
  process.env.CURRENTS_API_URL ??
  getCurrentsConfig().cloudServiceUrl ??
  "https://cy.currents.dev";
