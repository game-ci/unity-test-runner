import ResultsCheck from './results-check';

describe('ResultsCheck', () => {
  describe('createCheck', () => {
    it('throws for missing input', () => {
      expect(() => ResultsCheck.createCheck('', '', '')).rejects;
    });
  });
});
