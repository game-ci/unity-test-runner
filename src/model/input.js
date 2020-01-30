import { getInput } from '@actions/core';
import { includes } from 'lodash-es';

class Input {
  static get testModes() {
    return ['all', 'playmode', 'editmode'];
  }

  static isValidFolderName(folderName) {
    const validFolderName = new RegExp(/^(\.|\.\/)?(\.?\w+\/?)*$/);

    return validFolderName.test(folderName);
  }

  static getFromUser() {
    // Input variables specified in workflow using "with" prop.
    const unityVersion = getInput('unityVersion') || '2019.2.11f1';
    const testMode = getInput('testMode') || 'all';
    const rawProjectPath = getInput('projectPath') || '.';
    const rawArtifactsPath = getInput('artifactsPath') || 'artifacts';
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

    // Sanitise input
    const projectPath = rawProjectPath.replace(/\/$/, '');
    const artifactsPath = rawArtifactsPath.replace(/\/$/, '');

    // Return sanitised input
    return {
      unityVersion,
      projectPath,
      testMode,
      artifactsPath,
      customParameters,
    };
  }
}

export default Input;
