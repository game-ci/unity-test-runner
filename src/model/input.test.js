import Input from './input';

describe('Input', () => {
  describe('getFromUser', () => {
    it('does not throw', () => {
      expect(() => Input.getFromUser()).not.toThrow();
    });

    it('returns an object', () => {
      expect(typeof Input.getFromUser()).toStrictEqual('object');
    });
  });

  describe('isValidFolderName', () => {
    test.each([
      '.',
      './',
      'folder',
      'trailing/',
      '.hidden',
      '.hidden/sub',
      '.hidden/trailing/',
      './.hidden-sub',
      'hyphen-folder',
      'under_score',
    ])('returns true for %s', folderName => {
      expect(Input.isValidFolderName(folderName)).toStrictEqual(true);
    });

    test.each(['..', '../'])('returns false for %s', folderName => {
      expect(Input.isValidFolderName(folderName)).toStrictEqual(false);
    });
  });
});
