import * as core from '@actions/core';

const Output = {
  async setArtifactsPath(artifactsPath) {
    await core.setOutput('artifactsPath', artifactsPath);
  },
  async setCoverageResultsPath(coverageResultsPath) {
    await core.setOutput('coverageResultsPath', coverageResultsPath);
  },
};

export default Output;
