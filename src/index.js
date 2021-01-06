import * as core from '@actions/core';
import { Action, Docker, Input, ImageTag, Output } from './model';

async function action() {
  Action.checkCompatibility();

  const { workspace, actionFolder } = Action;
  const {
    unityVersion,
    customImage,
    projectPath,
    testMode,
    artifactsPath,
    useHostNetwork,
    customParameters,
  } = Input.getFromUser();
  const baseImage = ImageTag.createForBase({ version: unityVersion, customImage });

  // Run docker image
  await Docker.run(baseImage, {
    workspace,
    actionFolder,
    unityVersion,
    projectPath,
    testMode,
    artifactsPath,
    useHostNetwork,
    customParameters,
  });

  // Set output
  await Output.setArtifactsPath(artifactsPath);
}

action().catch(error => {
  core.setFailed(error.message);
});
