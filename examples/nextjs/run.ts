import { run } from "cypress-runner";

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
