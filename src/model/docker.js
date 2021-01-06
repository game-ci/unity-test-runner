import { exec } from '@actions/exec';

class Docker {
  static async run(image, parameters, silent = false) {
    const {
      unityVersion,
      workspace,
      actionFolder,
      projectPath,
      testMode,
      artifactsPath,
      useHostNetwork,
      customParameters,
    } = parameters;

    const command = `docker run \
        --workdir /github/workspace \
        --rm \
        --env UNITY_LICENSE \
        --env UNITY_LICENSE_FILE \
        --env UNITY_EMAIL \
        --env UNITY_PASSWORD \
        --env UNITY_SERIAL \
        --env UNITY_VERSION="${unityVersion}" \
        --env PROJECT_PATH="${projectPath}" \
        --env TEST_MODE="${testMode}" \
        --env ARTIFACTS_PATH="${artifactsPath}" \
        --env CUSTOM_PARAMETERS="${customParameters}" \
        --env HOME=/github/home \
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
        --volume "/var/run/docker.sock":"/var/run/docker.sock" \
        --volume "/home/runner/work/_temp/_github_home":"/github/home" \
        --volume "/home/runner/work/_temp/_github_workflow":"/github/workflow" \
        --volume "${actionFolder}":"/github/action" \
        --volume "${workspace}":"/github/workspace" \
        --entrypoint="" \
        ${useHostNetwork ? '--net=host' : ''} \
        ${image} /bin/bash -c "chmod -R +x /github/action && /github/action/entrypoint.sh"`;

    await exec(command, null, { silent });
  }
}

export default Docker;
