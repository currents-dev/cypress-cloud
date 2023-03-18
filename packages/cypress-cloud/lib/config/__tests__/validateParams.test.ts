import { CurrentsRunParameters } from "cypress-cloud/types";
import { getCurrentsConfig } from "../config";
import {
  cloudServiceInvalidUrlError,
  cloudServiceUrlError,
  projectIdError,
  recordKeyError,
  validateParams,
  ValidationError,
} from "../params";

jest.mock("cypress-cloud/lib/log");
jest.mock("../config", () => ({
  getCurrentsConfig: jest.fn(() => ({
    e2e: {
      batchSize: 10,
    },
    component: {
      batchSize: 10,
    },
  })),
}));

describe("validateParams", () => {
  it("should throw an error if cloudServiceUrl is invalid", () => {
    expect(() => validateParams({ cloudServiceUrl: "" })).toThrow(
      new ValidationError(cloudServiceUrlError)
    );

    // invalid cloudServiceUrl
    expect(() =>
      validateParams({
        testingType: "e2e",
        projectId: "project-id",
        recordKey: "record-key",
        cloudServiceUrl: "not a valid url",
      })
    ).toThrow(
      new ValidationError(cloudServiceInvalidUrlError + ': "not a valid url"')
    );
  });
  it("should throw an error if projectId is not provided", () => {
    expect(() =>
      validateParams({ cloudServiceUrl: "a", projectId: "" })
    ).toThrow(new ValidationError(projectIdError));
  });
  it("should throw an error if recordKey is not provided", () => {
    expect(() =>
      validateParams({ projectId: "s", cloudServiceUrl: "f", recordKey: "" })
    ).toThrow(new ValidationError(recordKeyError));
  });

  it("should throw an error when a required parameter is missing", () => {
    (getCurrentsConfig as jest.Mock).mockReturnValueOnce({
      e2e: {},
    });
    const params: CurrentsRunParameters = {
      cloudServiceUrl: "http://localhost:3000",
      projectId: "project-1",
      recordKey: "some-key",
    };

    expect(() => validateParams(params)).toThrowError(
      "Missing required parameter"
    );
  });

  it("should return validated params if all required parameters are provided", () => {
    const params: CurrentsRunParameters = {
      batchSize: 10,
      testingType: "e2e",
      cloudServiceUrl: "http://localhost:3333",
      projectId: "abc123",
      recordKey: "def456",
    };

    expect(validateParams(params)).toEqual({
      ...params,
    });
  });
});
