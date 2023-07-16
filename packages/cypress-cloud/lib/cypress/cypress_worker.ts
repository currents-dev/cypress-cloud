import cypress from "cypress";
import pidtree from "pidtree";
import process from "process";
import { match } from "ts-pattern";
import { parentPort } from "worker_threads";
import { warn } from "../log";

if (!parentPort) {
  process.exit(1);
}

type Message =
  | {
      type: "run";
      payload: any;
    }
  | {
      type: "stop";
      payload: null;
    };

parentPort.on("message", async (message: Message) => {
  console.log("Received message from parent: %o", message);
  match(message)
    .with({ type: "run" }, ({ payload }) =>
      cypress.run(payload).then(sendResult).catch(sendError)
    )
    .with({ type: "stop" }, async () => await terminateChildProcesses())
    .otherwise(() => warn("Unknown message: %o", message));
});

function sendResult(result: any) {
  parentPort?.postMessage({
    type: "result",
    payload: result,
  });
}

function sendError(error: any) {
  parentPort?.postMessage({
    type: "error",
    payload: error,
  });
}

async function terminateChildProcesses() {
  const pids = await pidtree(process.pid);
  pids.forEach((pid) => {
    debug('Killing process "%d"', pid);
    try {
      process.kill(pid, "SIGKILL");
    } catch (e) {
      // ignore
    }
  });
}
