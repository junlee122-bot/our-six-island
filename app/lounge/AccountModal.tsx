'use client';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { AvatarView } from '../avatar-view';
import { PasswordForm, RecoveryCard } from '../lounge-account-ui';
import type { AccountProfile } from '../lounge-accounts';
import { readLounge, LOUNGE_SAVE_KEY, type LoungeSave } from '../lounge-look';
import { ACTORS } from '../lounge-roster';
import { Details, Modal } from './Modal';
import type { Notify } from './Toast';

export function AccountModal({
  account,
  save,
  setSave,
  saveStatus,
  flush,
  notify,
  onLogout,
  onLogoutAll,
  onReset,
  onClose,
}: {
  account: AccountProfile;
  save: LoungeSave;
  setSave: (fn: (s: LoungeSave) => LoungeSave) => void;
  saveStatus: string;
  flush: () => Promise<boolean>;
  notify: Notify;
  onLogout: () => void;
  onLogoutAll: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [recoveryCode, setRecoveryCode] = useState('');
  return (
    <Modal title="내 계정" onClose={onClose} closable={!recoveryCode}>
      {recoveryCode ? (
        <RecoveryCard
          username={account.username}
          code={recoveryCode}
          onDone={() => setRecoveryCode('')}
        />
      ) : (
        <>
          <div className="l-account-summary">
            <AvatarView
              actor={account.actor}
              look={save.looks[account.actor]}
              portrait
            />
            <div>
              <h3>{ACTORS[account.actor]}</h3>
              <code>{account.username}</code>
              <p>{saveStatus}</p>
            </div>
          </div>
          <div className="l-account-actions">
            <button className="l-secondary" onClick={() => void flush()}>
              지금 저장
            </button>
            <button
              className="l-secondary"
              onClick={() => {
                try {
                  const old = readLounge(localStorage.getItem(LOUNGE_SAVE_KEY));
                  setSave((s) => ({
                    ...s,
                    looks: s.looks.map((look, i) =>
                      i === account.actor ? old.looks[i] : look,
                    ),
                    saved: old.saved.filter((c) => c.actor === account.actor),
                  }));
                  notify('이 기기의 이전 코디를 불러왔어요.');
                } catch {
                  notify('이전 코디를 읽을 수 없어요.', 'error');
                }
              }}
            >
              이 기기의 이전 코디 가져오기
            </button>
          </div>
          <Details summary="현재 코디가 이 기기에 남은 이전 코디로 바뀌어요.">
            범 잔액은 옮기지 않아요.
          </Details>
          <details className="l-password-settings">
            <summary>비밀번호 변경</summary>
            <PasswordForm account={account} onChanged={setRecoveryCode} />
          </details>
          <div className="l-account-danger">
            <button className="l-text danger" onClick={onReset}>
              코디 초기화
            </button>
            <button className="l-text danger" onClick={onLogout}>
              <LogOut size={16} /> 저장하고 로그아웃
            </button>
            <button className="l-text danger" onClick={onLogoutAll}>
              모든 기기에서 로그아웃
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
