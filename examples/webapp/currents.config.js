module.exports = {
  e2e: {
    batchSize: 2, // how many specs to send in one batch
  },
  component: {
    batchSize: 5, // how many specs to send in one batch
  },
  projectId: !!(process.env.GITHUB_ACTION || process.env.CIRCLE_BRANCH)
    ? "Ij0RfK"
    : "Ij0RfK",
  // cloudServiceUrl: "http://localhost:1234",
  userAgent: "custom",
};
