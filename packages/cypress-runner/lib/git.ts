// @ts-ignore
import git from "@cypress/commit-info";
import { getCommitDefaults } from "./ciProvider";

export const getGitInfo = async () => {
  const commitInfo = await git.commitInfo();
  return getCommitDefaults({
    remoteOrigin: commitInfo.branch,
    authorEmail: commitInfo.email,
    authorName: commitInfo.author,
    ...commitInfo,
  });
};
