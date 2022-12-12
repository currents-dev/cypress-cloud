import { ScreenshotArtifact, ScreenshotUploadInstruction } from "../types";
import { makeRequest } from "./httpClient";
import { uploadFile } from "./upload";

interface UploadArtifacts {
  videoPath: string | null;
  videoUploadUrl?: string;
  screenshots: ScreenshotArtifact[];
  screenshotUploadUrls: ScreenshotUploadInstruction[];
}
export async function uploadArtifacts({
  videoPath,
  videoUploadUrl,
  screenshots,
  screenshotUploadUrls,
}: UploadArtifacts) {
  // upload video
  if (videoUploadUrl && videoPath) {
    await uploadFile(videoPath, videoUploadUrl);
  }
  // upload screenshots
  if (screenshotUploadUrls.length) {
    await Promise.all(
      screenshots.map((screenshot, i) => {
        const url = screenshotUploadUrls.find(
          (urls) => urls.screenshotId === screenshot.screenshotId
        )?.uploadUrl;
        if (!url) {
          console.warn("Cannot find upload url for screenshot", screenshot);
          return Promise.resolve();
        }
        return uploadFile(screenshot.path, url);
      })
    );
  }
}

export async function uploadStdout(instanceId: string, stdout: string) {
  console.log("Uploading stdout...", instanceId);
  const res = await makeRequest({
    method: "PUT",
    url: `instances/${instanceId}/stdout`,
    data: {
      stdout,
    },
  });
  console.log("Done uploading stdout", instanceId);
  return res.data;
}
