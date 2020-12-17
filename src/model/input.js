import { getInput } from '@actions/core';
import { includes } from 'lodash-es';

class Input {
  static get testModes() {
    return ['all', 'playmode', 'editmode'];
  }

  static isValidFolderName(folderName) {
    const validFolderName = new RegExp(/^(\.|\.\/)?(\.?\w+([-_]?\w+)*\/?)*$/);

    return validFolderName.test(folderName);
  }

  static getFromUser() {
    // Input variables specified in workflow using "with" prop.
    const unityVersion = getInput('unityVersion') || '2019.2.11f1';
    const customImage = getInput('customImage') || '';
    const testMode = getInput('testMode') || 'all';
    const rawProjectPath = getInput('projectPath') || '.';
    const rawArtifactsPath = getInput('artifactsPath') || 'artifacts';
    const rawUseHostNetwork = getInput('useHostNetwork') || 'false';
    const customParameters = getInput('customParameters') || '';

    // Validate input
    if (!includes(this.testModes, testMode)) {
      throw new Error(`Invalid testMode ${testMode}`);
    }

    if (!this.isValidFolderName(rawArtifactsPath)) {
      throw new Error(`Invalid artifactsPath "${rawArtifactsPath}"`);
    }

    if (!this.isValidFolderName(rawProjectPath)) {
      throw new Error(`Invalid projectPath "${rawProjectPath}"`);
    }

    if (rawUseHostNetwork !== 'true' && rawUseHostNetwork !== 'false') {
      throw new Error(`Invalid useHostNetwork "${rawUseHostNetwork}"`);
    }

    // Sanitise input
    const projectPath = rawProjectPath.replace(/\/$/, '');
    const artifactsPath = rawArtifactsPath.replace(/\/$/, '');
    const useHostNetwork = rawUseHostNetwork === 'true';

    // Return sanitised input
    return {
      unityVersion,
      customImage,
      projectPath,
      testMode,
      artifactsPath,
      useHostNetwork,
      customParameters,
    };
  }
}

export default Input;
