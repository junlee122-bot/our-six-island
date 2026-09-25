// The first-day tutorial's steps (app/lounge/Onboarding.tsx): each one is
// finished by doing it. Pure, so the order and the "done" checks are tested.

export const TUTORIAL_STEPS = ['move', 'door', 'bag', 'plant'] as const;
export type TutorialStep = (typeof TUTORIAL_STEPS)[number];

export function tutorialNext(step: TutorialStep): TutorialStep | null {
  const i = TUTORIAL_STEPS.indexOf(step);
  return TUTORIAL_STEPS[i + 1] ?? null;
}

export type TutorialSnapshot = {
  /** A walking key, an arrow or a click on the floor happened. */
  moved: boolean;
  /** Where I am ('bedroom', 'village', 'lounge'…). */
  place: string;
  bagOpen: boolean;
  /** My farm plots with a crop. */
  planted: number;
};

/** Is `step` done, given the state now and when the step began? */
export function tutorialStepDone(
  step: TutorialStep,
  now: TutorialSnapshot,
  start: Pick<TutorialSnapshot, 'place' | 'planted'>,
): boolean {
  switch (step) {
    case 'move':
      return now.moved;
    case 'door':
      return now.place !== start.place;
    case 'bag':
      return now.bagOpen;
    case 'plant':
      return now.planted > start.planted;
  }
}
