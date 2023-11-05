import UnityVersionParser from './unity-version-parser';
import fs from 'fs';
import { getInput } from '@actions/core';
import os from 'os';

const Input = {
  get testModes() {
    return ['all', 'playmode', 'editmode', 'standalone'];
  },

  isValidFolderName(folderName) {
    const validFolderName = new RegExp(/^(\.|\.\/)?(\.?[\w~]+([ _-]?[\w~]+)*\/?)*$/);

    return validFolderName.test(folderName);
  },

  isValidGlobalFolderName(folderName) {
    const validFolderName = new RegExp(/^(\.|\.\/|\/)?(\.?[\w~]+([ _-]?[\w~]+)*\/?)*$/);

    return validFolderName.test(folderName);
  },

  /**
   * When in package mode, we need to scrape the package's name from its package.json file
   */
  getPackageNameFromPackageJson(packagePath) {
    const packageJsonPath = `${packagePath}/package.json`;
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`Invalid projectPath - Cannot find package.json at ${packageJsonPath}`);
    }

    let packageJson;

    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new SyntaxError(`Unable to parse package.json contents as JSON - ${error.message}`);
      }

      throw new Error(`Unable to parse package.json contents as JSON - unknown error ocurred`);
    }

    const rawPackageName = packageJson.name;

    if (typeof rawPackageName !== 'string') {
      throw new TypeError(
        `Unable to parse package name from package.json - package name should be string, but was ${typeof rawPackageName}`,
      );
    }

    if (rawPackageName.length === 0) {
      throw new Error(`Package name from package.json is a string, but is empty`);
    }

    return rawPackageName;
  },

  /**
   * When in package mode, we need to ensure that the Tests folder is present
   */
  verifyTestsFolderIsPresent(packagePath) {
    if (!fs.existsSync(`${packagePath}/Tests`)) {
      throw new Error(
        `Invalid projectPath - Cannot find package tests folder at ${packagePath}/Tests`,
      );
    }
  },

  getFromUser() {
    // Input variables specified in workflow using "with" prop.
    const unityVersion = getInput('unityVersion') || 'auto';
    const customImage = getInput('customImage') || '';
    const rawProjectPath = getInput('projectPath') || '.';
    const unityLicensingServer = getInput('unityLicensingServer') || '';
    const customParameters = getInput('customParameters') || '';
    const testMode = (getInput('testMode') || 'all').toLowerCase();
    const coverageOptions = getInput('coverageOptions') || '';
    const rawArtifactsPath = getInput('artifactsPath') || 'artifacts';
    const rawUseHostNetwork = getInput('useHostNetwork') || 'false';
    const sshAgent = getInput('sshAgent') || '';
    const rawSshPublicKeysDirectoryPath = getInput('sshPublicKeysDirectoryPath') || '';
    const gitPrivateToken = getInput('gitPrivateToken') || '';
    const githubToken = getInput('githubToken') || '';
    const checkName = getInput('checkName') || 'Test Results';
    const rawPackageMode = getInput('packageMode') || 'false';
    let packageName = '';
    const chownFilesTo = getInput('chownFilesTo') || '';
    const dockerCpuLimit = getInput('dockerCpuLimit') || os.cpus().length.toString();
    const bytesInMegabyte = 1024 * 1024;
    let memoryMultiplier;
    switch (os.platform()) {
      case 'linux':
        memoryMultiplier = 0.95;
        break;
      case 'win32':
        memoryMultiplier = 0.8;
        break;
      default:
        memoryMultiplier = 0.75;
        break;
    }
    const dockerMemoryLimit =
      getInput('dockerMemoryLimit') ||
      `${Math.floor((os.totalmem() / bytesInMegabyte) * memoryMultiplier)}m`;
    const dockerIsolationMode = getInput('dockerIsolationMode') || 'default';

    // Validate input
    if (!this.testModes.includes(testMode)) {
      throw new Error(`Invalid testMode ${testMode}`);
    }

    if (!this.isValidFolderName(rawProjectPath)) {
      throw new Error(`Invalid projectPath "${rawProjectPath}"`);
    }

    if (!this.isValidFolderName(rawArtifactsPath)) {
      throw new Error(`Invalid artifactsPath "${rawArtifactsPath}"`);
    }

    if (!this.isValidGlobalFolderName(rawSshPublicKeysDirectoryPath)) {
      throw new Error(`Invalid sshPublicKeysDirectoryPath "${rawSshPublicKeysDirectoryPath}"`);
    }

    if (rawUseHostNetwork !== 'true' && rawUseHostNetwork !== 'false') {
      throw new Error(`Invalid useHostNetwork "${rawUseHostNetwork}"`);
    }

    if (rawPackageMode !== 'true' && rawPackageMode !== 'false') {
      throw new Error(`Invalid packageMode "${rawPackageMode}"`);
    }

    if (rawSshPublicKeysDirectoryPath !== '' && sshAgent === '') {
      throw new Error(
        'sshPublicKeysDirectoryPath is set, but sshAgent is not set. sshPublicKeysDirectoryPath is useful only when using sshAgent.',
      );
    }

    // sanitize packageMode input and projectPath input since they are needed
    // for input validation
    const packageMode = rawPackageMode === 'true';
    const projectPath = rawProjectPath.replace(/\/$/, '');

    // if in package mode, attempt to get the package's name, and ensure tests are present
    if (packageMode) {
      if (unityVersion === 'auto') {
        throw new Error(
          'Package Mode is enabled, but unityVersion is set to "auto". unityVersion must manually be set in Package Mode.',
        );
      }

      packageName = this.getPackageNameFromPackageJson(projectPath);
      this.verifyTestsFolderIsPresent(projectPath);
    }

    // Sanitise other input
    const artifactsPath = rawArtifactsPath.replace(/\/$/, '');
    const sshPublicKeysDirectoryPath = rawSshPublicKeysDirectoryPath.replace(/\/$/, '');
    const useHostNetwork = rawUseHostNetwork === 'true';
    const editorVersion =
      unityVersion === 'auto' ? UnityVersionParser.read(projectPath) : unityVersion;

    // Return sanitised input
    return {
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
    };
  },
};

export default Input;
