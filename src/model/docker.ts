import { existsSync, mkdirSync } from 'fs';
import { exec } from '@actions/exec';
import path from 'path';

const Docker = {
  async run(image, parameters, silent = false) {
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
    } = parameters;

    const githubHome = path.join(runnerTemporaryPath, '_github_home');
    if (!existsSync(githubHome)) mkdirSync(githubHome);
    const githubWorkflow = path.join(runnerTemporaryPath, '_github_workflow');
    if (!existsSync(githubWorkflow)) mkdirSync(githubWorkflow);
    const testPlatforms = (
      testMode === 'all' ? ['playmode', 'editmode', 'COMBINE_RESULTS'] : [testMode]
    ).join(';');

    const dockerPaths = new Map([
      [
        'linux',
        new Map([
          ['shellCommand', '/bin/bash /dist/entrypoint.sh'],
          ['sshAgent', '/ssh-agent'],
          ['githubHome', '/root'],
          ['githubWorkflow', '/github/workflow'],
          ['githubWorkspace', '/github/workspace'],
          ['stepsPathParent', `${actionFolder}/steps`],
          ['stepsPathContainer', '/steps'],
          ['entrypointPathParent', `${actionFolder}/`],
          ['entrypointPathContainer', '/dist'],
          ['knownHostsParent', ' /home/runner/.ssh/known_hosts'],
          ['knownHostsContainer', '/root/.ssh/known_hosts'],
        ]),
      ],
      [
        'win32',
        new Map([
          ['shellCommand', 'powershell C:\\dist\\entrypoint.ps1'],
          ['sshAgent', 'C:\\ssh-agent'],
          ['githubHome', 'C:\\root'],
          ['githubWorkflow', 'C:\\github\\workflow'],
          ['githubWorkspace', 'C:\\github\\workspace'],
          ['stepsPathParent', `${actionFolder}\\steps`],
          ['stepsPathContainer', 'C:\\steps'],
          ['entrypointPathParent', `${actionFolder}\\`],
          ['entrypointPathContainer', 'C:\\dist'],
          ['knownHostsParent', 'C:\\Users\\Administrator\\.ssh\\known_hosts'],
          ['knownHostsContainer', 'C:\\root\\.ssh\\known_hosts'],
        ]),
      ],
    ]);
    const currentDockerPath = dockerPaths.get(process.platform);
    const bindMountZ = process.platform === 'linux' ? ':z' : '';
    const bindMountRO = process.platform === 'linux' ? ':ro' : '';

    const command = `docker run \
        --workdir /github/workspace \
        --rm \
        --env UNITY_LICENSE \
        --env UNITY_LICENSE_FILE \
        --env UNITY_EMAIL \
        --env UNITY_PASSWORD \
        --env UNITY_SERIAL \
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
        --env GITHUB_WORKSPACE="${currentDockerPath?.get('githubWorkspace')}" \
        --env GITHUB_ACTION \
        --env GITHUB_EVENT_PATH \
        --env RUNNER_OS \
        --env RUNNER_TOOL_CACHE \
        --env RUNNER_TEMP \
        --env RUNNER_WORKSPACE \
        --env GIT_PRIVATE_TOKEN="${gitPrivateToken}" \
        ${sshAgent ? `--env SSH_AUTH_SOCK=${currentDockerPath?.get('sshAgent')}` : ''} \
        --volume "${githubHome}:${currentDockerPath?.get('githubHome')}${bindMountZ}" \
        --volume "${githubWorkflow}:${currentDockerPath?.get('githubWorkflow')}${bindMountZ}" \
        --volume "${workspace}:${currentDockerPath?.get('githubWorkspace')}${bindMountZ}" \
        --volume "${currentDockerPath?.get('stepsPathParent')}:${currentDockerPath?.get(
      'stepsPathContainer',
    )}${bindMountZ}" \
        --volume "${currentDockerPath?.get('entrypointPathParent')}:${currentDockerPath?.get(
      'entrypointPathContainer',
    )}${bindMountZ}" \
        ${sshAgent ? `--volume ${sshAgent}:${currentDockerPath?.get('sshAgent')}` : ''} \
        ${
          sshAgent
            ? `--volume ${currentDockerPath?.get('knownHostParent')}${currentDockerPath?.get(
                'knownHostContainer',
              )}${bindMountRO}`
            : ''
        } \
        ${useHostNetwork ? '--net=host' : ''} \
        ${githubToken ? '--env USE_EXIT_CODE=false' : '--env USE_EXIT_CODE=true'} \
        ${image} \
        ${currentDockerPath?.get('shellCommand')}`;

    await exec(command, undefined, { silent });
  },
};

export default Docker;
