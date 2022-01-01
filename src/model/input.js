import { getInput } from '@actions/core';
import { includes } from 'lodash-es';
import UnityVersionParser from './unity-version-parser';

class Input {
  static get testModes() {
    return ['all', 'playmode', 'editmode'];
  }

  static isValidFolderName(folderName) {
    const validFolderName = new RegExp(/^(\.|\.\/)?(\.?[\w~]+([ _-]?[\w~]+)*\/?)*$/);

    return validFolderName.test(folderName);
  }

  static getFromUser() {
    // Input variables specified in workflow using "with" prop.
    const rawUnityVersion = getInput('unityVersion') || 'auto';
    const customImage = getInput('customImage') || '';
    const rawProjectPath = getInput('projectPath') || '.';
    const customParameters = getInput('customParameters') || '';
    const testMode = (getInput('testMode') || 'all').toLowerCase();
    const rawArtifactsPath = getInput('artifactsPath') || 'artifacts';
    const rawUseHostNetwork = getInput('useHostNetwork') || 'false';
    const sshAgent = getInput('sshAgent') || '';
    const gitPrivateToken = getInput('gitPrivateToken') || '';
    const githubToken = getInput('githubToken') || '';
    const checkName = getInput('checkName') || 'Test Results';

    // Validate input
    if (!includes(this.testModes, testMode)) {
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
    const unityVersion =
      rawUnityVersion === 'auto' ? UnityVersionParser.read(projectPath) : rawUnityVersion;

    // Return sanitised input
    return {
      unityVersion,
      customImage,
      projectPath,
      customParameters,
      testMode,
      artifactsPath,
      useHostNetwork,
      sshAgent,
      gitPrivateToken,
      githubToken,
      checkName,
    };
  }
}

export default Input;
