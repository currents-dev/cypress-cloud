import {
  CreateInstanceResponse,
  UpdateInstanceResultsResponse,
} from "cypress-runner/lib/api";

export const createInstanceResponse: CreateInstanceResponse = {
  spec: null,
  instanceId: null,
  claimedInstances: 10,
  totalInstances: 10,
};

export const updateInstanceResultsResponse: UpdateInstanceResultsResponse = {
  screenshotUploadUrls: [],
  videoUploadUrl: null,
};
