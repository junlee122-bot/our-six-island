'use client';
import { useState } from 'react';
import { Modal } from './Modal';
import { GameButton } from '../ui/GameButton';
import { Glyph } from '../ui/Glyph';
import { catalogEntry, type Bedroom } from '../lounge-bedroom-data';
import { YUCHAN_ROOM_ITEMS, YUCHAN_ROOM_TITLE, type YuchanRoomSpot } from '../lounge-yuchan-room';
import './yuchan-room.css';

const STORIES = {
  photo: {
    open: '사진을 이어 붙인 줄에 작은 빈칸이 남아 있어요. 특별한 날만 모으지 않아도, 게임 속 평범한 하루가 한 장의 풍경이 될 수 있겠어요.',
    replies: [
      ['어떤 순간을 남겨 볼까?', '밭에서 돌아오던 길, 친구와 웃었던 판, 문을 열고 들어온 저녁. 떠오르는 장면을 천천히 골라 봐요.'],
      ['빈칸도 그대로 두고 싶어', '아직 정하지 않은 자리도 괜찮아요. 다음에 돌아왔을 때 다시 둘러봐도 돼요.'],
      ['잠깐 구경하고 갈게', '종이 모서리에 빛이 잠깐 머물러요. 사진을 바꾸지 않고 조용히 둘러봤어요.'],
    ],
  },
  rest: {
    open: '낮은 찻상과 포근한 러그가 작은 쉼터를 만들고 있어요. 차를 새로 만들거나 음식을 쓰지 않고, 분위기를 즐기며 잠깐 숨을 돌려요.',
    replies: [
      ['잠깐 숨 돌리기', '천천히 호흡을 가다듬어요. 다음 일을 서둘러 정하지 않아도 괜찮은 자리예요.'],
      ['친구와 나눌 얘기 떠올리기', '오늘 본 것 중 하나를 골라 봐요. 긴 이야기가 아니어도 다시 만났을 때 건넬 말이 되겠어요.'],
      ['다시 마을로 나갈 준비하기', '편히 쉬었으면 하고 싶은 일을 골라 봐요. 이 자리는 다음에도 그대로 기다리고 있어요.'],
    ],
  },
  'tomato-note': {
    open: '책상 위 책갈피에 전설의 토마토를 기다리는 메모가 있어요. “빛나는 열매도 씨앗부터. 흙에 물을 주고, 자라는 동안은 다른 하루를 보내기.”',
    replies: [
      ['씨앗은 어디서 구할까?', '등불 잡화점에서 전설의 토마토 씨앗을 살 수 있어요. 사계절 내 텃밭에 심을 수 있고, 수확한 뒤에는 새 씨앗을 심어요.'],
      ['기다리는 동안 뭘 할까?', '다른 작물을 돌보거나 낚시하고, 친구를 만나도 좋아요. 다 자랐는지는 텃밭에서 확인해 봐요.'],
      ['메모를 덮어 두기', '책갈피를 원래 자리에 두었어요. 열매를 받은 것은 아니지만, 다음에 길러 볼 작은 계획이 생겼네요.'],
    ],
  },
} as const;

/** A small, reward-free room story. Visitors read it as themselves. */
export function YuchanRoomStory({ spot, own, onClose }: { spot: YuchanRoomSpot; own: boolean; onClose: () => void }) {
  const story = STORIES[spot.id];
  const [reply, setReply] = useState<number | null>(null);
  return (
    <Modal title={spot.title} onClose={onClose} panel="note" className="l-yuchan-room">
      <div data-testid={`yuchan-room-story-${spot.id}`}>
        <p className="yc-room-kicker"><Glyph name="house" size={18} /> {own ? '내 방의 작은 이야기' : '유찬의 방에서 둘러보기'}</p>
        <p className="yc-room-prose">{story.open}</p>
        {reply === null ? (
          <div className="yc-room-choices" aria-label="둘러볼 이야기 고르기">
            {story.replies.map(([say], index) => <GameButton key={say} onClick={() => setReply(index)} data-testid={`yuchan-room-reply-${index}`}>{say}</GameButton>)}
          </div>
        ) : (
          <div className="yc-room-answer" data-testid="yuchan-room-answer">
            <p>{story.replies[reply][1]}</p>
            <GameButton onClick={onClose} variant="primary">다 둘러봤어요</GameButton>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function YuchanRoomSet({ room, canApply, onApply, onClose }: { room: Bedroom; canApply: boolean; onApply: () => void; onClose: () => void }) {
  return (
    <Modal title="유찬의 방 꾸미기" onClose={onClose} className="l-yuchan-room" panel="note">
      <div data-testid="yuchan-room-set">
        <p className="yc-room-kicker"><Glyph name="armchair" size={18} /> {YUCHAN_ROOM_TITLE}</p>
        <p className="yc-room-prose">나무 책상과 낮은 차 자리, 사진을 걸어 둔 따뜻한 방이에요. 게임 속 유찬의 공간으로 준비한 소품들을 살펴봐요.</p>
        <ul className="yc-room-set-list" aria-label="세트에 놓이는 가구">
          {YUCHAN_ROOM_ITEMS.map((item) => <li key={item.id}>{catalogEntry(item.ref)?.name ?? item.ref}</li>)}
        </ul>
        {canApply ? (
          <>
            <p className="yc-room-prose">아직 가구를 놓지 않은 방에 이 배치를 놓아요. 현재 벽·바닥·방문 설정은 간직해요. 적용한 뒤에는 가구를 옮기거나 꾸미기의 되돌리기를 쓸 수 있어요.</p>
            <div className="yc-room-choices">
              <GameButton variant="primary" glyph="armchair" onClick={onApply} data-testid="yuchan-room-set-apply">이 가구들로 시작하기</GameButton>
              <GameButton onClick={onClose}>지금 방 그대로 둘게</GameButton>
            </div>
          </>
        ) : <p className="yc-room-prose" data-testid="yuchan-room-set-preserved">이미 꾸민 방은 그대로 간직해요. 놓을 것 고르기에서 세트 소품을 하나씩 골라 원하는 자리에 놓을 수 있어요. 현재 소품 {room.items.length}개</p>}
      </div>
    </Modal>
  );
}
