import path from 'path';
import fs from 'fs';
import Action from './action';

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
    const { rootFolder, name } = Action;

    expect(path.basename(rootFolder)).toStrictEqual(name);
    expect(fs.existsSync(rootFolder)).toStrictEqual(true);
  });

  it('returns the action folder', () => {
    const { actionFolder } = Action;

    expect(path.basename(actionFolder)).toStrictEqual('action');
    expect(fs.existsSync(actionFolder)).toStrictEqual(true);
  });
});
