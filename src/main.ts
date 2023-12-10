import * as core from '@actions/core';
import { Action, Docker, ImageTag, Input, Output, ResultsCheck } from './model';

export async function run() {
  try {
    Action.checkCompatibility();

    const { workspace, actionFolder } = Action;
    const {
      editorVersion,
      customImage,
      projectPath,
      customParameters,
      testMode,
      coverageOptions,
      artifactsPath,
      useHostNetwork,
      sshAgent,
      sshPublicKeysDirectoryPath,
      gitPrivateToken,
      githubToken,
      checkName,
      packageMode,
      packageName,
      chownFilesTo,
      dockerCpuLimit,
      dockerMemoryLimit,
      dockerIsolationMode,
      unityLicensingServer,
      runAsHostUser,
      containerRegistryRepository,
      containerRegistryImageVersion,
    } = Input.getFromUser();
    const baseImage = new ImageTag({
      editorVersion,
      customImage,
      containerRegistryRepository,
      containerRegistryImageVersion,
    });
    const runnerContext = Action.runnerContext();

    try {
      await Docker.run(baseImage, {
        actionFolder,
        editorVersion,
        workspace,
        projectPath,
        customParameters,
        testMode,
        coverageOptions,
        artifactsPath,
        useHostNetwork,
        sshAgent,
        sshPublicKeysDirectoryPath,
        packageMode,
        packageName,
        gitPrivateToken,
        githubToken,
        chownFilesTo,
        dockerCpuLimit,
        dockerMemoryLimit,
        dockerIsolationMode,
        unityLicensingServer,
        runAsHostUser,
        ...runnerContext,
      });
    } finally {
      await Output.setArtifactsPath(artifactsPath);
      await Output.setCoveragePath('CodeCoverage');
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
