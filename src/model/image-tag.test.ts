import ImageTag from './image-tag';

describe('ImageTag', () => {
  const some = {
    editorVersion: '2099.9.f9f9',
    targetPlatform: 'Test',
    builderPlatform: '',
    containerRegistryRepository: 'unityci/editor',
    containerRegistryImageVersion: '3',
  };

  const defaults = {
    image: 'unityci/editor',
  };

  describe('constructor', () => {
    it('can be called', () => {
      const { targetPlatform } = some;
      expect(() => new ImageTag({ platform: targetPlatform })).not.toThrow();
    });

    it('accepts parameters and sets the right properties', () => {
      const image = new ImageTag(some);

      expect(image.repository).toStrictEqual('unityci/editor');
      expect(image.editorVersion).toStrictEqual(some.editorVersion);
      expect(image.targetPlatform).toStrictEqual(some.targetPlatform);
      expect(image.targetPlatformSuffix).toStrictEqual(some.builderPlatform);
    });

    test.each(['2000.0.0f0', '2011.1.11f1'])('accepts %p version format', editorVersion => {
      expect(
        () => new ImageTag({ editorVersion, targetPlatform: some.targetPlatform }),
      ).not.toThrow();
    });

    test.each(['some version', '', 1])('throws for incorrect versions %p', editorVersion => {
      const { targetPlatform } = some;
      expect(() => new ImageTag({ editorVersion, targetPlatform })).toThrow();
    });
  });

  describe('toString', () => {
    it('returns the correct version', () => {
      const image = new ImageTag({
        editorVersion: '2099.1.1111',
        targetPlatform: some.targetPlatform,
        containerRegistryRepository: 'unityci/editor',
        containerRegistryImageVersion: '3',
      });

      switch (process.platform) {
        case 'win32':
          expect(image.toString()).toStrictEqual(`${defaults.image}:windows-2099.1.1111-3`);
          break;
        case 'linux':
          expect(image.toString()).toStrictEqual(`${defaults.image}:ubuntu-2099.1.1111-3`);
          break;
      }
    });
    it('returns customImage if given', () => {
      const image = new ImageTag({
        editorVersion: '2099.1.1111',
        targetPlatform: some.targetPlatform,
        customImage: `${defaults.image}:2099.1.1111@347598437689743986`,
        containerRegistryRepository: 'unityci/editor',
        containerRegistryImageVersion: '3',
      });

      expect(image.toString()).toStrictEqual(image.customImage);
    });

    it('returns the specific build platform', () => {
      const image = new ImageTag({
        editorVersion: '2022.3.7f1',
        targetPlatform: 'WebGL',
        containerRegistryRepository: 'unityci/editor',
        containerRegistryImageVersion: '3',
      });

      switch (process.platform) {
        case 'win32':
          expect(image.toString()).toStrictEqual(`${defaults.image}:windows-2022.3.7f1-webgl-3`);
          break;
        case 'linux':
          expect(image.toString()).toStrictEqual(`${defaults.image}:ubuntu-2022.3.7f1-webgl-3`);
          break;
      }
    });

    it('returns no specific build platform for generic targetPlatforms', () => {
      const image = new ImageTag({
        editorVersion: '2019.2.11f1',
        targetPlatform: 'NoTarget',
        containerRegistryRepository: 'unityci/editor',
        containerRegistryImageVersion: '3',
      });

      switch (process.platform) {
        case 'win32':
          expect(image.toString()).toStrictEqual(`${defaults.image}:windows-2019.2.11f1-3`);
          break;
        case 'linux':
          expect(image.toString()).toStrictEqual(`${defaults.image}:ubuntu-2019.2.11f1-3`);
          break;
      }
    });
  });
});
