module.exports = {
  projectId: !!(process.env.GITHUB_ACTION || process.env.CIRCLE_BRANCH)
    ? "Ij0RfK"
    : "xrH0QX",
  cloudServiceUrl: "http://localhost:1234",
  userAgent: "custom",
};
