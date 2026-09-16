import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveLatestTag } from './download-cli';

// A GitHub Actions JS step does not automatically receive GITHUB_TOKEN in
// process.env - a calling workflow has to set it explicitly via env:. Most
// consumers never had reason to, which is exactly what game-ci/unity-test-
// runner#328 hit: resolveLatestTag() fell back to no token at all, GitHub's
// unauthenticated rate limit (60 req/hour, shared across every job on the
// runner's IP) was exhausted by an unrelated matrix, and "latest" resolution
// failed with a 403 despite the "authenticated when possible" comment above
// it. The githubToken *input* is different - it defaults to `${{ github.token
// }}`, which Actions populates on every run with no consumer action needed -
// so these assertions exist to keep that the primary path, not an
// occasionally-set env var.
describe('resolveLatestTag', () => {
  const originalGithubToken = process.env.GITHUB_TOKEN;
  const originalGhToken = process.env.GH_TOKEN;

  beforeEach(() => {
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
  });

  afterEach(() => {
    if (originalGithubToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = originalGithubToken;
    if (originalGhToken === undefined) delete process.env.GH_TOKEN;
    else process.env.GH_TOKEN = originalGhToken;
  });

  function fakeFetch(tagName = 'v0.1.0') {
    return vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tag_name: tagName }),
    });
  }

  it('authenticates with the githubToken input even when no env var is set', async () => {
    const fetchFn = fakeFetch();

    await resolveLatestTag(fetchFn as any, 'gha-token-from-input');

    const headers = fetchFn.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer gha-token-from-input');
  });

  it('falls back to GITHUB_TOKEN when no input token is passed', async () => {
    process.env.GITHUB_TOKEN = 'env-github-token';
    const fetchFn = fakeFetch();

    await resolveLatestTag(fetchFn as any);

    const headers = fetchFn.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer env-github-token');
  });

  it('sends no Authorization header when neither is available', async () => {
    const fetchFn = fakeFetch();

    await resolveLatestTag(fetchFn as any);

    const headers = fetchFn.mock.calls[0][1].headers;
    expect(headers.Authorization).toBeUndefined();
  });

  it('surfaces the response status when GitHub rejects the request', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 403 });

    await expect(resolveLatestTag(fetchFn as any)).rejects.toThrow(/GitHub API returned 403/);
  });
});
