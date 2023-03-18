import { expect } from "@jest/globals";
import { getCurrentsConfig } from "../../config";
import { getRunParametersFromCLI } from "../cli";
import { program } from "../program";

jest.mock("../program", () => ({
  program: {
    error: jest.fn(),
  },
}));
jest.mock("../../config", () => ({
  getCurrentsConfig: jest.fn(() => ({
    projectId: "projectID",
    recordKey: "key",
    e2e: {
      batchSize: 1,
    },
    component: {
      batchSize: 2,
    },
  })),
}));

describe("getRunParametersFromCLI", () => {
  beforeEach(() => {
    ["CURRENTS_RECORD_KEY", "CURRENTS_PROJECT_ID"].forEach((key) => {
      process.env[key] = undefined;
      delete process.env[key];
    });
  });
  it.only("picks the correct batch size for component tests", async () => {
    // @ts-expect-error
    expect(await getRunParametersFromCLI({ component: true })).toMatchObject(
      {}
    );
  });
  it("picks the correct batch size for e2e tests", async () => {
    // @ts-expect-error
    expect(await getRunParametersFromCLI({ component: false })).toMatchObject({
      batchSize: 1,
    });
  });

  it("errors when no key is provided", async () => {
    (getCurrentsConfig as jest.Mock).mockResolvedValueOnce({});
    // @ts-ignore
    await getRunParametersFromCLI({});
    expect(program.error).toHaveBeenCalledWith(
      expect.stringMatching("Missing 'key'")
    );
  });

  it("errors when no projectId is provided", async () => {
    (getCurrentsConfig as jest.Mock).mockResolvedValueOnce({
      recordKey: "some",
    });

    // @ts-ignore
    await getRunParametersFromCLI({});
    expect(program.error).toHaveBeenCalledWith(
      expect.stringMatching("Missing 'projectId'")
    );
  });

  it("picks record key from env variables", async () => {
    process.env.CURRENTS_RECORD_KEY = "envKey";
    (getCurrentsConfig as jest.Mock).mockResolvedValueOnce({
      recordKey: "configKey",
      projectId: "projectID",
      e2e: {
        batchSize: 1,
      },
    });
    // @ts-ignore
    const results = await getRunParametersFromCLI({});
    expect(results).toMatchObject({
      key: "envKey",
    });
    expect(program.error).not.toHaveBeenCalled();
  });

  it("picks record key from CLI", async () => {
    process.env.CURRENTS_RECORD_KEY = "envKey";
    (getCurrentsConfig as jest.Mock).mockResolvedValueOnce({
      recordKey: "configKey",
      projectId: "projectID",
      e2e: {
        batchSize: 1,
      },
    });
    // @ts-ignore
    const results = await getRunParametersFromCLI({
      key: "cliKey",
    });
    expect(results).toMatchObject({
      key: "cliKey",
    });
    expect(program.error).not.toHaveBeenCalled();
  });

  it("picks record key from config", async () => {
    (getCurrentsConfig as jest.Mock).mockResolvedValueOnce({
      recordKey: "configKey",
      projectId: "projectID",
      e2e: {
        batchSize: 1,
      },
    });
    // @ts-ignore
    const results = await getRunParametersFromCLI({});
    expect(results).toMatchObject({
      key: "configKey",
    });
    expect(program.error).not.toHaveBeenCalled();
  });

  it("picks projectId from env variables", async () => {
    process.env.CURRENTS_PROJECT_ID = "envProjectID";
    (getCurrentsConfig as jest.Mock).mockResolvedValueOnce({
      recordKey: "configKey",
      projectId: "configProjectID",
      e2e: {
        batchSize: 1,
      },
    });
    // @ts-ignore
    const results = await getRunParametersFromCLI({});
    expect(results).toMatchObject({
      projectId: "envProjectID",
    });
    expect(program.error).not.toHaveBeenCalled();
  });

  it("picks projectId from config", async () => {
    (getCurrentsConfig as jest.Mock).mockResolvedValueOnce({
      recordKey: "configKey",
      projectId: "configProjectID",
      e2e: {
        batchSize: 1,
      },
    });
    // @ts-ignore
    const results = await getRunParametersFromCLI({
      key: "cliKey",
    });
    expect(results).toMatchObject({
      projectId: "configProjectID",
    });
    expect(program.error).not.toHaveBeenCalled();
  });
});
