import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { testCliArgs } from './test-args';

function inputsOf(values: Record<string, string>) {
  return { getInput: (name: string) => values[name] ?? '' };
}

describe('testCliArgs', () => {
  it('builds the minimal command with the docker flag, hardcoded shm size, and engine=unity', () => {
    expect(testCliArgs(inputsOf({}))).toStrictEqual([
      'test',
      '--docker',
      '--dockerShmSize=1025m',
      '--engine=unity',
      '--testPlatforms=playmode;editmode;COMBINE_RESULTS',
    ]);
  });

  it('puts projectPath as the positional argument right after the docker flags', () => {
    const args = testCliArgs(inputsOf({ projectPath: 'game' }));
    expect(args.slice(0, 5)).toStrictEqual([
      'test',
      '--docker',
      '--dockerShmSize=1025m',
      '--engine=unity',
      'game',
    ]);
  });

  it('always passes --engine=unity, even without packageMode - the project-path engine detector has no ProjectSettings to find in a bare package directory', () => {
    expect(testCliArgs(inputsOf({}))).toContain('--engine=unity');
  });

  it('rejects an invalid testMode', () => {
    expect(() => testCliArgs(inputsOf({ testMode: 'nonsense' }))).toThrow(/testMode/);
  });

  it.each([
    ['all', 'playmode;editmode;COMBINE_RESULTS'],
    ['playmode', 'playmode'],
    ['editmode', 'editmode'],
    ['standalone', 'standalone'],
  ])('maps testMode=%s to --testPlatforms=%s', (testMode, expected) => {
    const args = testCliArgs(inputsOf({ testMode }));
    expect(args).toContain(`--testPlatforms=${expected}`);
  });

  it('passes string inputs through as their mapped flag, glued with = to avoid value/flag ambiguity', () => {
    const args = testCliArgs(
      inputsOf({
        customImage: 'unityci/editor:2022.3.7f1-base-3',
        dockerCpuLimit: '4',
        artifactsPath: 'my-artifacts',
      }),
    );

    expect(args).toContain('--customImage=unityci/editor:2022.3.7f1-base-3');
    expect(args).toContain('--dockerCpuLimit=4');
    expect(args).toContain('--artifactsPath=my-artifacts');
  });

  it('keeps a value starting with "-" as one unambiguous token', () => {
    const args = testCliArgs(
      inputsOf({ customParameters: '-profile SomeProfile -someBoolean -someValue exampleValue' }),
    );

    expect(args).toContain(
      '--customParameters=-profile SomeProfile -someBoolean -someValue exampleValue',
    );
  });

  it('passes boolean inputs as bare flags only when truthy', () => {
    expect(testCliArgs(inputsOf({ useHostNetwork: 'true' }))).toContain('--useHostNetwork');
    expect(testCliArgs(inputsOf({ useHostNetwork: 'false' }))).not.toContain('--useHostNetwork');
    expect(testCliArgs(inputsOf({}))).not.toContain('--useHostNetwork');
  });

  it('omits --no-coverageEnabled when unset (matches cli default true)', () => {
    expect(testCliArgs(inputsOf({}))).not.toContain('--no-coverageEnabled');
  });

  it('passes --no-coverageEnabled when coverageEnabled=false', () => {
    expect(testCliArgs(inputsOf({ coverageEnabled: 'false' }))).toContain('--no-coverageEnabled');
  });

  it('does not pass --no-coverageEnabled when coverageEnabled=true', () => {
    expect(testCliArgs(inputsOf({ coverageEnabled: 'true' }))).not.toContain(
      '--no-coverageEnabled',
    );
  });

  describe('unityVersion', () => {
    it('maps to --engineVersion when set to something other than "auto"', () => {
      const args = testCliArgs(inputsOf({ unityVersion: '2022.3.7f1' }));
      expect(args).toContain('--engineVersion=2022.3.7f1');
    });

    it('omits --engineVersion when unset or "auto" (CLI auto-detects from ProjectVersion.txt)', () => {
      const hasEngineVersionFlag = (args: string[]) =>
        args.some((arg) => arg.startsWith('--engineVersion='));
      expect(hasEngineVersionFlag(testCliArgs(inputsOf({})))).toBe(false);
      expect(hasEngineVersionFlag(testCliArgs(inputsOf({ unityVersion: 'auto' })))).toBe(false);
    });
  });

  describe('packageMode', () => {
    let tempDir: string;

    beforeAll(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unity-test-runner-package-'));
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'com.example.mypackage' }),
      );
      fs.mkdirSync(path.join(tempDir, 'Tests'));
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('requires unityVersion to be set explicitly, not "auto"', () => {
      expect(() => testCliArgs(inputsOf({ packageMode: 'true', projectPath: tempDir }))).toThrow(
        /unityVersion/,
      );
    });

    it('requires registryScopes when scopedRegistryUrl is set', () => {
      expect(() =>
        testCliArgs(
          inputsOf({
            packageMode: 'true',
            projectPath: tempDir,
            unityVersion: '2022.3.7f1',
            scopedRegistryUrl: 'https://example.com/registry',
          }),
        ),
      ).toThrow(/registryScopes/);
    });

    it('requires a Tests folder to be present', () => {
      const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unity-test-runner-bare-'));
      fs.writeFileSync(
        path.join(bareDir, 'package.json'),
        JSON.stringify({ name: 'com.example.bare' }),
      );

      expect(() =>
        testCliArgs(
          inputsOf({ packageMode: 'true', projectPath: bareDir, unityVersion: '2022.3.7f1' }),
        ),
      ).toThrow(/tests folder/i);

      fs.rmSync(bareDir, { recursive: true, force: true });
    });

    it('derives packageName from package.json and passes --packageMode/--packageName', () => {
      const args = testCliArgs(
        inputsOf({ packageMode: 'true', projectPath: tempDir, unityVersion: '2022.3.7f1' }),
      );

      expect(args).toContain('--packageMode');
      expect(args).toContain('--packageName=com.example.mypackage');
    });
  });
});
