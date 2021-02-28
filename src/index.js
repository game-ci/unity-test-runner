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
      githubToken,
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
}

action().catch(error => {
  core.setFailed(error.message);
});
