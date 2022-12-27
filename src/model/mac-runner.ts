import { existsSync, mkdirSync } from 'fs';
import LicensingServerSetup from './licensing-server-setup';
import { exec } from '@actions/exec';
import path from 'path';

const MacRunner = {
  async run(parameters, silent = false) {
    if (parameters.unityLicensingServer !== '') {
      LicensingServerSetup.Setup(parameters.unityLicensingServer, parameters.actionFolder);
    }

    const runCommand = this.getMacCommand(parameters);
    await exec(runCommand, undefined, { silent });
  },

  getMacCommand(parameters): string {
    const {
      actionFolder,
      editorVersion,
      workspace,
      projectPath,
      customParameters,
      testMode,
      coverageOptions,
      artifactsPath,
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

    return `cd "${workspace}"
                ln -s /root "${githubHome}"
                ln -s /github/workflow "${githubWorkflow}"
                ln -s /github/workspace "${workspace}"
                ln -s /steps "${actionFolder}/steps"
                ln -s /entrypoint.sh "${actionFolder}/entrypoint.sh"
                ln -s /usr/share/unity3d/config "${actionFolder}/unity-config"
                ${sshAgent ? `ln -s /ssh-agent ${sshAgent}` : ''}
                ${sshAgent ? `ln -s /root/.ssh/known_hosts /home/runner/.ssh/known_hosts` : ''}
                env \
                UNITY_LICENSE= \
                UNITY_LICENSE_FILE= \
                UNITY_EMAIL= \
                UNITY_PASSWORD= \
                UNITY_SERIAL= \
                UNITY_LICENSING_SERVER="${unityLicensingServer}" \
                UNITY_VERSION="${editorVersion}" \
                PROJECT_PATH="${projectPath}" \
                CUSTOM_PARAMETERS="${customParameters}" \
                TEST_PLATFORMS="${testPlatforms}" \
                COVERAGE_OPTIONS="${coverageOptions}" \
                COVERAGE_RESULTS_PATH="CodeCoverage" \
                ARTIFACTS_PATH="${artifactsPath}" \
                GITHUB_REF= \
                GITHUB_SHA= \
                GITHUB_REPOSITORY= \
                GITHUB_ACTOR= \
                GITHUB_WORKFLOW= \
                GITHUB_HEAD_REF= \
                GITHUB_BASE_REF= \
                GITHUB_EVENT_NAME= \
                GITHUB_WORKSPACE="/github/workspace" \
                GITHUB_ACTION= \
                GITHUB_EVENT_PATH= \
                RUNNER_OS= \
                RUNNER_TOOL_CACHE= \
                RUNNER_TEMP= \
                RUNNER_WORKSPACE= \
                GIT_PRIVATE_TOKEN="${gitPrivateToken}" \
                CHOWN_FILES_TO="${chownFilesTo}" \
                ${sshAgent ? `SSH_AUTH_SOCK=/ssh-agent` : ''} \
                USE_EXIT_CODE=${githubToken ? 'false' : 'true'} \
                /bin/bash -c /entrypoint.sh`;
  },
};

export default MacRunner;
