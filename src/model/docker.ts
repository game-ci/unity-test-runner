import { existsSync, mkdirSync } from 'fs';
import LicensingServerSetup from './licensing-server-setup';
import { exec } from '@actions/exec';
import path from 'path';

const Docker = {
  async run(image, parameters, silent = false) {
    let runCommand = '';

    if (parameters.unityLicensingServer !== '') {
      LicensingServerSetup.Setup(parameters.unityLicensingServer, parameters.actionFolder);
    }

    switch (process.platform) {
      case 'linux':
        runCommand = this.getLinuxCommand(image, parameters);
        break;
      case 'win32':
        runCommand = this.getWindowsCommand(image, parameters);
        break;
      default:
        throw new Error(`Operation system, ${process.platform}, is not supported yet.`);
    }
    await exec(runCommand, undefined, { silent });
  },

  getLinuxCommand(image, parameters): string {
    const {
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
      gitPrivateToken,
      githubToken,
      runnerTemporaryPath,
      chownFilesTo,
      unityLicensingServer,
    } = parameters;

    const githubHome = path.join(runnerTemporaryPath, '_github_home');
    if (!existsSync(githubHome)) mkdirSync(githubHome);
    const githubWorkflow = path.join(runnerTemporaryPath, '_github_workflow');
    if (!existsSync(githubWorkflow)) mkdirSync(githubWorkflow);
    const testPlatforms = (
      testMode === 'all' ? ['playmode', 'editmode', 'COMBINE_RESULTS'] : [testMode]
    ).join(';');

    return `docker run \
                --workdir /github/workspace \
                --rm \
                --env UNITY_LICENSE \
                --env UNITY_LICENSE_FILE \
                --env UNITY_EMAIL \
                --env UNITY_PASSWORD \
                --env UNITY_SERIAL \
                --env UNITY_LICENSING_SERVER="${unityLicensingServer}" \
                --env UNITY_VERSION="${editorVersion}" \
                --env PROJECT_PATH="${projectPath}" \
                --env CUSTOM_PARAMETERS="${customParameters}" \
                --env TEST_PLATFORMS="${testPlatforms}" \
                --env COVERAGE_OPTIONS="${coverageOptions}" \
                --env COVERAGE_RESULTS_PATH="CodeCoverage" \
                --env ARTIFACTS_PATH="${artifactsPath}" \
                --env GITHUB_REF \
                --env GITHUB_SHA \
                --env GITHUB_REPOSITORY \
                --env GITHUB_ACTOR \
                --env GITHUB_WORKFLOW \
                --env GITHUB_HEAD_REF \
                --env GITHUB_BASE_REF \
                --env GITHUB_EVENT_NAME \
                --env GITHUB_WORKSPACE="/github/workspace" \
                --env GITHUB_ACTION \
                --env GITHUB_EVENT_PATH \
                --env RUNNER_OS \
                --env RUNNER_TOOL_CACHE \
                --env RUNNER_TEMP \
                --env RUNNER_WORKSPACE \
                --env GIT_PRIVATE_TOKEN="${gitPrivateToken}" \
                --env CHOWN_FILES_TO="${chownFilesTo}" \
                ${sshAgent ? '--env SSH_AUTH_SOCK=/ssh-agent' : ''} \
                --volume "${githubHome}:/root:z" \
                --volume "${githubWorkflow}:/github/workflow:z" \
                --volume "${workspace}:/github/workspace:z" \
                --volume "${actionFolder}/steps:/steps:z" \
                --volume "${actionFolder}/entrypoint.sh:/entrypoint.sh:z" \
                --volume "${actionFolder}/unity-config:/usr/share/unity3d/config/:z" \
                ${sshAgent ? `--volume ${sshAgent}:/ssh-agent` : ''} \
                ${
                  sshAgent ? `--volume /home/runner/.ssh/known_hosts:/root/.ssh/known_hosts:ro` : ''
                } \
                ${useHostNetwork ? '--net=host' : ''} \
                ${githubToken ? '--env USE_EXIT_CODE=false' : '--env USE_EXIT_CODE=true'} \
                ${image} \
                /bin/bash -c /entrypoint.sh`;
  },

  getWindowsCommand(image, parameters): string {
    const {
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
      gitPrivateToken,
      githubToken,
      runnerTemporaryPath,
      chownFilesTo,
      unityLicensingServer,
    } = parameters;

    const githubHome = path.join(runnerTemporaryPath, '_github_home');
    if (!existsSync(githubHome)) mkdirSync(githubHome);
    const githubWorkflow = path.join(runnerTemporaryPath, '_github_workflow');
    if (!existsSync(githubWorkflow)) mkdirSync(githubWorkflow);
    const testPlatforms = (
      testMode === 'all' ? ['playmode', 'editmode', 'COMBINE_RESULTS'] : [testMode]
    ).join(';');

    return `docker run \
                --workdir /github/workspace \
                --rm \
                --env UNITY_LICENSE \
                --env UNITY_LICENSE_FILE \
                --env UNITY_EMAIL \
                --env UNITY_PASSWORD \
                --env UNITY_SERIAL \
                --env UNITY_LICENSING_SERVER="${unityLicensingServer}" \
                --env UNITY_VERSION="${editorVersion}" \
                --env PROJECT_PATH="${projectPath}" \
                --env CUSTOM_PARAMETERS="${customParameters}" \
                --env TEST_PLATFORMS="${testPlatforms}" \
                --env COVERAGE_OPTIONS="${coverageOptions}" \
                --env COVERAGE_RESULTS_PATH="CodeCoverage" \
                --env ARTIFACTS_PATH="${artifactsPath}" \
                --env GITHUB_REF \
                --env GITHUB_SHA \
                --env GITHUB_REPOSITORY \
                --env GITHUB_ACTOR \
                --env GITHUB_WORKFLOW \
                --env GITHUB_HEAD_REF \
                --env GITHUB_BASE_REF \
                --env GITHUB_EVENT_NAME \
                --env GITHUB_WORKSPACE="/github/workspace" \
                --env GITHUB_ACTION \
                --env GITHUB_EVENT_PATH \
                --env RUNNER_OS \
                --env RUNNER_TOOL_CACHE \
                --env RUNNER_TEMP \
                --env RUNNER_WORKSPACE \
                --env GIT_PRIVATE_TOKEN="${gitPrivateToken}" \
                --env CHOWN_FILES_TO="${chownFilesTo}" \
                ${sshAgent ? '--env SSH_AUTH_SOCK=c:/ssh-agent' : ''} \
                --volume "${githubHome}":"c:/root" \
                --volume "${githubWorkflow}":"c:/github/workflow" \
                --volume "${workspace}":"c:/github/workspace" \
                --volume "${actionFolder}/steps":"c:/steps" \
                --volume "${actionFolder}":"c:/dist" \
                ${sshAgent ? `--volume ${sshAgent}:c:/ssh-agent` : ''} \
                ${
                  sshAgent
                    ? `--volume c:/Users/Administrator/.ssh/known_hosts:c:/root/.ssh/known_hosts`
                    : ''
                } \
                ${useHostNetwork ? '--net=host' : ''} \
                ${githubToken ? '--env USE_EXIT_CODE=false' : '--env USE_EXIT_CODE=true'} \
                ${image} \
                powershell c:/dist/entrypoint.ps1`;
  },
};

export default Docker;
