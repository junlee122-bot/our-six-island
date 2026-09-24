import type { Motion } from './character-style';

/**
 * Stride cycles per locomotion-phase unit. The phase advances with travelled
 * distance (`advanceLocomotion`: distance / walk speed), and running already
 * moves it 1.65× faster, so these rates tie every pose to actual movement.
 * Hand-drawn frames and the cut-out rig share them, so switching outfits never
 * changes the cadence.
 */
export const GAIT_CYCLES_PER_PHASE = { walk: 8 / 6, run: 9 / 6 } as const;

/** Position in the stride cycle, 0 ≤ u < 1 (0 = first leg's heel strike). */
export function gaitCycle(motion: Motion, phase: number) {
  if (motion !== 'walk' && motion !== 'run') return 0;
  const time = Number.isFinite(phase) ? Math.max(0, phase) : 0;
  const u = (time * GAIT_CYCLES_PER_PHASE[motion]) % 1;
  return u < 0 || u >= 1 ? 0 : u;
}

/** Frame index for a strip of `count` hand-drawn poses. */
export function gaitFrame(
  motion: Motion,
  seconds: number,
  count = 6,
  reduced = false,
) {
  if (reduced || (motion !== 'walk' && motion !== 'run')) return 0;
  return Math.floor(gaitCycle(motion, seconds) * count) % count;
}

/** Cut-out rig poses per cycle (each is cached as one composed frame). */
export const RIG_POSES = 8;

export function rigPoseIndex(motion: Motion, phase: number, reduced = false) {
  if (reduced || (motion !== 'walk' && motion !== 'run')) return -1;
  return Math.floor(gaitCycle(motion, phase) * RIG_POSES) % RIG_POSES;
}

type GaitStyle = {
  /** Thigh swing amplitude, degrees either side of vertical. */
  thigh: number;
  /** Peak knee flexion during swing, degrees. */
  knee: number;
  /** Knee flexion while loaded, degrees. */
  stanceKnee: number;
  /** Fraction of a leg's cycle spent on the ground. */
  stance: number;
  arm: number;
  /** Forward torso lean, degrees. */
  lean: number;
  /** Airborne rise at the flight phase, fraction of body height. */
  flight: number;
  /** Lower-garment lag (horizontal shear below the waist). */
  hem: number;
};
export const GAIT_STYLES: Record<'walk' | 'run', GaitStyle> = {
  walk: {
    thigh: 18,
    knee: 44,
    stanceKnee: 6,
    stance: 0.5,
    arm: 8,
    lean: 1.5,
    flight: 0,
    hem: 0.05,
  },
  run: {
    thigh: 23,
    knee: 55,
    stanceKnee: 16,
    stance: 0.4,
    arm: 16,
    lean: 6,
    flight: 0.03,
    hem: 0.09,
  },
};

const rad = (deg: number) => (deg * Math.PI) / 180;
/**
 * Shoes rotate with the shin; a real ankle would keep them flat. Only part of
 * the tilted sole corner counts for grounding, so the pelvis bob comes from
 * leg geometry rather than shoe width (the corner may dip ~1 px).
 */
export const SOLE_TILT = 0.35;

/**
 * Joint angles for one leg at leg phase p (0 = heel strike with the leg
 * forward). Angles are in radians, positive = foot toward the direction of
 * travel; `knee` is flexion (the shin trails the thigh by that much).
 */
export function legAngles(motion: 'walk' | 'run', p: number) {
  const s = GAIT_STYLES[motion];
  const q = ((p % 1) + 1) % 1;
  if (q < s.stance) {
    const t = q / s.stance;
    return {
      thigh: rad(s.thigh) * Math.cos(Math.PI * t),
      knee: rad(s.stanceKnee) * Math.sin(Math.PI * t),
      swing: 0,
    };
  }
  const t = (q - s.stance) / (1 - s.stance);
  // The knee folds early in the swing and straightens before contact.
  const fold = Math.sin(Math.PI * Math.min(1, t * 1.18));
  return {
    thigh: -rad(s.thigh) * Math.cos(Math.PI * t),
    knee: rad(s.knee) * Math.max(0, fold),
    swing: Math.max(0, fold),
  };
}

