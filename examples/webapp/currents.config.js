module.exports = {
  batchSize: 3, // how many specs to send in one batch
  projectId: !!(process.env.GITHUB_ACTION || process.env.CIRCLE_BRANCH)
    ? "Ij0RfK"
    : "l4zuz8",
  // recordKey: process.env.CURRENTS_RECORD_KEY,
};
