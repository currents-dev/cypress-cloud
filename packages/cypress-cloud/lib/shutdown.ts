import { stopWSS } from "./ws";

export async function shutdown() {
  await stopWSS();
}
