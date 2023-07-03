import debug from "debug";
import { match, P } from "ts-pattern";
import { CurrentsRunParameters, DebugMode } from "../../types";

enum DebugTokens {
  Currents = "currents:*",
  Cypress = "cypress:*",
  CommitInfo = "commit-info",
}
export function activateDebug(mode: CurrentsRunParameters["cloudDebug"]) {
  match(mode)
    .with(P.instanceOf(Array), (i) => i.forEach(setDebugMode))
    .with(true, () => setDebugMode(DebugMode.All))
    .with(
      P.union(
        DebugMode.All,
        DebugMode.Currents,
        DebugMode.Cypress,
        DebugMode.CommitInfo
      ),
      (i) => setDebugMode(i)
    )
    .otherwise(() => setDebugMode(DebugMode.None));
}

function setDebugMode(mode: string) {
  if (mode === DebugMode.None) {
    return;
  }

  const tokens = new Set(process.env.DEBUG ? process.env.DEBUG.split(",") : []);
  match(mode)
    .with(DebugMode.All, () => {
      tokens.add(DebugTokens.CommitInfo);
      tokens.add(DebugTokens.Currents);
      tokens.add(DebugTokens.Cypress);
    })
    .with(DebugMode.Currents, () => tokens.add(DebugTokens.Currents))
    .with(DebugMode.Cypress, () => tokens.add(DebugTokens.Cypress))
    .with(DebugMode.CommitInfo, () => tokens.add(DebugTokens.CommitInfo))
    .otherwise(() => {});

  debug.enable(Array.from(tokens).join(","));
}
