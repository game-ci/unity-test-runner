import Action from './action';
import fs from 'fs';
import path from 'path';

describe('Action', () => {
  describe('compatibility check', () => {
    it('throws for anything other than linux', () => {
      if (process.platform !== 'linux') {
        expect(() => Action.checkCompatibility()).toThrow();
      } else {
        expect(() => Action.checkCompatibility()).not.toThrow();
      }
    });
  });

  it('returns the root folder of the action', () => {
    const { rootFolder, canonicalName } = Action;

    expect(path.basename(rootFolder)).toStrictEqual(canonicalName);
    expect(fs.existsSync(rootFolder)).toStrictEqual(true);
  });

  it('returns the action folder', () => {
    const { actionFolder } = Action;

    expect(path.basename(actionFolder)).toStrictEqual('dist');
    expect(fs.existsSync(actionFolder)).toStrictEqual(true);
  });
});
