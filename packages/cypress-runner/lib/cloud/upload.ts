import Debug from "debug";
import fs from "fs";
import { makeRequest } from "../httpClient";
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
