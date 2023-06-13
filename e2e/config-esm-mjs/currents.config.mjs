const config = {
  e2e: {
    batchSize: 3, // how many specs to send in one batch
  },
  component: {
    batchSize: 5, // how many specs to send in one batch
  },
  projectId: !!(process.env.GITHUB_ACTION || process.env.CIRCLE_BRANCH)
    ? "Ij0RfK"
    : "1OPP8c",
  // cloudServiceUrl: "http://localhost:1234",
};

export default config;
