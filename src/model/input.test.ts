import Input from './input';
import fs from 'fs';

jest.mock('./unity-version-parser');

const mockedFsExistsSync = jest.spyOn(fs, 'existsSync');
const mockedFsReadFileSync = jest.spyOn(fs, 'readFileSync');

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

  describe('getPackageNameFromPackageJson', () => {
    it('throws error if package.json cannot be found at the given project path', () => {
      mockedFsExistsSync.mockReturnValue(false);

      expect(() => Input.getPackageNameFromPackageJson('some/path')).toThrow(
        'Invalid projectPath - Cannot find package.json at some/path/package.json',
      );
    });

    it('throws error if package.json contents cannot be parsed', () => {
      mockedFsExistsSync.mockReturnValue(true);
      mockedFsReadFileSync.mockReturnValue(Buffer.from('DefinitelyNotJSON'));

      expect(() => Input.getPackageNameFromPackageJson('some/path')).toThrow(
        /Unable to parse package.json contents as JSON/,
      );
    });

    it('throws error if name field in package.json is not present', () => {
      mockedFsExistsSync.mockReturnValue(true);
      mockedFsReadFileSync.mockReturnValue(
        Buffer.from(JSON.stringify({ notName: 'some-package', alsoNotName: 'some-package' })),
      );

      expect(() => Input.getPackageNameFromPackageJson('some/path')).toThrow(
        'Unable to parse package name from package.json - package name should be string, but was undefined',
      );
    });

    it('throws error if name field in package.json is present but not a string', () => {
      mockedFsExistsSync.mockReturnValue(true);
      mockedFsReadFileSync.mockReturnValue(
        Buffer.from(JSON.stringify({ name: 3, notName: 'some-package' })),
      );

      expect(() => Input.getPackageNameFromPackageJson('some/path')).toThrow(
        'Unable to parse package name from package.json - package name should be string, but was number',
      );
    });

    it('throws error if name field in package.json is present but empty', () => {
      mockedFsExistsSync.mockReturnValue(true);
      mockedFsReadFileSync.mockReturnValue(Buffer.from(JSON.stringify({ name: '', notName: 3 })));

      expect(() => Input.getPackageNameFromPackageJson('some/path')).toThrow(
        'Package name from package.json is a string, but is empty',
      );
    });

    it('returns the name field in package.json if it is present as a non-empty string', () => {
      mockedFsExistsSync.mockReturnValue(true);
      mockedFsReadFileSync.mockReturnValue(
        Buffer.from(JSON.stringify({ name: 'some-package', notName: 'not-what-we-want' })),
      );

      expect(Input.getPackageNameFromPackageJson('some/path')).toStrictEqual('some-package');
    });
  });

  describe('verifyTestsFolderIsPresent', () => {
    it('throws error if tests folder is not present', () => {
      mockedFsExistsSync.mockReturnValue(false);

      expect(() => Input.verifyTestsFolderIsPresent('some/path')).toThrow(
        'Invalid projectPath - Cannot find package tests folder at some/path/Tests',
      );
    });

    it('does not throw if tests folder is present', () => {
      mockedFsExistsSync.mockReturnValue(true);

      expect(() => Input.verifyTestsFolderIsPresent('some/path')).not.toThrow();
    });
  });
});
