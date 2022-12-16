import { createRun, CreateRunResponse } from "cypress-runner/lib/api";
import { getBaseUrl } from "cypress-runner/lib/httpClient/config";
import nock from "nock";
import { printWarnings } from "../warnings";
import { createRunPayload, createRunResponse } from "./fixtures/run";

jest.mock("../warnings");
jest.mock("cypress-runner/lib/httpClient/config");

const API_BASEURL = "http://localhost:1234";
const apiMock = nock(API_BASEURL).persist();

(getBaseUrl as jest.Mock).mockReturnValue(API_BASEURL);

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
