import { createRun, CreateRunResponse } from "@currents/cypress/lib/api";
import { getBaseUrl } from "@currents/cypress/lib/httpClient/config";
import nock from "nock";
import { printWarnings } from "../warnings";
import { createRunPayload, createRunResponse } from "./fixtures/run";

jest.mock("../warnings");
jest.mock("@currents/cypress/lib/httpClient/config", () => ({
  getBaseUrl: jest.fn().mockReturnValue("http://localhost:1234"),
}));

const apiMock = nock(getBaseUrl()).persist();

describe("POST /runs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("print warnings when exist", async () => {
    const date = new Date().toISOString();
    const warnings = [
      {
        message: "Message A",
        detailA: "some detail",
        detailB: "more detail",
      },
      {
        message: "Message B",
        detailA: "oh",
        detailB: date,
      },
    ];
    const responsePayload: CreateRunResponse = {
      ...createRunResponse,
      warnings,
    };
    apiMock.post("/runs").reply(200, responsePayload);
    await createRun(createRunPayload);
    expect(printWarnings).toHaveBeenCalledWith(warnings);
  });
});
