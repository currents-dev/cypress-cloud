import { loadEnvConfig } from "@next/env";

export function loadEnvVariables() {
  const projectDir = process.cwd();
  loadEnvConfig(projectDir);
}
