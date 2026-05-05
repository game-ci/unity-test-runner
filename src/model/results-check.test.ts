import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll, test } from 'vitest';
import ResultsCheck from './results-check';

describe('ResultsCheck', () => {
  describe('createCheck', () => {
    it('throws for missing input', async () => {
      // Original test was `expect(...).rejects;` with no matcher — a no-op
      // assertion. Replaced with a real `await expect(...).rejects.toThrow(...)`.
      await expect(ResultsCheck.createCheck('', '', '')).rejects.toThrow(/Missing input/);
    });
  });
});
