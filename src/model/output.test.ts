import Output from './output';

describe('Output', () => {
  describe('setArtifactsPath', () => {
    it('does not throw', async () => {
      await expect(Output.setArtifactsPath('')).resolves.not.toThrow();
    });
  });
  describe('setCoverageResultsPath', () => {
    it('does not throw', async () => {
      await expect(Output.setCoverageResultsPath('')).resolves.not.toThrow();
      await expect(Output.setCoverageResultsPath('artifacts')).resolves.not.toThrow();
      await expect(Output.setCoverageResultsPath('coverage')).resolves.not.toThrow();
      await expect(Output.setCoverageResultsPath('CodeCoverage')).resolves.not.toThrow();
      await expect(Output.setCoverageResultsPath('./artifacts')).resolves.not.toThrow();
      await expect(Output.setCoverageResultsPath('./coverage')).resolves.not.toThrow();
      await expect(Output.setCoverageResultsPath('./CodeCoverage')).resolves.not.toThrow();
      await expect(Output.setCoverageResultsPath('./artifacts/coverage')).resolves.not.toThrow();
      await expect(Output.setCoverageResultsPath('./coverage/')).resolves.not.toThrow();
      await expect(Output.setCoverageResultsPath('./CodeCoverage/')).resolves.not.toThrow();
      await expect(Output.setCoverageResultsPath('./artifacts/coverage/')).resolves.not.toThrow();
    });
  });
});
