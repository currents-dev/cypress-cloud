import fs from "fs";
import { makeRequest } from "./httpClient";
const readFile = fs.promises.readFile;

export async function uploadFile(file: string, url: string) {
  console.log("Uploading file...", file);
  const f = await readFile(file);
  await makeRequest({
    url,
    method: "PUT",
    data: f,
  });
  console.log("Done uploading file", file);
}
