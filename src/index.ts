// Thin wrapper: the actual test-runner logic lives in game-ci/unity-engine-core.
// See game-ci/roadmap#11 (workstream 2) for the "thin wrapper" migration this is part of.
export { main, post } from '@game-ci/unity-engine-core/dist/unity-test-runner';
