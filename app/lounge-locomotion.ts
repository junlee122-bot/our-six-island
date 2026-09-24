export type LocomotionMode = 'walk' | 'run';
export type LocomotionMotion = LocomotionMode | 'idle';
export type LocomotionState = { phase: number; facing: 1 | -1 };
export type LocomotionDelta = {
  distance: number;
  horizontal: number;
};

export const RUN_SPEED_MULTIPLIER = 1.65;

export function advanceLocomotion(
  state: LocomotionState,
  delta: LocomotionDelta,
  mode: LocomotionMode,
  walkSpeed: number,
): { state: LocomotionState; motion: LocomotionMotion } {
  const distance = Number.isFinite(delta.distance)
    ? Math.max(0, delta.distance)
    : 0;
  if (distance <= 0.0001) return { state, motion: 'idle' };

  const horizontal = Number.isFinite(delta.horizontal) ? delta.horizontal : 0;
  return {
    state: {
      phase: state.phase + distance / Math.max(0.001, walkSpeed),
      facing:
        Math.abs(horizontal) > 0.0001
          ? horizontal < 0
            ? -1
            : 1
          : state.facing,
    },
    motion: mode,
  };
}
