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
    createCheck,
    checkName,
    githubToken,
    customParameters,
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
      createCheck,
      customParameters,
    });
  } finally {
    // Set output
    await Output.setArtifactsPath(artifactsPath);
  }

  if (createCheck) {
    const fail = await ResultsCheck.publishResults(artifactsPath, checkName, githubToken);
    if (fail > 0) {
      core.setFailed(`Tests Failed! Check ${checkName} for details.`);
    }
  }
}

action().catch(error => {
  core.setFailed(error.message);
});
