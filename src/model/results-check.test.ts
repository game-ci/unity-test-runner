import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll, test } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import ResultsCheck from './results-check';

describe('ResultsCheck', () => {
  describe('createCheck', () => {
    it('throws for missing input', async () => {
      // Original test was `expect(...).rejects;` with no matcher — a no-op
      // assertion. Replaced with a real `await expect(...).rejects.toThrow(...)`.
      await expect(ResultsCheck.createCheck('', '', '')).rejects.toThrow(/Missing input/);
    });

    it('warns and skips a non-NUnit XML file without reading it in full', async () => {
      const originalRepository = process.env['GITHUB_REPOSITORY'];
      process.env['GITHUB_REPOSITORY'] = 'game-ci/unity-test-runner';
      const artifactsPath = fs.mkdtempSync(path.join(os.tmpdir(), 'results-check-'));
      const warnSpy = vi.fn();
      const coreModule = await import('@actions/core');
      vi.spyOn(coreModule, 'warning').mockImplementation(warnSpy);
      vi.spyOn(coreModule, 'info').mockImplementation(() => {});
      const githubModule = await import('@actions/github');
      vi.spyOn(githubModule, 'getOctokit').mockReturnValue({
        rest: { checks: { create: vi.fn().mockResolvedValue({}) } },
      } as any);
      // renderSummary/renderDetails load .hbs templates via __dirname, which
      // only resolves correctly once ncc flattens everything into dist/ -
      // irrelevant to what this test checks, so stub them out.
      vi.spyOn(ResultsCheck, 'renderSummary').mockResolvedValue('summary');
      vi.spyOn(ResultsCheck, 'renderDetails').mockResolvedValue('details');

      try {
        fs.writeFileSync(path.join(artifactsPath, 'not-nunit.xml'), '<not-a-test-run/>');

        await ResultsCheck.createCheck(artifactsPath, 'fake-token', 'Test Results');

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('File does not appear to be a NUnit XML file: not-nunit.xml'),
        );
      } finally {
        fs.rmSync(artifactsPath, { recursive: true, force: true });
        vi.restoreAllMocks();
        process.env['GITHUB_REPOSITORY'] = originalRepository;
      }
    });
  });
});
