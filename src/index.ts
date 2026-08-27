// Thin wrapper: this action installs and shells out to the game-ci CLI
// (game-ci/cli's `test --docker` command) as a subprocess for the actual
// Docker/test execution, so the exact same code path this runs in CI also
// runs when a developer invokes the CLI directly on their own machine. See
// game-ci/roadmap#11 (workstream 2), and the matching rewrites already
// shipped for game-ci/unity-activate and game-ci/unity-builder.
//
// GitHub Checks reporting (githubToken/checkName) isn't something
// `game-ci test` does itself yet (see game-ci/cli#71's follow-up), so this
// wrapper still imports ResultsCheck from @game-ci/unity-engine-core - the
// same already-extracted, already-tested module the previous library-import
// approach used - to post results after the CLI subprocess exits. Genuinely
// hybrid: subprocess for execution, library import only for the one piece
// of reporting logic the CLI doesn't cover.
//
// Unity credentials (UNITY_EMAIL, UNITY_PASSWORD, UNITY_SERIAL,
// UNITY_LICENSE) are read by the CLI itself from its own process
// environment - never passed as CLI arguments, since argv can leak through
// process listings and command-logging.
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { testCliArgs } from './test-args';
import { downloadCli } from './download-cli';
import { ResultsCheck } from '@game-ci/unity-engine-core/dist/unity-test-runner/model';

export async function run() {
  try {
    const cliVersion = core.getInput('cliVersion') || 'latest';
    const cliPath = await downloadCli(cliVersion);

    const args = testCliArgs({ getInput: (name) => core.getInput(name) });

    const artifactsPath = core.getInput('artifactsPath') || 'artifacts';
    const githubToken = core.getInput('githubToken') || '';
    const checkName = core.getInput('checkName') || 'Test Results';

    let exitCode: number;
    try {
      // CodeQL flags this line (js/command-line-injection) since args
      // ultimately derives from Action inputs. Verified false positive:
      // args is an array of discrete argv entries, not a concatenated
      // shell string, and @actions/exec's toolrunner.js passes it
      // straight to child_process.spawn(fileName, args, options) - never
      // a shell string, never shell-parsed. This comment does not
      // suppress the alert (no inline-suppression mechanism exists in
      // GitHub Code Scanning's default setup); dismiss via the Security
      // tab/API instead.
      exitCode = await exec.exec(cliPath, args, { ignoreReturnCode: true });
    } finally {
      core.setOutput('artifactsPath', artifactsPath);
      core.setOutput('coveragePath', 'CodeCoverage');
    }

    // Unlike the old library-import flow, `game-ci test --docker`'s exit
    // code always reflects real test pass/fail (2 = some tests failed) -
    // it doesn't have a GH-token-gated "always exit 0, let the caller
    // inspect the XML" mode, since that's a GitHub Actions-specific
    // accommodation the CLI itself has no reason to know about. So: with a
    // githubToken, defer entirely to ResultsCheck's own verdict (parsed
    // from the XML, more precise, and - crucially - still posts the
    // detailed check on failure, which is when it matters most) rather
    // than bailing out on the raw exit code first. Without a token, the
    // exit code is the only signal available.
    // Exit code 0 = all passed, 2 = some tests failed but real results exist
    // either way (see test.sh) - both are legitimate cases to inspect the
    // XML for. Anything else (1, 3, ...) means the run itself broke before
    // producing trustworthy results (docker/licensing/infra failure) - fail
    // immediately rather than letting ResultsCheck parse missing/partial
    // XML and report a misleading verdict.
    if ((exitCode === 0 || exitCode === 2) && githubToken) {
      const failedTestCount = await ResultsCheck.createCheck(artifactsPath, githubToken, checkName);
      if (failedTestCount >= 1) {
        core.setFailed(`Test(s) Failed! Check '${checkName}' for details.`);
      }
    } else if (exitCode !== 0) {
      core.setFailed(`Test run failed with exit code ${exitCode}`);
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

if (process.env.NODE_ENV !== 'test') {
  run();
}
