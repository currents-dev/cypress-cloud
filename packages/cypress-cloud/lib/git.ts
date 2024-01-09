// @ts-ignore
import { commitInfo } from "@currents/commit-info";
import { getCommitDefaults } from "./ciProvider";

export const getGitInfo = async (projectRoot: string) => {
  const commit = await commitInfo();
  return getCommitDefaults({
    branch: commit.branch,
    remoteOrigin: commit.remote,
    authorEmail: commit.email,
    authorName: commit.author,
    message: commit.message,
    sha: commit.sha,
  });
};
