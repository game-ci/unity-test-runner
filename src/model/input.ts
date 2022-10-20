import UnityVersionParser from './unity-version-parser';
import { getInput } from '@actions/core';

const Input = {
  get testModes() {
    return ['all', 'playmode', 'editmode'];
  },

  isValidFolderName(folderName) {
    const validFolderName = new RegExp(/^(\.|\.\/)?(\.?[\w~]+([ _-]?[\w~]+)*\/?)*$/);

    return validFolderName.test(folderName);
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
    const gitPrivateToken = getInput('gitPrivateToken') || '';
    const githubToken = getInput('githubToken') || '';
    const checkName = getInput('checkName') || 'Test Results';
    const chownFilesTo = getInput('chownFilesTo') || '';

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

    if (rawUseHostNetwork !== 'true' && rawUseHostNetwork !== 'false') {
      throw new Error(`Invalid useHostNetwork "${rawUseHostNetwork}"`);
    }

    // Sanitise input
    const projectPath = rawProjectPath.replace(/\/$/, '');
    const artifactsPath = rawArtifactsPath.replace(/\/$/, '');
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
      gitPrivateToken,
      githubToken,
      checkName,
      chownFilesTo,
      unityLicensingServer,
    };
  },
};

export default Input;
