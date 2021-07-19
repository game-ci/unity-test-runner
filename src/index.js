import * as core from '@actions/core';
import { Action, Docker, Input, ImageTag, Output, ResultsCheck } from './model';

async function action() {
  Action.checkCompatibility();

  const { dockerfile, workspace, actionFolder } = Action;
  const {
    unityVersion,
    customImage,
    projectPath,
    testMode,
    artifactsPath,
    useHostNetwork,
    customParameters,
    sshAgent,
    githubToken,
    checkName,
  } = Input.getFromUser();
  const baseImage = ImageTag.createForBase({ version: unityVersion, customImage });

  try {
    // Build docker image
    const actionImage = await Docker.build({ path: actionFolder, dockerfile, baseImage });

    // Run docker image
    await Docker.run(actionImage, {
      workspace,
      unityVersion,
      projectPath,
      testMode,
      artifactsPath,
      useHostNetwork,
      customParameters,
      sshAgent,
      githubToken,
    });
  } finally {
    // Set output
    await Output.setArtifactsPath(artifactsPath);
  }

  if (githubToken) {
    const runSummary = await ResultsCheck.createCheck(artifactsPath, githubToken, checkName);
    if (runSummary.failed >= 1 || runSummary.total === 0 || runSummary.passed === 0) {
      core.setFailed(`Test(s) Failed! Check '${checkName}' for details.`);
    }
  }
}

action().catch(error => {
  core.setFailed(error.message);
});
