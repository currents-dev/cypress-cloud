const isCI = !!(process.env.GITHUB_ACTION || process.env.CIRCLE_BRANCH);

module.exports = {
  projectId: isCI ? "Ij0RfK" : "VGLEa1",
  cloudServiceUrl: !isCI ? "http://localhost:1234" : undefined,
  recordKey: process.env.CURRENTS_RECORD_KEY || "DsDpjPk0ITxBLTmn",
  userAgent: "custom",
};
