import debugFn from "debug";
import _ from "lodash";

import { GhaEventData } from "../git";
import { CiProvider, CiProviderData, getCommitParams } from "./ciProvider";

const debug = debugFn("currents:ci");

export function getCommitDefaults(existingInfo: CiProviderData) {
  debug("git commit existing info");
  debug(existingInfo);

  const commitParamsObj = getCommitParams();

  debug("commit info from provider environment variables: %O", commitParamsObj);

  // based on the existingInfo properties
  // merge in the commitParams if null or undefined
  // defaulting back to null if all fails
  // NOTE: only properties defined in "existingInfo" will be returned
  const combined = _.transform(
    existingInfo,
    (
      memo: { [memoKey: string]: string | GhaEventData | null },
      value: string | GhaEventData | null,
      key: string
    ) => {
      return (memo[key] = _.defaultTo(
        value ||
          (commitParamsObj ? commitParamsObj[key as keyof CiProvider] : null),
        null
      ));
    }
  );

  debug("combined git and environment variables from provider");
  debug(combined);

  return combined;
}
