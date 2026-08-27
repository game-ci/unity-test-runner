import * as fs from 'node:fs';

/**
 * Translates unity-test-runner's action inputs into `game-ci test --docker`
 * CLI flags. See unity-builder's build-args.ts for the sibling
 * implementation this is modeled on.
 *
 * Deliberate omissions:
 *  - unityLicense/unitySerial/unityEmail/unityPassword/unityLicensingServer:
 *    read by the CLI from its own process environment (inherited from this
 *    action's child_process spawn), never passed as args - avoids leaking
 *    secrets through process listings/command-echo logging. The CLI already
 *    derives a serial from a license file itself when needed
 *    (UnityLicense.getLicenseSerialFromUlf) - unity-test-runner's own
 *    now-redundant copy of that logic isn't reimplemented here. Passed as
 *    --unityLicensingServer only, which isn't a secret.
 *  - githubToken/checkName: used by this wrapper itself (see index.ts) to
 *    post a GitHub Check with the results after the CLI subprocess exits -
 *    not something `game-ci test` needs to know about.
 *  - dockerShmSize: not exposed as an input (never was), always passed at
 *    the value unity-test-runner#308 hardcoded in its own Docker.run call.
 */

const STRING_FLAGS: Array<[input: string, flag: string]> = [
  ['customImage', 'customImage'],
  ['customParameters', 'customParameters'],
  ['coverageOptions', 'coverageOptions'],
  ['artifactsPath', 'artifactsPath'],
  ['sshAgent', 'sshAgent'],
  ['sshPublicKeysDirectoryPath', 'sshPublicKeysDirectoryPath'],
  ['gitPrivateToken', 'gitPrivateToken'],
  ['scopedRegistryUrl', 'scopedRegistryUrl'],
  ['registryScopes', 'registryScopes'],
  ['chownFilesTo', 'chownFilesTo'],
  ['dockerCpuLimit', 'dockerCpuLimit'],
  ['dockerMemoryLimit', 'dockerMemoryLimit'],
  ['dockerIsolationMode', 'dockerIsolationMode'],
  ['unityLicensingServer', 'unityLicensingServer'],
  ['containerRegistryRepository', 'containerRegistryRepository'],
  ['containerRegistryImageVersion', 'containerRegistryImageVersion'],
];

const BOOLEAN_FLAGS: Array<[input: string, flag: string]> = [
  ['useHostNetwork', 'useHostNetwork'],
  ['runAsHostUser', 'runAsHostUser'],
];

const TEST_MODES = ['all', 'playmode', 'editmode', 'standalone'];

function isTruthy(value: string): boolean {
  return value.trim().toLowerCase() === 'true';
}

/** Ported from unity-test-runner's own Docker.getLinuxCommand - "all" fans out to a
 * combined-results run across both in-editor modes; anything else runs that one mode. */
function testPlatformsFor(testMode: string): string {
  return testMode === 'all' ? 'playmode;editmode;COMBINE_RESULTS' : testMode;
}

/** Ported from Input.getPackageNameFromPackageJson. */
function getPackageNameFromPackageJson(packagePath: string): string {
  const packageJsonPath = `${packagePath}/package.json`;
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Invalid projectPath - Cannot find package.json at ${packageJsonPath}`);
  }

  let packageJson: any;
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      throw new SyntaxError(`Unable to parse package.json contents as JSON - ${error.message}`);
    }
    throw new Error(`Unable to parse package.json contents as JSON - unknown error occurred`, {
      cause: error,
    });
  }

  const rawPackageName = packageJson.name;
  if (typeof rawPackageName !== 'string' || rawPackageName.length === 0) {
    throw new TypeError(
      `Unable to parse package name from package.json - expected a non-empty string`,
    );
  }

  return rawPackageName;
}

export interface TestArgsOptions {
  getInput(name: string): string;
}

export function testCliArgs({ getInput }: TestArgsOptions): string[] {
  // Always Unity - this wrapper has no other engine to detect. Passing
  // --engine=unity explicitly (not just --engineVersion below) matters
  // specifically for packageMode: game-ci/cli's engineDetection middleware
  // still calls its project-path detector to resolve `engine` whenever it's
  // unset, even when --engineVersion was already given explicitly - and a
  // bare UPM package directory has no ProjectSettings/ProjectVersion.txt for
  // that detector to find, so every package-mode run failed outright with
  // "Engine not detected from projectPath" regardless of --engineVersion.
  const args: string[] = ['test', '--docker', '--dockerShmSize=1025m', '--engine=unity'];

  const projectPath = getInput('projectPath').replace(/\/$/, '');
  if (projectPath) args.push(projectPath);

  const testMode = (getInput('testMode') || 'all').toLowerCase();
  if (!TEST_MODES.includes(testMode)) {
    throw new Error(`Invalid testMode "${testMode}"`);
  }
  args.push(`--testPlatforms=${testPlatformsFor(testMode)}`);

  // Mapped to --engineVersion, which game-ci/cli's engineDetection
  // middleware treats as an explicit override rather than clobbering it -
  // see project-options.ts and game-ci/cli#154 (added for unity-builder's
  // own matching build-args.ts mapping, this is the sibling wrapper's copy
  // of it). Without this, package-mode projects (no ProjectSettings/
  // ProjectVersion.txt to auto-detect from at all) failed outright with
  // "Engine not detected from projectPath", and a CI matrix testing one
  // fixture project against several Unity versions pulled the wrong editor
  // image for every non-default version.
  const unityVersion = getInput('unityVersion') || 'auto';
  if (unityVersion !== 'auto') {
    args.push(`--engineVersion=${unityVersion}`);
  }

  const packageMode = isTruthy(getInput('packageMode') || 'false');
  if (packageMode) {
    if (unityVersion === 'auto') {
      throw new Error(
        'Package Mode is enabled, but unityVersion is set to "auto". unityVersion must manually be set in Package Mode.',
      );
    }

    const scopedRegistryUrl = getInput('scopedRegistryUrl') || '';
    if (scopedRegistryUrl !== '' && !(getInput('registryScopes') || '')) {
      throw new Error(
        'Scoped registry is set, but registryScopes is not set. registryScopes is required when using scopedRegistryUrl.',
      );
    }

    const packageName = getPackageNameFromPackageJson(projectPath || '.');
    const testsFolder = `${projectPath || '.'}/Tests`;
    if (!fs.existsSync(testsFolder)) {
      throw new Error(`Invalid projectPath - Cannot find package tests folder at ${testsFolder}`);
    }

    args.push('--packageMode', `--packageName=${packageName}`);
  }

  const coverageEnabled = getInput('coverageEnabled');
  if (coverageEnabled && !isTruthy(coverageEnabled)) {
    args.push('--no-coverageEnabled');
  }

  for (const [input, flag] of STRING_FLAGS) {
    const value = getInput(input);
    if (value) args.push(`--${flag}=${value}`);
  }

  for (const [input, flag] of BOOLEAN_FLAGS) {
    const value = getInput(input);
    if (value && isTruthy(value)) args.push(`--${flag}`);
  }

  return args;
}
