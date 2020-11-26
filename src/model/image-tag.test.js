import ImageTag from './image-tag';

describe('UnityImageVersion', () => {
  describe('constructor', () => {
    const some = {
      name: 'someName',
      version: '2020.0.00f0',
    };

    it('can be called', () => {
      expect(() => new ImageTag(some)).not.toThrow();
    });

    it('accepts parameters and sets the right properties', () => {
      const image = new ImageTag(some);

      expect(image.repository).toStrictEqual('');
      expect(image.name).toStrictEqual(some.name);
      expect(image.version).toStrictEqual(some.version);
    });

    test.each(['2000.0.0f0', '2011.1.11f1'])('accepts %p version format', version => {
      expect(() => new ImageTag({ version })).not.toThrow();
    });

    test.each(['some version', '', 1, null])('throws for incorrect versions %p', version => {
      expect(() => new ImageTag({ version })).toThrow();
    });
  });

  describe('toString', () => {
    it('returns the correct version', () => {
      const image = ImageTag.createForBase({ version: '2099.1.1111' });

      expect(image.toString()).toStrictEqual(`unityci/editor:2099.1.1111-base-0`);
    });

    it('returns customImage if given', () => {
      const image = ImageTag.createForBase({
        version: '2099.1.1111',
        customImage: 'unityci/editor:2099.1.1111-base-0',
      });

      expect(image.toString()).toStrictEqual(image.customImage);
    });
  });
});
