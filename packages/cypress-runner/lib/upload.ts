import axios from "axios";
import fs from "fs";
const readFile = fs.promises.readFile;

export async function uploadFile(file: string, url: string) {
  console.log("Uploading file...", file);
  const f = await readFile(file);
  await axios.put(url, f);
  console.log("Done uploading file", file);
}
