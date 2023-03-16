import { CurrentsRunParameters } from "../types";
import { error } from "./log";

export function validateRequiredParams(params: CurrentsRunParameters) {
  const requiredParameters: Array<keyof CurrentsRunParameters> = [
    "key",
    "projectId",
    "ciBuildId",
    "testingType",
  ];
  requiredParameters.forEach((key) => {
    if (typeof params[key] === "undefined") {
      error(
        'Missing required parameter "%s". Please provide at least the following parameters: %s',
        key,
        requiredParameters.join(", ")
      );
      throw new Error("Missing required parameter");
    }
  });
}
