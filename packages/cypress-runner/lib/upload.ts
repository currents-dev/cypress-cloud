import fs from "fs";
import { makeRequest } from "./httpClient";
const readFile = fs.promises.readFile;

export async function uploadFile(file: string, url: string) {
  const f = await readFile(file);
  await makeRequest({
    url,
    method: "PUT",
    data: f,
  });
}
