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
      enableCodeCoverage,
      coverageAssemblyFilters,
      coverageResultsPath,
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
        --env TEST_MODE="${testMode}" \
        --env ENABLE_CODE_COVERAGE="${enableCodeCoverage}" \
        --env COVERAGE_ASSEMBLY_FILTERS="${coverageAssemblyFilters}" \
        --env COVERAGE_RESULTS_PATH="${coverageResultsPath}" \
        --env ARTIFACTS_PATH="${artifactsPath}" \
        --env GITHUB_REF \
        --env GITHUB_SHA \
        --env GITHUB_REPOSITORY \
        --env GITHUB_ACTOR \
        --env GITHUB_WORKFLOW \
        --env GITHUB_HEAD_REF \
        --env GITHUB_BASE_REF \
        --env GITHUB_EVENT_NAME \
        --env GITHUB_WORKSPACE=/github/workspace \
        --env GITHUB_ACTION \
        --env GITHUB_EVENT_PATH \
        --env RUNNER_OS \
        --env RUNNER_TOOL_CACHE \
        --env RUNNER_TEMP \
        --env RUNNER_WORKSPACE \
        --env GIT_PRIVATE_TOKEN="${gitPrivateToken}" \
        ${sshAgent ? '--env SSH_AUTH_SOCK=/ssh-agent' : ''} \
        --volume "${githubHome}":"/root:z" \
        --volume "${githubWorkflow}":"/github/workflow:z" \
        --volume "${workspace}":"/github/workspace:z" \
        --volume "${actionFolder}/steps":"/steps:z" \
        --volume "${actionFolder}/entrypoint.sh":"/entrypoint.sh:z" \
        ${sshAgent ? `--volume ${sshAgent}:/ssh-agent` : ''} \
        ${sshAgent ? '--volume /home/runner/.ssh/known_hosts:/root/.ssh/known_hosts:ro' : ''} \
        ${useHostNetwork ? '--net=host' : ''} \
        ${githubToken ? '--env USE_EXIT_CODE=false' : '--env USE_EXIT_CODE=true'} \
        ${image} \
        /bin/bash /entrypoint.sh`;

    await exec(command, undefined, { silent });
  },
};

export default Docker;
