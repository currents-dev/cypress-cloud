import { rest } from "msw";
import {
  createInstanceResponse,
  updateInstanceResultsResponse,
} from "./fixtures/instance";
import { createRunResponse } from "./fixtures/run";

export const CURRENTS_API_BASE_URL = "http://localhost:1234";

const createRun = rest.post(
  `${CURRENTS_API_BASE_URL}/runs`,
  (req, res, ctx) => {
    return res(ctx.json(createRunResponse));
  }
);

const createInstance = rest.post(
  `${CURRENTS_API_BASE_URL}/runs/:runId/instances`,
  (req, res, ctx) => {
    return res(ctx.json(createInstanceResponse));
  }
);

const setInstanceTests = rest.post(
  `${CURRENTS_API_BASE_URL}/instances/:instanceId/tests`,
  (req, res, ctx) => {
    return res(ctx.json({}));
  }
);

const updateInstanceResults = rest.post(
  `${CURRENTS_API_BASE_URL}/instances/:instanceId/results`,
  (req, res, ctx) => {
    return res(ctx.json(updateInstanceResultsResponse));
  }
);

const updateInstanceStdout = rest.put(
  `${CURRENTS_API_BASE_URL}/instances/:instanceId/stdout`,
  (req, res, ctx) => {
    return res(ctx.json({}));
  }
);

export const handlers = [
  createRun,
  createInstance,
  setInstanceTests,
  updateInstanceResults,
  updateInstanceStdout,
];
