import Action from './action';
import Docker from './docker';
import ImageTag from './image-tag';

describe('Docker', () => {
  it('builds', async () => {
    const path = Action.actionFolder;
    const dockerfile = `${path}/Dockerfile`;
    const baseImage = new ImageTag({
      repository: '',
      name: 'alpine',
      version: '3',
    });

    const tag = await Docker.build({ path, dockerfile, baseImage }, true);

    expect(tag).toBeInstanceOf(ImageTag);
    expect(tag.toString()).toStrictEqual('unity-action:3');
  }, 240000);
});
