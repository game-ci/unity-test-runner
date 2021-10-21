import Action from './action';
import Docker from './docker';
import ImageTag from './image-tag';

describe('Docker', () => {
  it('builds', async () => {
    const path = Action.actionFolder;
    const dockerfile = `${path}/Dockerfile`;
    const image = new ImageTag({
      repository: '',
      name: 'ubuntu',
      version: 'impish',
    });

    const baseImage = {
      toString: () => image.toString().slice(0, image.toString().lastIndexOf('-base-0')),
      version: image.version,
    };

    const tag = await Docker.build({ path, dockerfile, baseImage }, true);

    expect(tag).toBeInstanceOf(ImageTag);
    expect(tag.toString()).toStrictEqual('unity-action:impish-base-0');
  }, 240000);
});
