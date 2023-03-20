import Debug from "debug";
import fs from "fs";
import {
  reportInstanceResultsMerged,
  setInstanceTests,
  SetInstanceTestsPayload,
  updateInstanceResults,
  UpdateInstanceResultsPayload,
} from "./api";
import { isCurrents } from "./env";
import { makeRequest } from "./httpClient";
const readFile = fs.promises.readFile;
const debug = Debug("currents:upload");

export async function uploadFile(file: string, url: string) {
  debug('uploading file "%s" to "%s"', file, url);
  const f = await readFile(file);
  await makeRequest({
    url,
    method: "PUT",
    data: f,
  });
}
export async function uploadSpecResults(
  instanceId: string,
  instanceTests: SetInstanceTestsPayload,
  instanceResults: UpdateInstanceResultsPayload
) {
  debug("reporting instance %s results...", instanceId);
  if (isCurrents()) {
    return reportInstanceResultsMerged(instanceId, {
      tests: instanceTests,
      results: instanceResults,
    });
  }

  // run one after another
  await setInstanceTests(instanceId, instanceTests);
  return updateInstanceResults(instanceId, instanceResults);
}
