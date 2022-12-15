import { CiParams, CiProvider } from "cypress-runner/lib/ciProvider";
import { Platform } from "cypress-runner/types";

export type CreateRunPayload = {
  ci: {
    params: CiParams;
    provider: CiProvider;
  };
  ciBuildId: string;
  projectId: string;
  recordKey: string;
  commit: {
    [memoKey: string]: string | null;
  };
  specs: string[];
  group: string;
  platform: Platform;
  parallel: boolean;
  specPattern: string[];
  tags: string[];
  testingType: "e2e" | "component";
  timeout?: number;
};

export type CreateRunResponse = {
  warnings: any[];
  groupId: string;
  machineId: string;
  runId: string;
  runUrl: string;
  isNewRun: boolean;
};
