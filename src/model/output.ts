import * as core from '@actions/core';

const Output = {
  async setArtifactsPath(artifactsPath) {
    await core.setOutput('artifactsPath', artifactsPath);
  },
  async setCoveragePath(coveragePath) {
    await core.setOutput('coveragePath', coveragePath);
  },
};

export default Output;
