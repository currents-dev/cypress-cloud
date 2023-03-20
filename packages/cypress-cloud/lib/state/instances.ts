import { InstanceResponseSpecDetails } from "../api";
const instanceIds: Map<string, string> = new Map();

export function setInstanceIds(specs: InstanceResponseSpecDetails[]) {
  specs.forEach((spec) => {
    instanceIds.set(spec.spec, spec.instanceId);
  });
}

export function getInstanceId(spec: string) {
  return instanceIds.get(spec);
}
