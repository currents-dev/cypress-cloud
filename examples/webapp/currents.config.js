module.exports = {
  projectId: !!(process.env.GITHUB_ACTION || process.env.CIRCLE_BRANCH)
    ? "Ij0RfK"
    : "s0LBur",
  // recordKey: process.env.CURRENTS_RECORD_KEY,
};
