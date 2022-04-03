import * as core from '@actions/core';
import { Action, Docker, ImageTag, Input, Output, ResultsCheck } from './model';

async function run() {
  try {
    Action.checkCompatibility();

    const { workspace, actionFolder } = Action;
    const {
      unityVersion,
      customImage,
      projectPath,
      customParameters,
      testMode,
      artifactsPath,
      useHostNetwork,
      sshAgent,
      gitPrivateToken,
      githubToken,
      checkName,
    } = Input.getFromUser();
    const baseImage = new ImageTag({ version: unityVersion, customImage });
    const runnerTempPath = process.env.RUNNER_TEMP;

    try {
      await Docker.run(baseImage, {
        actionFolder,
        unityVersion,
        workspace,
        projectPath,
        customParameters,
        testMode,
        artifactsPath,
        useHostNetwork,
        sshAgent,
        gitPrivateToken,
        githubToken,
        runnerTempPath,
      });
    } finally {
      // Set output
      await Output.setArtifactsPath(artifactsPath);
    }

    if (githubToken) {
      const failedTestCount = await ResultsCheck.createCheck(artifactsPath, githubToken, checkName);
      if (failedTestCount >= 1) {
        core.setFailed(`Test(s) Failed! Check '${checkName}' for details.`);
      }
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
