import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll, test } from 'vitest';
import * as Index from '.';

describe('Index', () => {
  test.each(['Action', 'Docker', 'ImageTag', 'Input', 'Output', 'ResultsCheck'])(
    'exports %s',
    (exportedModule) => {
      expect(Index[exportedModule]).toBeDefined();
    },
  );
});
