import Action from './action';
import Docker from './docker';
import ImageTag from './image-tag';

describe('Docker', () => {
  it('builds', async () => {
    const path = Action.actionFolder;
    const dockerfile = `${path}/Dockerfile`;
    const image = new ImageTag({
      repository: '',
      name: 'alpine',
      version: '3',
    });

    const baseImage = {
      toString: () => image.toString().slice(0, image.toString().lastIndexOf('-base-0')),
      version: image.version,
    };

    const tag = await Docker.build({ path, dockerfile, baseImage }, true);

    expect(tag).toBeInstanceOf(ImageTag);
    expect(tag.toString()).toStrictEqual('unity-action:3-base-0');
  }, 240000);
});
