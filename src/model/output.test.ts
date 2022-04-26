import Output from './output';

describe('Output', () => {
  describe('setArtifactsPath', () => {
    it('does not throw', async () => {
      await expect(Output.setArtifactsPath('')).resolves.not.toThrow();
    });
  });
  describe('setCoveragePath', () => {
    it('does not throw', async () => {
      await expect(Output.setCoveragePath('')).resolves.not.toThrow();
      await expect(Output.setCoveragePath('artifacts')).resolves.not.toThrow();
      await expect(Output.setCoveragePath('coverage')).resolves.not.toThrow();
      await expect(Output.setCoveragePath('CodeCoverage')).resolves.not.toThrow();
      await expect(Output.setCoveragePath('./artifacts')).resolves.not.toThrow();
      await expect(Output.setCoveragePath('./coverage')).resolves.not.toThrow();
      await expect(Output.setCoveragePath('./CodeCoverage')).resolves.not.toThrow();
      await expect(Output.setCoveragePath('./artifacts/coverage')).resolves.not.toThrow();
      await expect(Output.setCoveragePath('./coverage/')).resolves.not.toThrow();
      await expect(Output.setCoveragePath('./CodeCoverage/')).resolves.not.toThrow();
      await expect(Output.setCoveragePath('./artifacts/coverage/')).resolves.not.toThrow();
    });
  });
});