export type GaitPoint = readonly [number, number];
export type GaitLeg = {
  hip: GaitPoint;
  knee: GaitPoint | null;
  /** Centre of the sole. */
  foot: GaitPoint;
  /** Half the shoe width (sole corners touch the ground when tilted). */
  footHalf: number;
};
export type GaitGeometry = {
  legs: readonly [GaitLeg, GaitLeg];
  /** Body height in the same units (used for flight rise). */
  height: number;
  /** Hem/robe legs swing less and lift instead of folding at a hidden knee. */
  hem: boolean;
};
export type GaitSolution = {
  legs: {
    /** Canvas rotation of the thigh about the hip (clockwise positive). */
    thigh: number;
    /** Canvas rotation of the shin about the (moved) knee, absolute. */
    shin: number;
    /** Extra upward translation for knee-less (hem) legs. */
    lift: number;
    /** 0 leading … 1 fully trailing: back-leg shading weight. */
    shade: number;
    foot: GaitPoint;
  }[];
  /** Downward body offset that keeps the stance sole on the ground. */
  drop: number;
  /** Canvas rotation of the upper body about the hips (forward lean). */
  lean: number;
  /** Arm rotations about the shoulders, by image side (0 = left, 1 = right). */
  arms: [number, number];
  /** Horizontal shear of the garment below the waist. */
  hem: number;
  /** Order to draw the legs in (back first). */
  order: [number, number];
};

const rotate = (
  [x, y]: GaitPoint,
  [cx, cy]: GaitPoint,
  angle: number,
): GaitPoint => {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
};

/**
 * Pose one frame of the cut-out rig. Forward is +x (the renderer mirrors the
 * whole figure when facing left). Canvas y points down, so a foot moves
 * forward under a negative (counter-clockwise) rotation.
 */
export function solveGait(
  motion: 'walk' | 'run',
  u: number,
  geometry: GaitGeometry,
  amount = 1,
): GaitSolution {
  const style = GAIT_STYLES[motion];
  const k = Math.max(0, Math.min(1, amount));
  const legScale = geometry.hem ? 0.7 : 1;
  let lowest = -Infinity;
  const ground = Math.max(...geometry.legs.map((leg) => leg.foot[1]));
  const legs = geometry.legs.map((leg, i) => {
    const a = legAngles(motion, u + i * 0.5);
    const thigh = -a.thigh * k * legScale;
    let shin = thigh,
      lift = 0,
      foot: GaitPoint;
    if (leg.knee && !geometry.hem) {
      shin = -(a.thigh - a.knee) * k;
      const knee = rotate(leg.knee, leg.hip, thigh);
      foot = rotate(
        [knee[0] + leg.foot[0] - leg.knee[0], knee[1] + leg.foot[1] - leg.knee[1]],
        knee,
        shin,
      );
    } else {
      // Without a visible knee, the swing leg simply clears the ground.
      const length = leg.foot[1] - leg.hip[1];
      lift = a.swing * k * length * (motion === 'run' ? 0.2 : 0.11);
      foot = rotate(leg.foot, leg.hip, thigh);
      foot = [foot[0], foot[1] - lift];
    }
    // The lowest sole corner, not just its centre, meets the floor.
    const sole = foot[1] + Math.abs(Math.sin(shin)) * leg.footHalf * SOLE_TILT;
    lowest = Math.max(lowest, sole);
    const trailing = Math.max(0, -a.thigh / Math.max(1e-6, rad(style.thigh)));
    return { thigh, shin, lift, shade: Math.min(1, trailing * 1.2) * k, foot };
  });
  if (!Number.isFinite(lowest)) lowest = ground;
  let drop = ground - lowest;
  if (style.flight) {
    // Airborne between the two stance phases (centre at the end of stance).
    const flightCentre = (style.stance + 0.5) / 2;
    const up = 0.5 + 0.5 * Math.cos(4 * Math.PI * (u - flightCentre));
    drop -= style.flight * geometry.height * up ** 4 * k;
  }
  const swing = Math.cos(2 * Math.PI * u) * rad(style.arm) * k;
  const order: [number, number] =
    legs[0].shade >= legs[1].shade ? [0, 1] : [1, 0];
  return {
    legs,
    drop,
    lean: rad(style.lean) * k,
    // Arms counter-swing: the arm on leg 0's side trails while leg 0 leads.
    arms: [swing, -swing],
    hem: -Math.sin(2 * Math.PI * u) * style.hem * k * (geometry.hem ? 1 : 0.3),
    order,
  };
}
