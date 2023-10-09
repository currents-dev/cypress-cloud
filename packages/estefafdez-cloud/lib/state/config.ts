export class ConfigState {
  private _config: Cypress.ResolvedConfigOptions | undefined = undefined;
  public setConfig(c: typeof this._config) {
    this._config = c;
  }
  public getConfig() {
    return this._config;
  }
}
