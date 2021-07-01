import fs from 'fs';
import path from 'path';

class UnityVersionParser {
  static get versionPattern() {
    return /20\d{2}\.\d\.\w{3,4}|3/;
  }

  static parse(projectVersionTxt) {
    const matches = projectVersionTxt.match(UnityVersionParser.versionPattern);
    if (!matches || matches.length === 0) {
      throw new Error(`Failed to parse version from "${projectVersionTxt}".`);
    }
    return matches[0];
  }

  static read(projectPath) {
    const filePath = path.join(projectPath, 'ProjectSettings', 'ProjectVersion.txt');
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `Project settings file not found at "${filePath}". Have you correctly set the projectPath?`,
      );
    }
    return UnityVersionParser.parse(fs.readFileSync(filePath, 'utf8'));
  }
}

export default UnityVersionParser;
