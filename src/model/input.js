import { getInput } from '@actions/core';
import { includes } from 'lodash-es';

class Input {
  static get testModes() {
    return ['all', 'playmode', 'editmode'];
  }

  static getFromUser() {
    // Input variables specified in workflow using "with" prop.
    const unityVersion = getInput('unityVersion') || '2019.2.11f1';
    const testMode = getInput('testMode') || 'all';
    const rawProjectPath = getInput('testMode') || '.';
    const rawArtifactsPath = getInput('testMode') || 'artifacts';

    // Validate input
    if (!includes(this.testModes, testMode)) {
      throw new Error(`Invalid testMode ${testMode}`);
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
    };
  }
}

export default Input;
