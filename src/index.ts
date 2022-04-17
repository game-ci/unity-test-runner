import * as core from '@actions/core';
import { Action, Docker, ImageTag, Input, Output, ResultsCheck } from './model';

async function run() {
  try {
    Action.checkCompatibility();

    const { workspace, actionFolder } = Action;
    const {
      editorVersion,
      customImage,
      projectPath,
      customParameters,
      testMode,
      enableCodeCoverage,
      artifactsPath,
      useHostNetwork,
      sshAgent,
      gitPrivateToken,
      githubToken,
      checkName,
    } = Input.getFromUser();
    const baseImage = new ImageTag({ editorVersion, customImage });
    const runnerTemporaryPath = process.env.RUNNER_TEMP;

    try {
      await Docker.run(baseImage, {
        actionFolder,
        editorVersion,
        workspace,
        projectPath,
        customParameters,
        testMode,
        enableCodeCoverage,
        artifactsPath,
        useHostNetwork,
        sshAgent,
        gitPrivateToken,
        githubToken,
        runnerTemporaryPath,
      });
    } finally {
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
