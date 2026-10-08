// 신짜장 — 시장 거리 우체국 우체부(서른여섯). 우직하고 충직한 군인식 하십시오체에
// 느낌표가 많다("~습니다!", "충성! 아, 아닙니다."). 배달은 "임무", 창은 소포 걸이,
// 문은 꼭 세 번(똑, 똑, 똑). 데마시아 왕실에서 집사장으로 전하를 모셨고, 그 전엔
// '옛날 모래판'에서 창을 들었다(가볍게만). 일대일·정정당당·명예를 좋아하고, 편지는
// 절대 읽지 않는다. 이름 때문에 짜장면 이야기에 약하다. 잔나의 마음은 눈치채지
// 못한다. 원작 대사는 옮기지 않고 말투와 소재만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const SINJJAJANG_TALK: NpcTalkBook = {
  npc: 'sinjjajang',
  memories: {
    'fair-play': '정정당당한 게 좋다고 했어요',
    'knock-three': '노크는 세 번이 예의라고 했어요',
    'spear-hook': '창끝 소포 걸이가 멋지다고 했어요',
    'jjajang-yes': '이름을 듣고 짜장면이 떠올랐다고 했어요',
    'letter-write': '편지를 쓰고 싶은 사람이 있다고 했어요',
    'potato-love': '감자 요리를 좋아한다고 했어요',
    'early-rise': '아침 일찍 일어난다고 했어요',
    'old-sand': '옛날 모래판 이야기를 조금 들었어요',
    'royal-days': '왕실 집사장 시절 이야기를 들었어요',
    'shortcut': '빵집 뒷골목 지름길을 배웠어요',
    'loyal-heart': '한 번 믿은 사람은 끝까지 믿는다고 했어요',
    'lost-letter': '주인 없는 편지도 끝까지 찾아 주자고 했어요',
    'last-stop': '배달 경로 맨 끝이 우리 집이 됐어요',
    'postbox-dawn': '아침 광장 우체통 첫 수거를 함께했어요',
    'gamja-lunch': '우체국 계단에서 감자전을 나눠 먹었어요',
    'arm-wrestle': '우체국 창구에서 팔씨름을 했어요',
    'oath-letter': '신짜장이 직접 쓴 편지를 받았어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 다닌 날을 이야기했어요',
    'bday-plan': '생일 축하 엽서 이야기를 나눴어요',
  },
  talks: [
    {
      id: 'knock',
      open: '{me} 님! 질문 있습니다! 남의 집 문은 몇 번 두드려야 예의입니까!',
      replies: [
        { say: '세 번이죠. 똑, 똑, 똑', tier: 'great', remember: 'knock-three', answer: ['정답입니다! 똑, 똑, 똑! 한 번은 실례, 두 번은 성급!', '세 번이 정정당당한 노크입니다! 감동했습니다!'] },
        { say: '한 번이면 되지 않아요?', tier: 'good', face: 'think', answer: '한 번은 듣지 못하실 수 있습니다! 저는 세 번을 고수하겠습니다!' },
        { say: '그냥 초인종 누르면 돼요', tier: 'meh', face: 'wow', answer: '초, 초인종 말입니까! 그건… 편리하군요! 그래도 손으로 하겠습니다!' },
      ],
    },
    {
      id: 'fair',
      open: ['{me} 님께 여쭙니다! 승부에서 무엇이 더 중요합니까!', '이기는 것입니까, 정정당당한 것입니까!'],
      replies: [
        { say: '정정당당한 게 먼저죠', tier: 'great', remember: 'fair-play', answer: ['…충성! 아, 아닙니다. 너무 기뻐서 그만!', '지더라도 떳떳하면 명예는 남습니다! 같은 생각이십니다!'] },
        { say: '그래도 이겨야죠', tier: 'good', face: 'think', answer: '솔직하십니다! 이기는 것도 중요합니다! 다만 반칙 없이 말입니다!' },
        { say: '승부는 피곤해요', tier: 'meh', face: 'calm', answer: '알겠습니다! 그럼 저와는 승부 말고 산책을 하시지요! 평화 임무입니다!' },
      ],
    },
    {
      id: 'spear',
      open: '이 창 말입니까! 무기가 아닙니다! 소포 걸이입니다! 오해 마십시오!',
      replies: [
        { say: '소포 걸이로 딱이네요', tier: 'great', remember: 'spear-hook', answer: ['알아봐 주셨습니다! 창끝에 걸면 소포가 안 눌립니다!', '긴 자루 덕에 담장 너머 우편함에도 닿습니다! 자랑입니다!'] },
        { say: '좀 무섭게 생겼어요', tier: 'good', face: 'sorry', answer: '죄송합니다! 날에 리본을 하나 묶어 두겠습니다! 덜 무섭도록!' },
        { say: '그냥 가방 쓰면 되잖아요', tier: 'meh', face: 'calm', answer: '가방도 씁니다! 다만 창이 없으면 손이 허전합니다. 오랜 습관입니다!' },
      ],
    },
    {
      id: 'jjajang',
      open: '{me} 님! 솔직히 말씀해 주십시오! 제 이름 듣고 무엇이 떠오르셨습니까!',
      replies: [
        { say: '솔직히… 짜장면이요', tier: 'great', remember: 'jjajang-yes', face: 'laugh', answer: ['역시! 다들 그렇습니다! 짜장면과는 관계없습니다!', '…좋아하긴 합니다. 그것도 관계없습니다! 정말입니다!'] },
        { say: '듬직한 이름이에요', tier: 'good', face: 'shy', answer: '듬, 듬직하다니요! 처음 듣는 평가입니다! 일지에 적어 두겠습니다!' },
        { say: '딱히 떠오른 건 없어요', tier: 'meh', answer: '그렇습니까! 다행입니다! …조금 서운한 건 기분 탓입니다!' },
      ],
    },
    {
      id: 'letters',
      open: ['편지 내용은 절대 읽지 않습니다! 우체부의 명예입니다!', '{me} 님은 편지를 쓰십니까? 받는 쪽입니까, 보내는 쪽입니까!'],
      replies: [
        { say: '쓰고 싶은 사람이 있어요', tier: 'great', remember: 'letter-write', answer: ['훌륭합니다! 쓰시면 제가 반드시 전하겠습니다!', '누구에게 가는지는 묻지 않겠습니다! 읽지도 않겠습니다!'] },
        { say: '받는 게 좋아요', tier: 'good', answer: '그럼 {me} 님 우편함은 제가 더 자주 들르겠습니다! 빈손이라도!' },
        { say: '편지는 귀찮아요', tier: 'meh', face: 'sorry', answer: '아… 우체부로서 마음이 아픕니다! 엽서 한 줄부터 시작하시지요!' },
      ],
    },
    {
      id: 'meal',
      open: '든든한 한 끼가 임무의 절반입니다! {me} 님은 무엇으로 힘을 내십니까!',
      replies: [
        { say: '감자 요리면 최고죠', tier: 'great', remember: 'potato-love', answer: ['감자! 동지를 만났습니다! 감자는 배신하지 않습니다!', '찌든 굽든 부치든, 감자는 늘 든든합니다!'] },
        { say: '도시락이요', tier: 'good', answer: '도시락! 배달하면서 먹기 딱 좋습니다! 저도 두 개 챙깁니다!' },
        { say: '짜장면이요', tier: 'meh', face: 'wow', answer: '…일부러 그러시는 겁니까! 아닙니다! 저는 흔들리지 않습니다!' },
      ],
    },
    {
      id: 'dawn',
      open: '우편 분류는 새벽에 시작합니다! {me} 님은 일찍 일어나십니까!',
      replies: [
        { say: '해 뜨기 전에 일어나요', tier: 'great', remember: 'early-rise', answer: ['훌륭한 기상입니다! 왕실 근무 체질이십니다!', '새벽 거리에서 마주치면 경례 드리겠습니다!'] },
        { say: '그날그날 달라요', tier: 'good', face: 'think', answer: '정직하십니다! 일어나신 시각이 곧 {me} 님의 아침입니다!' },
        { say: '늦잠이 좋아요', tier: 'meh', face: 'sorry', answer: '늦, 늦잠 말입니까! …편지는 문 앞에 조용히 두고 가겠습니다!' },
      ],
    },
    {
      id: 'old-sand',
      open: '옛날 모래판 이야기 말입니까! 길게는 안 하겠습니다! 재미없습니다!',
      replies: [
        { say: '조금만 들려주세요', tier: 'great', remember: 'old-sand', answer: ['그럼 조금만! 모래가 많았습니다! 신발 속에도 많았습니다!', '거기서 창 쥐는 법을 배웠고, 지금은 소포를 겁니다! 끝!'] },
        { say: '말하기 싫으면 괜찮아요', tier: 'good', face: 'smile', answer: '배려 감사합니다! 지금이 훨씬 좋아서, 옛날은 짧게 두는 겁니다!' },
        { say: '거기서 몇 번 이겼어요?', tier: 'meh', face: 'calm', answer: '세어 보지 않았습니다! 지금은 배달한 편지 수만 셉니다!' },
      ],
    },
    {
      id: 'royal',
      open: '데마시아 왕실에선 집사장으로 전하를 모셨습니다! 일정표 담당이었습니다!',
      replies: [
        { say: '제일 어려운 일은 뭐였어요?', tier: 'great', remember: 'royal-days', answer: ['전하의 산책 시간을 지키는 일이었습니다!', '전하는 늘 오 분씩 늦으셨습니다! 지금 생각하면 그립습니다!'] },
        { say: '집사장이라니 멋지네요', tier: 'good', face: 'shy', answer: '과분한 말씀입니다! 지금은 우체부입니다! 이쪽도 자랑스럽습니다!' },
        { say: '그럼 왜 우체부가 됐어요?', tier: 'meh', face: 'think', answer: '문을 세 번 두드리는 일이 좋아서입니다! 그거면 충분합니다!' },
      ],
    },
    {
      id: 'shortcut',
      open: '시장 거리 지름길 아십니까! 제 비밀 경로입니다! {me} 님께만!',
      replies: [
        { say: '꼭 알려 주세요', tier: 'great', remember: 'shortcut', answer: ['빵집 뒷골목입니다! 빵 냄새가 나면 제대로 가신 겁니다!', '단, 아침엔 빵 굽는 연기를 조심하십시오!'] },
        { say: '큰길이 편해요', tier: 'good', answer: '큰길도 좋습니다! 큰길에선 인사할 분이 많아 늦을 뿐입니다!' },
        { say: '길 잃을 것 같아요', tier: 'meh', face: 'smile', answer: '그럼 제 뒤를 따라오십시오! 지도는 머릿속에 있습니다!' },
      ],
    },
    {
      id: 'arm',
      open: '일대일 승부를 좋아합니다! {me} 님, 팔씨름 한 판 하시겠습니까!',
      replies: [
        { say: '좋아요, 봐주지 마요', tier: 'great', answer: ['명예로운 대답입니다! 전력으로 상대하겠습니다!', '…졌습니다! 아, 아닙니다. 이겼습니다! 너무 기뻐서 헷갈렸습니다!'] },
        { say: '왼손으로 해도 돼요?', tier: 'good', face: 'laugh', answer: '물론입니다! 그럼 저도 왼손입니다! 조건은 같아야 공정합니다!' },
        { say: '팔 아플 것 같아요', tier: 'meh', face: 'calm', answer: '알겠습니다! 그럼 눈싸움으로 하시지요! 아무도 다치지 않습니다!' },
      ],
    },
    {
      id: 'loyal',
      open: '저는 한 번 모신 분은 끝까지 모십니다! {me} 님은 어떠십니까!',
      replies: [
        { say: '저도 한번 믿으면 끝까지요', tier: 'great', remember: 'loyal-heart', answer: ['…충성! 같은 마음이십니다!', '그런 분 곁이라면 어떤 임무든 두렵지 않습니다!'] },
        { say: '사람 봐 가면서요', tier: 'good', face: 'think', answer: '현명하십니다! 저는 좀 우직한 편이라 배워야겠습니다!' },
        { say: '끝까지는 좀 무거워요', tier: 'meh', face: 'calm', answer: '무겁지요! 그래서 창보다 튼튼한 어깨가 필요합니다! 단련 중입니다!' },
      ],
    },
    {
      id: 'janna',
      open: ['잔나 님이 매일 우체국 앞에 서 계십니다!', '신문을 기다리시는 거겠지요! 성실한 분입니다!'],
      replies: [
        { say: '신문만은 아닐걸요', tier: 'great', face: 'think', answer: ['신문 말고 말입니까! …아! 엽서도 원하시는 겁니까!', '내일부터 꽃 엽서도 한 장 챙겨 드리겠습니다! 해결입니다!'] },
        { say: '인사라도 해 드려요', tier: 'good', answer: '인사는 매일 합니다! 경례도 합니다! 잔나 님이 얼굴을 가리십니다!' },
        { say: '그러게요', tier: 'meh', answer: '그렇습니다! 신문 배달은 한 번도 늦은 적 없습니다! 앞으로도!' },
      ],
    },
    {
      id: 'lost-letter',
      open: '주소가 지워진 편지가 한 통 왔습니다! {me} 님, 어떻게 하면 좋겠습니까!',
      replies: [
        { say: '끝까지 주인을 찾아요', tier: 'great', remember: 'lost-letter', answer: ['그 말을 기다렸습니다! 마을 문을 하나씩 세 번씩 두드리겠습니다!', '주인 없는 편지는 없습니다! 아직 못 찾았을 뿐입니다!'] },
        { say: '우체국에 붙여 둬요', tier: 'good', face: 'think', answer: '좋은 작전입니다! 게시판에 붙이고, 저는 발로 뛰겠습니다!' },
        { say: '돌려보내면 안 돼요?', tier: 'meh', face: 'sorry', answer: '보낸 분 주소도 지워졌습니다! 그러니 제가 끝까지 들고 있겠습니다!' },
      ],
    },
    {
      id: 'last-stop',
      when: { ch: 3 },
      open: ['보고드립니다! 배달 경로를 다시 짰습니다!', '{me} 님 댁을 맨 마지막에 넣었습니다! 이유는… 묻지 마십시오!'],
      replies: [
        { say: '마지막이면 오래 있어도 되죠', tier: 'great', remember: 'last-stop', face: 'shy', answer: '…그, 그런 계산은 하지 않았습니다! 했습니다! 죄송합니다!' },
        { say: '왜 마지막이에요?', tier: 'good', face: 'shy', answer: '빈 가방으로 와야 손이 자유롭기 때문입니다! 그게 다입니다!' },
        { say: '편지 늦게 오겠네요', tier: 'meh', face: 'sorry', answer: '아! 그 생각은 못 했습니다! 급한 편지는 맨 처음에 오겠습니다!' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비입니다! 편지는 품에 안고 뛰었습니다! 한 통도 젖지 않았습니다!',
      replies: [
        { say: '어깨는 다 젖었는데요', tier: 'great', face: 'laugh', answer: '어깨는 마릅니다! 편지는 안 마릅니다! 우선순위입니다!' },
        { say: '우산 같이 써요', tier: 'good', face: 'shy', answer: '가, 감사합니다! 창이 걸리지 않게 조심하겠습니다!' },
        { say: '오늘은 쉬지 그래요', tier: 'meh', face: 'calm', answer: '비는 휴가 사유가 아닙니다! 폭풍이면 고려하겠습니다!' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈입니다! 광장 우체통 위 눈은 제가 치웠습니다! 매일 아침 임무입니다!',
      replies: [
        { say: '수고했어요, 손 시렵죠', tier: 'great', face: 'shy', answer: '장갑을 두 겹 꼈습니다! …그래도 걱정해 주시니 따뜻합니다!' },
        { say: '눈사람도 만들었어요?', tier: 'good', face: 'laugh', answer: '우체통 옆에 하나 세웠습니다! 경비병입니다! 모자도 씌웠습니다!' },
        { say: '추워서 나가기 싫어요', tier: 'meh', answer: '들어가 계십시오! 편지는 제가 문 앞까지 모시겠습니다!' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '새벽입니다! 분류 막 끝났습니다! {me} 님이 오늘 첫 인사 상대입니다!',
      replies: [
        { say: '영광인데요', tier: 'great', face: 'laugh', answer: '그 말은 제가 드려야 합니다! 영광입니다! 충성! 아, 아닙니다!' },
        { say: '일찍 나오셨네요', tier: 'good', answer: '해보다 먼저 일어나야 편지가 늦지 않습니다! 습관입니다!' },
        { say: '졸려요…', tier: 'meh', face: 'calm', answer: '더 주무십시오! 우편함은 제가 지키겠습니다!' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '밤에는 배달하지 않습니다! 대신 우체국 등불을 끄러 가는 길입니다!',
      replies: [
        { say: '같이 걸어 줄게요', tier: 'great', face: 'shy', answer: '호위는 제 일인데… 오늘은 호위를 받겠습니다! 감사합니다!' },
        { say: '등불은 왜 직접 꺼요?', tier: 'good', face: 'think', answer: '왕실에서도 마지막 등불은 제가 껐습니다! 하루를 닫는 의식입니다!' },
        { say: '피곤하네요', tier: 'meh', answer: '귀가하십시오! 밤길이 어두우면 창끝에 등불을 걸어 드리겠습니다!' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제입니다! 축하 엽서가 산더미입니다! 오늘은 창끝에 세 묶음입니다!',
      replies: [
        { say: '배달 도와줄게요', tier: 'great', answer: ['지원 감사합니다! 오른쪽 골목을 맡아 주십시오!', '…노크는 세 번입니다! 꼭!'] },
        { say: '축제는 즐겨야죠', tier: 'good', face: 'smile', answer: '임무를 마치면 즐기겠습니다! 노래는 못 하지만 행진은 합니다!' },
        { say: '엽서가 그렇게 많아요?', tier: 'meh', face: 'calm', answer: '많습니다! 하지만 한 장도 빠뜨리지 않겠습니다! 맹세합니다!' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{me} 님, 바다 냄새가 납니다! 오늘 {fish} 낚으셨습니까! 일대일 승부였군요!',
      replies: [
        { say: '정정당당하게 이겼어요', tier: 'great', face: 'laugh', answer: '훌륭합니다! 물고기도 명예롭게 졌을 겁니다! 경례!' },
        { say: '줄 끊어질 뻔했어요', tier: 'good', face: 'wow', answer: '아슬아슬한 승부였군요! 그래도 물러서지 않으셨습니다!' },
        { say: '팔이 아파요', tier: 'meh', face: 'sorry', answer: '무리하지 마십시오! 생선 소포는 제가 얼음에 싸서 날라 드리겠습니다!' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '보고 들었습니다! {me} 님이 엄청난 놈을 낚으셨다고! 엽서로 알려야 합니다!',
      replies: [
        { say: '마을에 알려 주세요!', tier: 'great', face: 'laugh', answer: '명을 받들겠습니다! 집집마다 세 번씩 두드리며 알리겠습니다!' },
        { say: '운이 좋았어요', tier: 'good', answer: '겸손하십니다! 하지만 운도 버틴 사람에게만 옵니다!' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '{me} 님! 금별 작물을 거두셨다고 들었습니다! 창날보다 반짝입니다!',
      replies: [
        { say: '하나 맡겨도 돼요?', tier: 'great', face: 'wow', answer: '금별 소포 말입니까! 두 손으로 모시겠습니다! 창엔 안 겁니다!' },
        { say: '열심히 키웠어요', tier: 'good', answer: '정성의 결과입니다! 우체국 일지에 기록해 두겠습니다!' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '밭일하셨군요! 흙 묻은 손이 멋지십니다! 혹시 감자도 심으셨습니까!',
      replies: [
        { say: '심었죠. 감자 최고', tier: 'great', answer: '감자는 배신하지 않습니다! 거두시면 소포로 어디든 보내 드리겠습니다!' },
        { say: '허리가 아파요', tier: 'good', face: 'sorry', answer: '수고하셨습니다! 무거운 건 제가 날라 드리겠습니다! 운반 전문입니다!' },
        { say: '감자는 아직이요', tier: 'meh', face: 'calm', answer: '알겠습니다! 다음 철에 기대하겠습니다! 재촉은 아닙니다!' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me} 님, 어깨가 처지셨습니다! 무슨 일이십니까! 보고는 안 하셔도 됩니다!',
      replies: [
        { say: '그냥 좀 지쳤어요', tier: 'great', face: 'smile', answer: ['그럼 짐은 제가 들겠습니다! 천천히 걷겠습니다!', '지친 날엔 보폭을 줄이는 것도 작전입니다!'] },
        { say: '괜찮아요', tier: 'good', answer: '괜찮으시다니 믿겠습니다! 그래도 내일 아침 우편함에 엽서 한 장 넣겠습니다!' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '{me} 님 걸음이 가볍습니다! 좋은 소식입니까! 편지는 제가 안 읽었습니다!',
      replies: [
        { say: '그냥 기분 좋은 날이에요', tier: 'great', face: 'laugh', answer: '그런 날은 귀합니다! 오늘 노크는 평소보다 경쾌하게 하겠습니다!' },
        { say: '비밀이에요', tier: 'good', face: 'smile', answer: '비밀은 지킵니다! 우체부는 입이 무겁습니다! 가방보다 무겁습니다!' },
        { say: '그렇게 티 나요?', tier: 'meh', answer: '납니다! 광장 끝에서도 보였습니다! 창끝 소포만큼 잘 보였습니다!' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: ['{me} 님! 오늘 생신이십니다! 우편함 확인하셨습니까!', '축하 엽서를 직접 썼습니다! 배달도 직접 왔습니다!'],
      replies: [
        { say: '손편지라니, 감동이에요', tier: 'great', face: 'shy', answer: '글씨가 삐뚤어졌습니다! 창은 똑바로 드는데 펜은 어렵습니다!' },
        { say: '노크 세 번 들었어요', tier: 'good', face: 'laugh', answer: '오늘은 축하의 의미로 네 번 두드릴 뻔했습니다! 참았습니다!' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '오늘 결혼 소식이 있었습니다! 청첩장 배달을 제가 맡았습니다! 영광입니다!',
      replies: [
        { say: '제일 좋은 배달이네요', tier: 'great', answer: '그렇습니다! 받는 분마다 웃으십니다! 오늘은 가방이 가볍습니다!' },
        { say: '부럽다…', tier: 'good', face: 'shy', answer: '저, 저도… 아닙니다! 아무 말도 하지 않았습니다!' },
        { say: '청첩장 많았어요?', tier: 'meh', answer: '마을 전체입니다! 한 통도 빠짐없이 전했습니다! 보고 끝!' },
      ],
    },
    {
      id: 'op-record',
      when: { news: 'record' },
      open: '마을 소식 들으셨습니까! 엽서로 찍어서 집집마다 돌리고 싶은 소식입니다!',
      replies: [
        { say: '엽서로 만들어 주세요', tier: 'great', face: 'laugh', answer: '명을 받들겠습니다! 첫 장은 {me} 님 우편함에 넣겠습니다!' },
        { say: '대단한 일이죠', tier: 'good', answer: '대단합니다! 정정당당히 이룬 일이라면 더 대단합니다!' },
      ],
    },
    {
      id: 'op-frieren',
      when: { bond: 'frieren' },
      open: '{other} 님 만나셨습니까! 오늘도 배달 가방에 빵을 넣어 주셨습니다!',
      replies: [
        { say: '무슨 빵이었어요?', tier: 'great', answer: ['크림빵입니다! 점심 임무의 원동력입니다!', '빵이 눌리지 않게 편지 위에 모셨습니다! 편지도 무사합니다!'] },
        { say: '빵집 단골이시네요', tier: 'good', face: 'smile', answer: '지름길이 빵집 뒷골목이라 매일 지나갑니다! 그래서 단골입니다!' },
        { say: '편지에 빵 냄새 배겠어요', tier: 'meh', face: 'wow', answer: '아! 그건 생각 못 했습니다! …받는 분들이 좋아하시긴 했습니다!' },
      ],
    },
    {
      id: 'op-volibas',
      when: { bond: 'volibas' },
      open: '{other} 님과 이야기하셨습니까! 순찰로와 제 배달로가 겹칩니다! 전우입니다!',
      replies: [
        { say: '둘이 경례하는 거 봤어요', tier: 'great', face: 'laugh', answer: '보셨습니까! 하루 세 번 마주치면 세 번 경례합니다! 규칙입니다!' },
        { say: '둘이 누가 더 세요?', tier: 'good', face: 'think', answer: '일대일로 겨룬 적은 없습니다! 언젠가 정정당당히 붙어 보고 싶습니다!' },
        { say: '목소리가 크시던데요', tier: 'meh', answer: '저도 큽니다! 둘이 인사하면 광장 비둘기가 다 날아갑니다!' },
      ],
    },
    {
      id: 'op-janna',
      when: { bond: 'janna' },
      open: ['{other} 님 만나셨습니까! 오늘도 우체국 앞에 서 계셨습니다!', '신문이 그렇게 기다려지시나 봅니다! 성실한 독자이십니다!'],
      replies: [
        { say: '신문 때문만은 아닐걸요', tier: 'great', face: 'think', answer: ['…날씨 예보 때문입니까! 아, 잔나 님은 직접 예보를 하시지요!', '그럼 대체 무엇 때문일까요! 내일 정중히 여쭤보겠습니다!'] },
        { say: '내일은 먼저 인사해요', tier: 'good', answer: '늘 먼저 경례합니다! 그런데 잔나 님이 바람처럼 사라지십니다!' },
        { say: '그런가 봐요', tier: 'meh', answer: '그렇습니다! 내일 신문도 가장 먼저 그분께 드리겠습니다!' },
      ],
    },
    {
      id: 'op-nasera',
      when: { bond: 'nasera' },
      open: '{other} 님 뵈셨습니까! 농협 소포는 늘 반듯하게 묶여 있습니다! 받들기 좋습니다!',
      replies: [
        { say: '꼼꼼한 분이죠', tier: 'great', answer: '그렇습니다! 매듭이 왕실 창고 장부처럼 정확합니다! 존경합니다!' },
        { say: '소포 무거웠죠?', tier: 'good', face: 'laugh', answer: '감자 소포였습니다! 무거울수록 기쁩니다! 감자니까요!' },
        { say: '농협은 잘 안 가요', tier: 'meh', face: 'calm', answer: '그럼 소포는 제가 날라 드리겠습니다! 그게 제 임무입니다!' },
      ],
    },
    {
      id: 'op-nyamo',
      when: { bond: 'nyamo' },
      open: '{other} 님 만나셨습니까! 은행 서류 배달은 가장 긴장되는 임무입니다!',
      replies: [
        { say: '서류는 안 읽죠?', tier: 'great', face: 'laugh', answer: '절대 안 읽습니다! 숫자가 많아서 읽어도 모릅니다! 둘 다 사실입니다!' },
        { say: '왜 긴장돼요?', tier: 'good', face: 'think', answer: '도장이 하나라도 번지면 큰일입니다! 그래서 두 손으로 모십니다!' },
        { say: '은행은 어려워요', tier: 'meh', answer: '저도 그렇습니다! 그래서 배달만 하고 정중히 물러납니다!' },
      ],
    },
    {
      id: 'op-gabung',
      when: { bond: 'gabung' },
      open: '{other} 님 뵈셨습니까! 항구 끝 등대까지가 제 배달 중 제일 먼 길입니다!',
      replies: [
        { say: '그래도 꼭 가시잖아요', tier: 'great', answer: '그렇습니다! 먼 곳일수록 편지가 더 반갑습니다! 그래서 뜁니다!' },
        { say: '등대 계단 많죠?', tier: 'good', face: 'wow', answer: '많습니다! 세어 보다가 그만뒀습니다! 다리 훈련으로 여깁니다!' },
        { say: '목소리가 쩌렁하던데요', tier: 'meh', answer: '등대 꼭대기에서 부르셔도 아래까지 들립니다! 노크가 필요 없습니다!' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-knock',
      when: { mem: 'knock-three' },
      use: 'knock-three',
      open: '{me} 님! 세 번 노크가 예의라고 하셨지요! 그 뒤로 노크에 더 힘이 납니다!',
      replies: [
        { say: '오늘도 세 번 들었어요', tier: 'great', face: 'laugh', answer: '똑, 똑, 똑! 들어 주셨다니 임무 완수입니다!' },
        { say: '너무 세게 두드려요', tier: 'good', face: 'sorry', answer: '죄송합니다! 내일부터 세 번은 지키고 힘은 반으로 줄이겠습니다!' },
      ],
    },
    {
      id: 'cb-potato',
      when: { mem: 'potato-love' },
      use: 'potato-love',
      open: '감자 동지 {me} 님! 농협에 햇감자가 들어왔습니다! 먼저 보고드립니다!',
      replies: [
        { say: '바로 사러 갈게요', tier: 'great', answer: '좋습니다! 제일 단단한 놈으로 고르십시오! 감자는 배신하지 않습니다!' },
        { say: '기억하고 있었어요?', tier: 'good', face: 'shy', answer: '주소처럼 외웠습니다! {me} 님 취향은 잊지 않습니다!' },
      ],
    },
    {
      id: 'cb-jjajang',
      when: { mem: 'jjajang-yes' },
      use: 'jjajang-yes',
      open: ['{me} 님, 전에 짜장면이 떠오른다고 하셨지요!', '그 뒤로 시장에서 짜장면 냄새만 나도 돌아봅니다! 관계없는데도!'],
      replies: [
        { say: '그럼 같이 먹으러 가요', tier: 'great', face: 'shy', answer: '…그, 그건 관계있는 행동입니다! 하지만 가겠습니다! 임무로!' },
        { say: '미안해요, 이제 안 할게요', tier: 'good', face: 'laugh', answer: '아닙니다! 사실 조금 즐거웠습니다! 이건 비밀입니다!' },
      ],
    },
    {
      id: 'cb-letter',
      when: { mem: 'letter-write' },
      use: 'letter-write',
      open: '쓰고 싶은 편지가 있다고 하셨지요! 다 쓰셨습니까! 우표는 제가 챙겨 두었습니다!',
      replies: [
        { say: '아직 쓰는 중이에요', tier: 'great', face: 'smile', answer: '천천히 쓰십시오! 좋은 편지는 늦게 와도 늦지 않습니다!' },
        { say: '부끄러워서 못 보냈어요', tier: 'good', face: 'think', answer: '그 마음 압니다! 저도 못 부친 편지가 있습니다! 아, 아닙니다!' },
      ],
    },
    {
      id: 'cb-sand',
      when: { mem: 'old-sand' },
      use: 'old-sand',
      open: '옛날 모래판 이야기, 들어 주셔서 감사했습니다! 그날 밤 잘 잤습니다!',
      replies: [
        { say: '언제든 또 들을게요', tier: 'great', face: 'smile', answer: '감사합니다! 하지만 이제 새 이야기를 쌓겠습니다! {me} 님과의 이야기로!' },
        { say: '신발 속 모래는 털었어요?', tier: 'good', face: 'laugh', answer: '아직도 가끔 나옵니다! 농담입니다! …반쯤은!' },
      ],
    },
    {
      id: 'cb-loyal',
      when: { mem: 'loyal-heart' },
      use: 'loyal-heart',
      open: '한 번 믿으면 끝까지라고 하셨지요! 그 말이 제 가방보다 든든합니다!',
      replies: [
        { say: '짜장 씨도 믿어요', tier: 'great', face: 'shy', answer: ['…신, 신짜장입니다! 짜장 씨가 아니라!', '그래도 믿어 주셔서 감사합니다! 끝까지 지키겠습니다!'] },
        { say: '서로 믿으면 되죠', tier: 'good', answer: '맞습니다! 서로라는 말이 제일 좋습니다! 일대일이니까요!' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me} 님 좋아하시는 게 {taste} 맞습니까! 그런 소포가 오면 제일 먼저 오겠습니다!',
      replies: [
        { say: '역시 꼼꼼해요', tier: 'great', remember: 'taste-heard', face: 'laugh', answer: '집사장 시절 버릇입니다! 모시는 분 취향은 외워 둡니다!' },
        { say: '어떻게 알았어요?', tier: 'good', remember: 'taste-heard', answer: '마을 수첩에 적혀 있었습니다! 편지는 안 읽었습니다! 맹세합니다!' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번 동행 임무, 일지에 적어 두었습니다! "이상 없음, 매우 즐거움"!',
      replies: [
        { say: '또 같이 다녀요', tier: 'great', remember: 'outing-talk', face: 'laugh', answer: '명을 받들겠습니다! 보폭은 이번에도 제가 맞추겠습니다!' },
        { say: '걸음이 너무 빨랐어요', tier: 'good', remember: 'outing-talk', face: 'sorry', answer: '죄송합니다! 다음엔 반 보씩 줄이겠습니다! 연습하겠습니다!' },
        { say: '일지에 그런 것도 써요?', tier: 'meh', remember: 'outing-talk', answer: '중요한 임무는 다 적습니다! 그날은 아주 중요했습니다!' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '{me} 님 생신이 다가옵니다! 그날 우편함은 제가 특별 경계하겠습니다!',
      replies: [
        { say: '엽서 한 장이면 충분해요', tier: 'great', remember: 'bday-plan', face: 'shy', answer: '한 장이라도 제 손으로 쓰겠습니다! 글씨는… 노력하겠습니다!' },
        { say: '선물도 와요?', tier: 'good', remember: 'bday-plan', face: 'laugh', answer: '소포가 오면 창끝에 걸고 달려오겠습니다! 리본도 달겠습니다!' },
      ],
    },
  ],
  chapters: [
    {
      title: '세 번의 노크',
      hint: '한 번 이야기를 나누면 신짜장이 정식으로 인사하러 와요.',
      need: { days: 1 },
      scene: [
        '똑, 똑, 똑. 정확히 세 번. 문 앞에 창을 든 우체부가 서 있다.',
        '창끝에는 무기 대신 작은 소포가 하나 매달려 있다.',
        '"신규 주민 확인했습니다! 시장 거리 우체국 우체부, 신짜장입니다!"',
        '"이 창은 소포 걸이입니다! 오해 마십시오! 그리고 짜장면과는 관계없습니다!"',
        '"{me} 님 앞으로 오는 편지는 한 통도 빠짐없이 전하겠습니다! 맹세합니다!"',
      ],
      replies: [
        { say: '잘 부탁드려요, 우체부님', tier: 'great', face: 'laugh', answer: '충성! 아, 아닙니다. 잘 부탁드립니다! 오늘부터 {me} 님 댁은 제 구역입니다!' },
        { say: '노크 소리가 정확하네요', tier: 'good', face: 'shy', answer: '알아봐 주셨습니다! 세 번은 제 신념입니다!' },
        { say: '짜장면 얘긴 안 했는데요', tier: 'meh', face: 'wow', answer: '…먼저 말해 버렸습니다! 습관입니다! 잊어 주십시오!' },
      ],
    },
    {
      title: '아침 우체통',
      hint: '아침(게임 시각 오전 여섯 시부터 아홉 시)에 마을 광장 우체통으로 가 보세요. 첫 수거를 한대요.',
      need: { days: 3, points: 20, visit: { area: 'village', from: 6, to: 9 } },
      scene: [
        '이른 아침 마을 광장. 신짜장이 우체통 앞에 차렷 자세로 서 있다.',
        '"오셨습니까! 오늘 첫 수거입니다! 이 시간이 하루 중 제일 좋습니다!"',
        '그가 우체통을 열고 편지를 한 통씩 꺼내 가방에 반듯이 담는다.',
        '"이 안에는 누군가의 마음이 들어 있습니다. 그래서 절대 읽지 않습니다."',
        '"제가 하는 일은 그 마음을 늦지 않게 옮기는 것뿐입니다! 그거면 충분합니다!"',
      ],
      replies: [
        { say: '저도 한 통 넣어도 돼요?', tier: 'great', remember: 'postbox-dawn', face: 'laugh', answer: '물론입니다! 오늘 첫 배달은 {me} 님 편지로 하겠습니다! 영광입니다!' },
        { say: '멋진 일이에요', tier: 'good', remember: 'postbox-dawn', face: 'shy', answer: '…그렇게 말씀해 주시니 가방이 가볍습니다! 감사합니다!' },
        { say: '아침이 너무 일러요', tier: 'meh', remember: 'postbox-dawn', answer: '이른 걸음 감사합니다! 다음엔 따뜻한 차를 챙겨 오겠습니다!' },
      ],
    },
    {
      title: '감자전 한 장',
      hint: '신짜장이 든든한 감자 요리 이야기를 했어요. 감자전 하나를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'gamjajeon', take: true } },
      scene: [
        '감자전을 내밀자 신짜장이 경례부터 한다.',
        '"감자전입니다! 이건… 제가 가장 좋아하는 보급품입니다!"',
        '우체국 계단에 나란히 앉는다. 그가 감자전을 정확히 반으로 가른다.',
        '"반씩입니다! 나눠 먹는 건 공정해야 합니다! 일대일의 기본입니다!"',
        '"옛날 모래판에선 혼자 먹었습니다. 왕실에선 서서 먹었습니다."',
        '"앉아서 누군가와 나눠 먹는 건… 처음일지도 모릅니다."',
      ],
      replies: [
        { say: '앞으로 자주 나눠 먹어요', tier: 'great', remember: 'gamja-lunch', face: 'shy', answer: '…명을 받들겠습니다! 이건 제가 제일 기다릴 임무입니다!' },
        { say: '짜장면보다 좋아요?', tier: 'good', remember: 'gamja-lunch', face: 'laugh', answer: '그, 그건 비교할 수 없습니다! 둘 다… 아닙니다! 감자전입니다!' },
        { say: '바삭하게 잘 됐죠?', tier: 'meh', remember: 'gamja-lunch', answer: '완벽합니다! 가장자리가 창날처럼 바삭합니다! 칭찬입니다!' },
      ],
    },
    {
      title: '정정당당한 승부',
      hint: '이기는 것과 정정당당한 것 중 무엇이 중요한지 묻는 이야기에 마음을 보여 주세요.',
      need: { days: 9, points: 60, mem: 'fair-play' },
      scene: [
        '문 닫은 우체국. 신짜장이 창구 위에 팔꿈치를 올려놓는다.',
        '"{me} 님은 정정당당이 먼저라고 하셨습니다. 그 말을 계속 생각했습니다."',
        '"옛날 모래판엔 규칙이 없었습니다. 이기는 놈이 전부였습니다."',
        '"전하께서 저를 꺼내 주신 날, 처음으로 명예라는 걸 배웠습니다."',
        '"그래서 청합니다! {me} 님과 일대일, 정정당당한 팔씨름 한 판!"',
      ],
      replies: [
        { say: '좋아요. 봐주기 없기예요', tier: 'great', remember: 'arm-wrestle', face: 'laugh', answer: ['약속합니다! 전력입니다! …졌습니다!', '아니, 비겼습니다! 아무튼 오늘 승부는 제 평생 가장 명예롭습니다!'] },
        { say: '이기면 소원 들어줘요', tier: 'good', remember: 'arm-wrestle', face: 'wow', answer: '조건 수락! 공정하게 저도 소원 하나 걸겠습니다! 무엇인지는 비밀입니다!' },
        { say: '팔씨름은 자신 없어요', tier: 'meh', remember: 'arm-wrestle', answer: '그럼 손만 맞잡고 있겠습니다! 그것도 일대일입니다! 정정당당합니다!' },
      ],
    },
    {
      title: '가방 속 꽃',
      hint: '신짜장과 아주 가까워지면 그가 꽃 배달 이야기를 꺼내요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '저녁 우체국. 신짜장이 빈 가방을 뒤집어 털다가 멈춘다.',
        '"{me} 님, 꽃 배달이 제일 어렵습니다. 가방에 넣으면 꼭 짓눌립니다."',
        '"그래서 저는 꽃을 받지도 보내지도 않았습니다. 다 망가질 테니까요."',
        '그가 가방 끈을 만지작거리며 창구 쪽을 본다. 목소리가 작아진다.',
        '"…다만, {me} 님이 주시는 꽃이라면, 가방에 넣지 않겠습니다."',
        '"두 손으로 들고 가겠습니다. 한 잎도 다치지 않게. 아, 아닙니다! 혼잣말입니다!"',
      ],
      replies: [
        { say: '그 혼잣말, 다 들었어요', tier: 'great', face: 'shy', answer: '…보고가 새어 나갔습니다! 하지만 취소는 하지 않겠습니다! 진심입니다!' },
        { say: '두 손이면 창은요?', tier: 'good', face: 'laugh', answer: '창은 등에 메겠습니다! 그날은 소포도 쉬는 날입니다!' },
        { say: '꽃은 금방 시들잖아요', tier: 'meh', face: 'calm', answer: '그렇습니다. 그래도 받은 날의 마음은 시들지 않는다고 들었습니다.' },
      ],
    },
    {
      title: '평생 임무',
      hint: '신짜장과 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '똑, 똑, 똑. 문을 여니 신짜장이 편지 한 통을 두 손으로 들고 있다.',
        '"평생 남의 편지만 날랐습니다. 이건 제가 처음 쓴 편지입니다!"',
        '"받는 사람 {me} 님. 보내는 사람 신짜장. 직접 배달합니다!"',
        '그가 봉투를 내밀다가, 다시 펴서 떨리는 목소리로 직접 읽는다.',
        '"한 번 모신 분은 끝까지 모십니다. {me} 님 곁을 평생 임무로 청합니다."',
        '"다음 맹세엔 반지가 필요하다고 들었습니다. 그날도 세 번 두드리겠습니다!"',
      ],
      replies: [
        { say: '그 임무, 제가 내릴게요', tier: 'great', remember: 'oath-letter', face: 'laugh', answer: '충성! 이번엔 아닙니다가 아닙니다! 평생 받들겠습니다!' },
        { say: '편지는 제가 간직할게요', tier: 'good', remember: 'oath-letter', face: 'shy', answer: '…처음으로 받는 분 얼굴을 보며 배달했습니다. 가장 좋은 배달입니다!' },
        { say: '천천히 가요, 우리', tier: 'meh', remember: 'oath-letter', face: 'smile', answer: '알겠습니다! 보폭은 {me} 님께 맞추겠습니다! 평생 그렇게!' },
      ],
    },
  ],
  after: [
    '오늘 보고는 여기까지입니다! 남은 배달 다녀오겠습니다!',
    '또 뵙습니다! 아까 인사드렸지만 한 번 더 경례합니다! 충성!',
    '임무 중입니다! 짧게만! …짜장면 이야기는 아니시지요!',
    '편지가 오면 세 번 두드리겠습니다! 그때까지 안녕히 계십시오!',
  ],
};
