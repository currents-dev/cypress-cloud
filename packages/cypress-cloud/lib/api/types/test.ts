import { Test } from "../../result.types";

export type SetTestsPayload = Pick<
  Test,
  "body" | "title" | "config" | "hookIds"
> & { clientId: string };
