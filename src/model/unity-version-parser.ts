import fs from 'fs';
import path from 'path';

const UnityVersionParser = {
  get versionPattern() {
    return /20\d{2}\.\d\.\w{3,4}|3/;
  },

  parse(projectVersionTxt) {
    const matches = projectVersionTxt.match(UnityVersionParser.versionPattern);
    if (!matches || matches.length === 0) {
      throw new Error(`Failed to parse version from "${projectVersionTxt}".`);
    }
    return matches[0];
  },

  read(projectPath) {
    const filePath = path.join(projectPath, 'ProjectSettings', 'ProjectVersion.txt');
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `Project settings file not found at "${filePath}". Have you correctly set the projectPath?`,
      );
    }
    return UnityVersionParser.parse(fs.readFileSync(filePath, 'utf8'));
  },
};

export default UnityVersionParser;
