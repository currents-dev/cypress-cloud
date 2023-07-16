import { ValidatedCurrentsParameters } from "../../types";

export class ConfigState {
  private _config: Cypress.ResolvedConfigOptions | undefined = undefined;
  private _currentsParams: ValidatedCurrentsParameters | undefined = undefined;
  public setConfig(c: typeof this._config) {
    this._config = c;
  }
  public getConfig() {
    return this._config;
  }

  public setCurrentsParams(c: typeof this._currentsParams) {
    this._currentsParams = c;
  }
  public getCurrentsParams() {
    return this._currentsParams;
  }

  public getSpecRetryLimit() {
    return this._currentsParams?.experimentalSpecRetries?.retries;
  }
  public getSpecTimeout() {
    return this._currentsParams?.experimentalSpecRetries?.timeoutSeconds;
  }
}
