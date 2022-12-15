import { AxiosError, isAxiosError } from "axios";

export const isRetriableError = (err: AxiosError | Error) => {
  if (!isAxiosError(err)) {
    return false;
  }
  if (err.code === "ECONNREFUSED") {
    return true;
  }
  return (
    err?.response?.status &&
    500 <= err.response.status &&
    err.response.status < 600
  );
};

export const getDelays = () => [30 * 1000, 60 * 1000, 2 * 60 * 1000]; // 30s, 1min, 2min
