const core = require('@actions/core');

class Output {
  static async setArtifactsPath(artifactsPath) {
    await core.setOutput('artifactsPath', artifactsPath);
  }
}

export default Output;
