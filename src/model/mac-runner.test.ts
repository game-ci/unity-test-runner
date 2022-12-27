import Action from './action';
import MacRunner from './mac-runner';

describe('MacRunner', () => {
  it.skip('runs', async () => {
    const parameters = {
      workspace: Action.rootFolder,
      projectPath: `${Action.rootFolder}/test-project`,
      buildName: 'someBuildName',
      buildsPath: 'build',
      method: '',
    };
    await MacRunner.run(parameters);
  });
});
