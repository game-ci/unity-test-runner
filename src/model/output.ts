import * as core from '@actions/core';

const Output = {
  async setArtifactsPath(artifactsPath) {
    await core.setOutput('artifactsPath', artifactsPath);
  },
};

export default Output;
