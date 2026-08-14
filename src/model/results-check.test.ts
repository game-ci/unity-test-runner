import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll, test } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import ResultsCheck from './results-check';
import ResultsParser from './results-parser';

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

      const parseResultsSpy = vi.spyOn(ResultsParser, 'parseResults');
      // vitest/ESM refuses to spy on node:fs's own exports directly
      // ("Module namespace is not configurable in ESM"), so the bounded
      // read is exposed as its own ResultsCheck.readFileHead method
      // specifically so this can spy on (and assert the exact byte bound
      // requested by) the real implementation, not just its end result.
      const readFileHeadSpy = vi.spyOn(ResultsCheck, 'readFileHead');

      try {
        // Larger than the 4KB bounded read, with the non-NUnit content
        // confined to the start of the file - a full-file read would find
        // the same content either way, so this alone doesn't prove
        // boundedness; the readFileHeadSpy assertion below does.
        const filler = 'x'.repeat(8192);
        const filePath = path.join(artifactsPath, 'not-nunit.xml');
        fs.writeFileSync(filePath, `<not-a-test-run/>${filler}`);

        await ResultsCheck.createCheck(artifactsPath, 'fake-token', 'Test Results');

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('File does not appear to be a NUnit XML file: not-nunit.xml'),
        );
        expect(parseResultsSpy).not.toHaveBeenCalled();
        expect(readFileHeadSpy).toHaveBeenCalledWith(filePath, 4096);
      } finally {
        fs.rmSync(artifactsPath, { recursive: true, force: true });
        vi.restoreAllMocks();
        if (originalRepository === undefined) {
          delete process.env['GITHUB_REPOSITORY'];
        } else {
          process.env['GITHUB_REPOSITORY'] = originalRepository;
        }
      }
    });

    it('matches only a complete <test-run> element, not lookalikes like <test-runner>', async () => {
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
      vi.spyOn(ResultsCheck, 'renderSummary').mockResolvedValue('summary');
      vi.spyOn(ResultsCheck, 'renderDetails').mockResolvedValue('details');
      const parseResultsSpy = vi.spyOn(ResultsParser, 'parseResults');

      try {
        fs.writeFileSync(
          path.join(artifactsPath, 'lookalike.xml'),
          '<test-runner>not actually NUnit</test-runner>',
        );

        await ResultsCheck.createCheck(artifactsPath, 'fake-token', 'Test Results');

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('File does not appear to be a NUnit XML file: lookalike.xml'),
        );
        expect(parseResultsSpy).not.toHaveBeenCalled();
      } finally {
        fs.rmSync(artifactsPath, { recursive: true, force: true });
        vi.restoreAllMocks();
        if (originalRepository === undefined) {
          delete process.env['GITHUB_REPOSITORY'];
        } else {
          process.env['GITHUB_REPOSITORY'] = originalRepository;
        }
      }
    });
  });
});
