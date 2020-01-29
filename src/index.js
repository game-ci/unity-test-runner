import * as core from '@actions/core';
import { Action, Docker, Input, ImageTag, Output } from './model';

async function action() {
  Action.checkCompatibility();

  const { dockerfile, workspace, actionFolder } = Action;
  const { unityVersion, projectPath, artifactsPath, customParameters } = Input.getFromUser();
  const baseImage = ImageTag.createForBase(unityVersion);

  // Build docker image
  const actionImage = await Docker.build({ path: actionFolder, dockerfile, baseImage });

  // Run docker image
  await Docker.run(actionImage, {
    workspace,
    unityVersion,
    projectPath,
    artifactsPath,
    customParameters,
  });

  // Set output
  await Output.setArtifactsPath(artifactsPath);
}

action().catch(error => {
  core.setFailed(error.message);
});
