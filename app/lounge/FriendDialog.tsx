'use client';
// Talking to an offline friend's NPC (C-3): the speech box (SpeechBox.tsx)
// with their portrait, typewriter text (instant under reduced motion),
// E / Space / Enter to go on, and small-talk choices at the end (1–4 or
// arrows; the first small talk with a friend each day adds a little
// friendship). Lines come from lounge-friend-dialog.ts
// (lounge-friend-lines.ts + the friend's own lines).
import { useState } from 'react';
import { ACTORS } from '../lounge-roster';
import { AvatarView } from '../avatar-view';
import type { DialogChoice, DialogScript } from '../lounge-friend-dialog';
import { lookFor } from './friend-looks';
import { SpeechBox } from './SpeechBox';

export function FriendDialog({
  script,
  hearts,
  onTalk,
  onRequest,
  onClose,
}: {
  script: DialogScript;
  hearts: number;
  /** A small-talk answer was picked (the server counts it once a day). */
  onTalk: (choice: DialogChoice, index: number) => void;
  /** "무슨 부탁인데?": open the request card. */
  onRequest: () => void;
  onClose: () => void;
}) {
  // Pages: the script, then (after a choice) the friend's reply.
  const [reply, setReply] = useState<string | null>(null);
  const pages = reply ? [reply] : [...script.pages, ...(script.question ? [script.question] : [])];
  const [page, setPage] = useState(0);
  const last = page >= pages.length - 1;

  const choose = (index: number) => {
    const choice = script.choices[index];
    if (choice.kind === 'bye') return onClose();
    if (choice.kind === 'request') return onRequest();
    onTalk(choice, index);
    setReply(choice.reply || '그렇구나!');
    setPage(0);
  };
  return (
    <SpeechBox
      label={`${ACTORS[script.friend]}와 이야기`}
      testId="friend-dialog"
      textTestId="friend-dialog-text"
      portrait={<AvatarView actor={script.friend} look={lookFor(script.friend)} portrait />}
      name={ACTORS[script.friend]}
      hearts={hearts}
      status="쉬는 중 · NPC"
      pages={pages}
      page={page}
      choices={reply ? undefined : script.choices.map((c, i) => ({ label: c.label, kind: c.kind, testId: `talk-choice-${i}` }))}
      onChoose={choose}
      onNext={() => {
        if (!last) setPage((p) => p + 1);
        else if (reply || !script.choices.length) onClose();
      }}
      onClose={onClose}
    />
  );
}
