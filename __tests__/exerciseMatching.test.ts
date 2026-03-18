import { resolveExercise } from '../utils/exerciseMatching';

describe('exercise matching normalization', () => {
  it('resolves snake_case warm-up alias: glute_activation', () => {
    const match = resolveExercise('glute_activation');
    expect(match === null).toBe(false);
    expect(match?.name).toBe('Banded Lateral Walk');
  });

  it('resolves shorthand hamstring_stretch alias', () => {
    const match = resolveExercise('hamstring_stretch');
    expect(match === null).toBe(false);
    expect(match?.name).toBe('Seated Forward Fold');
  });
});
