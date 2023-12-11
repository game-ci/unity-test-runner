import ImageEnvironmentFactory from './image-environment-factory';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'fs';
import LicensingServerSetup from './licensing-server-setup';
import type { RunnerContext } from './action';
import { exec } from '@actions/exec';
import path from 'path';

/**
 * Build a path for a docker --cidfile parameter. Docker will store the the created container.
 * This path is stable for the whole execution of the action, so it can be executed with the same parameters
 * multiple times and get the same result.
 */
const containerIdFilePath = parameters => {
  const { runnerTemporaryPath, githubAction } = parameters;

  return path.join(runnerTemporaryPath, `container_${githubAction}`);
};

const Docker = {
  /**
   *  Remove a possible leftover container created by `Docker.run`.
   */
  async ensureContainerRemoval(parameters: RunnerContext) {
    const cidfile = containerIdFilePath(parameters);
    if (!existsSync(cidfile)) {
      return;
    }
    const container = readFileSync(cidfile, 'ascii').trim();
    await exec(`docker`, ['rm', '--force', '--volumes', container], { silent: true });
    rmSync(cidfile);
  },

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
      workspace,
      testMode,
      useHostNetwork,
      sshAgent,
      sshPublicKeysDirectoryPath,
      githubToken,
      runnerTemporaryPath,
      dockerCpuLimit,
      dockerMemoryLimit,
    } = parameters;

    const githubHome = path.join(runnerTemporaryPath, '_github_home');
    if (!existsSync(githubHome)) mkdirSync(githubHome);
    const githubWorkflow = path.join(runnerTemporaryPath, '_github_workflow');
    if (!existsSync(githubWorkflow)) mkdirSync(githubWorkflow);
    const cidfile = containerIdFilePath(parameters);
    const testPlatforms = (
      testMode === 'all' ? ['playmode', 'editmode', 'COMBINE_RESULTS'] : [testMode]
    ).join(';');

    return `docker run \
            --workdir /github/workspace \
            --cidfile "${cidfile}" \
            --rm \
            ${ImageEnvironmentFactory.getEnvVarString(parameters)} \
            --env GIT_CONFIG_EXTENSIONS \
            --env TEST_PLATFORMS="${testPlatforms}" \
            ${sshAgent ? '--env SSH_AUTH_SOCK=/ssh-agent' : ''} \
            --volume "${githubHome}:/root:z" \
            --volume "${githubWorkflow}:/github/workflow:z" \
            --volume "${workspace}:/github/workspace:z" \
            --volume "${actionFolder}/test-standalone-scripts:/UnityStandaloneScripts:z" \
            --volume "${actionFolder}/platforms/ubuntu/steps:/steps:z" \
            --volume "${actionFolder}/unity-config:/usr/share/unity3d/config/:z" \
            --volume "${actionFolder}/BlankProject":"/BlankProject:z" \
            --cpus=${dockerCpuLimit} \
            --memory=${dockerMemoryLimit} \
            ${sshAgent ? `--volume ${sshAgent}:/ssh-agent` : ''} \
            ${
              sshAgent && !sshPublicKeysDirectoryPath
                ? `--volume /home/runner/.ssh/known_hosts:/root/.ssh/known_hosts:ro`
                : ''
            } \
            ${
              sshPublicKeysDirectoryPath
                ? `--volume ${sshPublicKeysDirectoryPath}:/root/.ssh:ro`
                : ''
            } \
            ${useHostNetwork ? '--net=host' : ''} \
            ${githubToken ? '--env USE_EXIT_CODE=false' : '--env USE_EXIT_CODE=true'} \
            ${image} \
            /bin/bash -c /steps/entrypoint.sh`;
  },

  getWindowsCommand(image, parameters): string {
    const {
      actionFolder,
      workspace,
      testMode,
      useHostNetwork,
      sshAgent,
      githubToken,
      runnerTemporaryPath,
      dockerCpuLimit,
      dockerMemoryLimit,
      dockerIsolationMode,
    } = parameters;

    const githubHome = path.join(runnerTemporaryPath, '_github_home');
    if (!existsSync(githubHome)) mkdirSync(githubHome);
    const cidfile = containerIdFilePath(parameters);
    const githubWorkflow = path.join(runnerTemporaryPath, '_github_workflow');
    if (!existsSync(githubWorkflow)) mkdirSync(githubWorkflow);
    const testPlatforms = (
      testMode === 'all' ? ['playmode', 'editmode', 'COMBINE_RESULTS'] : [testMode]
    ).join(';');

    return `docker run \
                --workdir c:/github/workspace \
                --cidfile "${cidfile}" \
                --rm \
                ${ImageEnvironmentFactory.getEnvVarString(parameters)} \
                --env TEST_PLATFORMS="${testPlatforms}" \
                --env GITHUB_WORKSPACE="c:/github/workspace" \
                ${sshAgent ? '--env SSH_AUTH_SOCK=c:/ssh-agent' : ''} \
                --volume "${actionFolder}/test-standalone-scripts":"c:/UnityStandaloneScripts" \
                --volume "${githubHome}":"c:/root" \
                --volume "${githubWorkflow}":"c:/github/workflow" \
                --volume "${workspace}":"c:/github/workspace" \
                --volume "${actionFolder}/platforms/windows":"c:/steps" \
                --volume "${actionFolder}/BlankProject":"c:/BlankProject" \
                ${sshAgent ? `--volume ${sshAgent}:c:/ssh-agent` : ''} \
                ${
                  sshAgent
                    ? `--volume c:/Users/Administrator/.ssh/known_hosts:c:/root/.ssh/known_hosts`
                    : ''
                } \
                --cpus=${dockerCpuLimit} \
                --memory=${dockerMemoryLimit} \
                --isolation=${dockerIsolationMode} \
                ${useHostNetwork ? '--net=host' : ''} \
                ${githubToken ? '--env USE_EXIT_CODE=false' : '--env USE_EXIT_CODE=true'} \
                ${image} \
                powershell c:/steps/entrypoint.ps1`;
  },
};

export default Docker;
