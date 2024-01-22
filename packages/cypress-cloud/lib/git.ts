// @ts-ignore
import { commitInfo } from "@currents/commit-info";
import { getCommitDefaults } from "./ciProvider";

export type GhaEventData = {
  headRef: string;
  headSha: string;
  baseRef: string;
  baseSha: string;
  issueUrl: string;
  htmlUrl: string;
  prTitle: string;
  senderAvatarUrl: string;
  senderHtmlUrl: string;
};

export const getGitInfo = async () => {
  const commit = await commitInfo();
  return getCommitDefaults({
    branch: commit.branch,
    remoteOrigin: commit.remote,
    authorEmail: commit.email,
    authorName: commit.author,
    message: commit.message,
    sha: commit.sha,
    ghaEventData: commit.ghaEventData,
  });
};
