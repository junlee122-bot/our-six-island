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
            박물관·게시판·축제 무대·등나무 쉼터·텃밭 틀·울타리·바다 데크,
            미용실·은행 접수동과 메기·잉어·고등어, 회관과
          카지노의 카드 테이블·의자·바 의자·차단봉, 흔들의자, 마당 펌프·문·옹기·장작·
          상자·창고·허수아비, 낚시터 의자·바위·부들·한지 등·계곡 바위·밧줄 난간, 활엽수·
          소나무·풀·덤불·그루터기·돌담·판석·팔각정, 야추·라이어 테이블의 타원 회의
          테이블·알림종·발언대·투표함·탁상 달력·연필, 대장간 공방(무너진 공방 포함), 허풍 주점의
          라멘 포장마차·만두 가게·생선구이 오두막·칠판과 바 카운터·선반·술병·잔·술통·카페 테이블·안장
          의자·벽난로·전구 줄·가마솥·아궁이 등 업그레이드 소품, 범마을 부동산과 나무결 가구점 건물, 빵집·농협·잡화점·어시장
          안의 빵 진열대·케이크 진열장·구움과자 진열장·커피 머신·곡물 자루 수레·저울·과일 상자·씨앗 보관장·생활용품
          진열대·장바구니 거치대·도구 상자·얼음 통·냉동 진열고 원본 모델을 사용했습니다. 테라스와 방의 가구는 3DAssets.dev (CC0)입니다. 주사위·카드·
          타이머 효과음은 Kenney의 Casino Audio·Interface Sounds (CC0)입니다. 허 선장·결 목수
          그림은 Higgsfield(gpt_image_2_5)로 만들었고, 뻥총·다트판·축음기와 주점 음악은 코드로 그렸어요.
          로제·냐모·그웬과 허풍 카드 그림도 Higgsfield로 제작했습니다. 로제와 그웬은
          Riot Games의 미스 포츈·그웬, 냐모는 사용자가 제공한 캐릭터 그림을 참고한 팬 창작입니다.
          시장 거리 주민 나세라·프리렌·쓰레쉬·신짜장·볼리바스·잔나 그림도 Higgsfield로 만들었고, 건물은 위 kArchive
          모델을 다시 배치했습니다. 나세라·쓰레쉬·신짜장·볼리바스·잔나는 Riot Games의 나서스·쓰레쉬·신 짜오·볼리베어·잔나,
          프리렌은 쇼가쿠칸 『장송의 프리렌』 캐릭터를 참고한 팬 창작입니다.
          항구와 언덕 주민 가붕·럭스·힘멜·베아트리스·봇치·츠나데·마키마·야니네코 그림도 Higgsfield로 만들었습니다.
          가붕·럭스는 Riot Games의 가렌·럭스, 힘멜은 쇼가쿠칸 『장송의 프리렌』, 베아트리스는 KADOKAWA 『Re:제로부터 시작하는
          이세계 생활』, 봇치는 호분샤 『봇치 더 록!』, 츠나데는 슈에이샤 『나루토』, 마키마는 슈에이샤·MAPPA 『체인소 맨』,
          야니네코는 코단샤 『야니네코』 캐릭터를 참고한 팬 창작입니다.
          범마을 부동산 신형만·봉미선 그림도 Higgsfield로 만들었고, 후타바샤 『짱구는 못말려』(우스이 요시토)의
          노하라 히로시·미사에를 참고한 팬 창작입니다.
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
        <h3>글꼴</h3>
        <p>
          제목과 간판은{' '}
          <a href="https://fonts.google.com/specimen/Jua" target="_blank" rel="noreferrer">
            Jua
          </a>
          , 본문은{' '}
          <a href="https://github.com/orioncactus/pretendard" target="_blank" rel="noreferrer">
            Pretendard
          </a>{' '}
          (길형진), 쪽지와 편지는{' '}
          <a href="https://fonts.google.com/specimen/Gaegu" target="_blank" rel="noreferrer">
            Gaegu
          </a>
          를 써요. 모두 SIL Open Font License 1.1이에요.
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
