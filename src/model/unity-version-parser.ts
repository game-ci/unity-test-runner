import fs from 'fs';
import path from 'path';

const UnityVersionParser = {
  parse(projectVersionTxt) {
    const versionRegex = /m_EditorVersion: (\d+\.\d+\.\d+[A-Za-z]?\d+)/;
    const matches = projectVersionTxt.match(versionRegex);

    if (!matches || matches.length < 2) {
      throw new Error(`Failed to extract version from "${projectVersionTxt}".`);
    }

    return matches[1];
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
