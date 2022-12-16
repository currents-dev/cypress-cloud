import { exec } from "child_process";
import { server } from "./mocks/server";
import axios from "axios";
import { CURRENTS_API_BASE_URL } from "./mocks/handlers";

server.listen();

axios
  .post(`${CURRENTS_API_BASE_URL}/runs`)
  .then((res) => console.log(res.status, res.statusText, res.data))
  .catch((error) => console.error(error.code));

const _process = exec(
  "export CURRENTS_API_BASE_URL=$CURRENTS_API_BASE_URL && yarn cypress-runner --parallel --record --key $CURRENTS_RECORD_KEY",
  {
    env: {
      ...process.env,
      CURRENTS_RECORD_KEY: "kPPoz5koI4q92YiJ",
      CURRENTS_API_BASE_URL,
    },
  }
);

_process.stdout.pipe(process.stdout);
_process.stderr.pipe(process.stderr);

setTimeout(() => {
  server.close();
}, 10000);
