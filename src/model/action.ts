import path from 'path';

export interface RunnerContext {
  runnerTemporaryPath: string;
  githubAction: string;
}

const Action = {
  get supportedPlatforms() {
    return ['linux', 'win32', 'darwin'];
  },

  get isRunningLocally() {
    return process.env.RUNNER_WORKSPACE === undefined;
  },

  get isRunningFromSource() {
    return path.basename(__dirname) === 'model';
  },

  get canonicalName() {
    return 'unity-test-runner';
  },

  get rootFolder() {
    if (Action.isRunningFromSource) {
      return path.dirname(path.dirname(path.dirname(__filename)));
    }

    return path.dirname(path.dirname(__filename));
  },

  get actionFolder() {
    return `${Action.rootFolder}/dist`;
  },

  get workspace() {
    return process.env.GITHUB_WORKSPACE;
  },

  runnerContext(): RunnerContext {
    const runnerTemporaryPath = process.env.RUNNER_TEMP ?? process.cwd();
    const githubAction = process.env.GITHUB_ACTION ?? process.pid.toString();

    return {
      runnerTemporaryPath,
      githubAction,
    };
  },

  checkCompatibility() {
    const currentPlatform = process.platform;
    if (!Action.supportedPlatforms.includes(currentPlatform)) {
      throw new Error(`Currently ${currentPlatform}-platform is not supported`);
    }
  },
};

export default Action;
