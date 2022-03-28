import * as core from '@actions/core';
import { Action, Docker, ImageTag, Input, Output, ResultsCheck } from './model';

async function run() {
  try {
    Action.checkCompatibility();

    const { dockerfile, workspace, actionFolder } = Action;
    const {
      unityVersion,
      customImage,
      projectPath,
      customParameters,
      testMode,
      generateCoverageReport,
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
      // Build docker image
      const actionImage = await Docker.build({ path: actionFolder, dockerfile, baseImage });

      // Run docker image
      await Docker.run(actionImage, {
        unityVersion,
        workspace,
        projectPath,
        customParameters,
        testMode,
        generateCoverageReport,
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
