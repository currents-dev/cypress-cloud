import * as log from "cypress-runner/lib/log";
import nock from "nock";
import { getDelays, isRetriableError } from "../config";
import { makeRequest } from "../httpClient";
jest.mock("../config");
jest.mock("cypress-runner/lib/log");

const apiMock = nock("https://cy.currents.dev").persist();

describe("HTTP Client Retries", () => {
  it("does not retry non-axios errors", async () => {
    (isRetriableError as jest.Mock).mockReturnValueOnce(false);

    apiMock.get("/").reply(503);

    await expect(makeRequest({})).rejects.toThrowErrorMatchingInlineSnapshot(
      `": Request failed with status code 503"`
    );
  });

  it("retries and shows warnings for according to attempts config", async () => {
    const retires: any[] = [0, 0];
    (isRetriableError as jest.Mock).mockReturnValue(true);
    (getDelays as jest.Mock).mockReturnValue(retires);

    apiMock.get("/").reply(503);

    try {
      await makeRequest({});
    } catch (r) {}

    expect(log.warn).toHaveBeenCalledTimes(retires.length);
  });
});
