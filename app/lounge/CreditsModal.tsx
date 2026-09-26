'use client';
import { Modal } from './Modal';
import { NAMES } from '../lounge-text';

export function CreditsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title={`함께 만든 ${NAMES.app}`} onClose={onClose}>
      <div className="l-credits">
        <h3>마을과 방</h3>
        <p>
          <a
            href="https://karchive.vibeline.co.kr/models"
            target="_blank"
            rel="noreferrer"
          >
            kArchive
          </a>{' '}
          · 출처: 쓰레드 dogfooter. 주택·과일나무·수국·소파·튤립, 회관 한옥·온실·
          박물관·게시판·축제 무대·등나무 쉼터·텃밭 틀·울타리·바다 데크, 회관과
          카지노의 카드 테이블·의자·바 의자·차단봉, 흔들의자, 마당 펌프·문·옹기·장작·
          상자·창고·허수아비, 낚시터 의자·바위·부들·한지 등·계곡 바위·밧줄 난간, 활엽수·
          소나무·풀·덤불·그루터기·돌담·판석·팔각정, 야추·라이어 테이블의 타원 회의
          테이블·알림종·발언대·투표함·탁상 달력·연필 원본 모델을
          사용했습니다. 테라스와 방의 가구는 3DAssets.dev (CC0)입니다. 주사위·카드·
          타이머 효과음은 Kenney의 Casino Audio·Interface Sounds (CC0)입니다.
        </p>
        <p>
          공간을 걸으며 기능을 만나는 구성은{' '}
          <a
            href="https://www.stardewvalley.net/"
            target="_blank"
            rel="noreferrer"
          >
            Stardew Valley
          </a>
          와{' '}
          <a
            href="https://support.gather.town/articles/5874848981-objects-overview"
            target="_blank"
            rel="noreferrer"
          >
            Gather
          </a>
          의 공간·상호작용 방식을 참고했습니다.
        </p>
        <h3>친구들의 모습</h3>
        <p>
          도원 · 강재 · 민서 · 승준 · 민재 · 재민 · 호현. 기존 캐릭터 모션과
          안경·꽃 머리핀 에셋을 재사용했고, 새 전신 의상과 회관 배경은 AI 이미지
          생성으로 제작했습니다. 새 의상은 전신 그림으로 전환하며, 기존 의상의
          걷기·인사는 원래 프레임을 사용합니다.
        </p>
        <h3>체스</h3>
        <p>
          규칙:{' '}
          <a
            href="https://github.com/jhlywa/chess.js"
            target="_blank"
            rel="noreferrer"
          >
            chess.js
          </a>{' '}
          (BSD-2-Clause). 기물:{' '}
          <a
            href="https://github.com/LexLuengas/chessnut-pieces"
            target="_blank"
            rel="noreferrer"
          >
            Chessnut
          </a>{' '}
          · Alexis Luengas (Apache-2.0), 원본 SVG.
        </p>
        <h3>화투</h3>
        <p>
          <a
            href="https://commons.wikimedia.org/wiki/File:Hwatu_January_Hikari.svg"
            target="_blank"
            rel="noreferrer"
          >
            Spenĉjo의 Hwatu
          </a>{' '}
          · Marcus Richert 디자인, Louie Mantia Jr. 원안.{' '}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY-SA 4.0
          </a>
          .{' '}
          <a
            href="https://github.com/itsent-lab/hwatu/tree/main/apps/web/public/cards/hwatu"
            target="_blank"
            rel="noreferrer"
          >
            공개 SVG 48장
          </a>
          을 수정 없이 사용했습니다.
        </p>
        <p>
          고스톱은 3명 기본 룰, 섯다는 2–7명 두 장 섯다입니다. 각 테이블의 규칙
          보기에서 특수 족보와 재경기 규칙을 확인할 수 있어요.
        </p>
      </div>
    </Modal>
  );
}
