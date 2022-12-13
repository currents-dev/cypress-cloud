// @ts-ignore
import git from "@cypress/commit-info";
import { getCommitDefaults } from "./ciProvider";

export const getGitInfo = async () => {
  return getCommitDefaults(await git.commitInfo());
};
