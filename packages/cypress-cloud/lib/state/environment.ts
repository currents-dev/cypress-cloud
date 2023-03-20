let _runId: string | undefined = undefined;
export const setRunId = (runId: string) => {
  _runId = runId;
};
export const getRunId = () => _runId;

let _cypressVersion: string | undefined = undefined;
export const getCypressVersion = () => _cypressVersion;
export const setCypressVersion = (cypressVersion: string) => {
  _cypressVersion = cypressVersion;
};

let _currentsVersion: string | undefined = undefined;
export const getCurrentsVersion = () => _currentsVersion;
export const setCurrentsVersion = (v: string) => {
  _currentsVersion = v;
};
