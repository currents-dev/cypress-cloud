import { makeRequest } from "../httpClient";
import {
  CreateInstancePayload,
  CreateInstanceResponse,
  CreateRunPayload,
  CreateRunResponse,
  SetInstanceTestsPayload,
  UpdateInstanceResultsPayload,
  UpdateInstanceResultsResponse,
} from "./types/";

export const createRun = (payload: CreateRunPayload) =>
  makeRequest<CreateRunResponse, CreateRunPayload>({
    method: "POST",
    url: "runs",
    data: payload,
  }).then((res) => res.data);

export const createInstance = ({
  runId,
  groupId,
  machineId,
  platform,
}: CreateInstancePayload) =>
  makeRequest<CreateInstanceResponse, CreateInstancePayload>({
    method: "POST",
    url: `runs/${runId}/instances`,
    data: {
      runId,
      groupId,
      machineId,
      platform,
    },
  }).then((res) => res.data);

export const setInstanceTests = (
  instanceId: string,
  payload: SetInstanceTestsPayload
) =>
  makeRequest<{}, SetInstanceTestsPayload>({
    method: "POST",
    url: `instances/${instanceId}/tests`,
    data: payload,
  }).then((result) => result.data);

export const updateInstanceResults = (
  instanceId: string,
  payload: UpdateInstanceResultsPayload
) =>
  makeRequest<UpdateInstanceResultsResponse, UpdateInstanceResultsPayload>({
    method: "POST",
    url: `instances/${instanceId}/results`,
    data: payload,
  }).then((result) => result.data);

export const updateInstanceStdout = (instanceId: string, stdout: string) =>
  makeRequest<any, { stdout: string }>({
    method: "PUT",
    url: `instances/${instanceId}/stdout`,
    data: {
      stdout,
    },
  });
