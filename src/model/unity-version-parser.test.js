import UnityVersionParser from './unity-version-parser';

describe('UnityVersionParser', () => {
  describe('parse', () => {
    it('throws for empty string', () => {
      expect(() => UnityVersionParser.parse('')).toThrow(Error);
    });

    it('parses from ProjectVersion.txt', () => {
      const projectVersionContents = `m_EditorVersion: 2019.2.11f1
      m_EditorVersionWithRevision: 2019.2.11f1 (5f859a4cfee5)`;
      expect(UnityVersionParser.parse(projectVersionContents)).toBe('2019.2.11f1');
    });
  });

  describe('read', () => {
    it('throws for invalid path', () => {
      expect(() => UnityVersionParser.read('')).toThrow(Error);
    });

    it('reads from unity-project-with-correct-tests', () => {
      expect(UnityVersionParser.read('./unity-project-with-correct-tests')).toBe('2019.2.11f1');
    });
  });
});
