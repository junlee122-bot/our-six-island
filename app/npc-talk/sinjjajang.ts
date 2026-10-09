// 신짜장 — 시장 거리 우체국 우체부(서른여섯). 우직하고 충직한 군인식 하십시오체에
// 느낌표가 많다("~습니다!", "충성! 아, 아닙니다."). 배달은 "임무", 창은 소포 걸이,
// 문은 꼭 세 번(똑, 똑, 똑). 데마시아 왕실에서 집사장으로 전하를 모셨고, 그 전엔
// '옛날 모래판'에서 창을 들었다(가볍게만). 일대일·정정당당·명예를 좋아하고, 편지는
// 절대 읽지 않는다. 이름 때문에 짜장면 이야기에 약하다. 잔나의 마음은 눈치채지
// 못한다. 원작 대사는 옮기지 않고 말투와 소재만 빌린다.
// 이름처럼 짜장면 배달부 감성도 곳곳에: 철판 덧댄 우편 가방("철가방"), 구호
// "빨리 갑니다!", 불기 전에(식기 전에) 배달, 빈 그릇 회수하듯 답장 회수, 단무지와
// 곱빼기, 비 오는 날 배달 정신, 오토바이 대신 두 발. 본인은 늘 "관계없습니다!".
// 이야기 줄기: 남의 마음만 나르던 우체부가 자기 마음을 직접 배달하게 되기까지.
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
    'bag-love': '철가방 같은 우편 가방이 멋지다고 했어요',
    'fast-go': '"빨리 갑니다!" 구호를 같이 외쳤어요',
    'hot-news': '좋은 소식은 식기 전에 전하자고 했어요',
    'reply-collect': '답장을 써 두면 회수하러 온대요',
    'danmuji': '단무지를 좋아한다고 했어요',
    'gopbaegi': '곱빼기파라고 했어요',
    'rain-duty': '비 오는 날 배달이 귀하다고 했어요',
    'two-feet': '두 발로 걸어야 마을이 보인다고 했어요',
    'prince-mail': '전하께 안부 한 줄을 넣으라고 했어요',
    'pen-practice': '삐뚤어도 정성이 보인다고 했어요',
    'date-talk': '방에 놀러 온 날 이야기를 했어요',
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
    {
      id: 'cheolgabang',
      open: ['이 우편 가방 보셨습니까! 철판을 덧댄 특제입니다!', '시장 분들은 철가방이라고 부르십니다! 짜장면은 안 들었습니다!'],
      replies: [
        { say: '든든해 보여요. 멋져요', tier: 'great', remember: 'bag-love', answer: ['알아봐 주셨습니다! 비도 바람도 못 뚫습니다!', '안에 든 편지는 갓 나온 것처럼 반듯하게 도착합니다!'] },
        { say: '진짜 짜장면 들었을 것 같아요', tier: 'good', face: 'laugh', answer: ['…다들 그러십니다! 열어 보십시오! 편지입니다!', '아, 단무지 냄새는 기분 탓입니다! 정말입니다!'] },
        { say: '무거워 보이는데요', tier: 'meh', face: 'calm', answer: '무겁습니다! 그래서 어깨가 단련됩니다! 일석이조입니다!' },
      ],
    },
    {
      id: 'fast',
      open: '제 구호를 아십니까! "빨리 갑니다!"입니다! 시장 아이들이 따라 합니다!',
      replies: [
        { say: '빨리 갑니다! 저도 해 볼래요', tier: 'great', remember: 'fast-go', face: 'laugh', answer: ['우렁찹니다! 합격입니다!', '이제 {me} 님도 명예 배달 대원입니다! 경례!'] },
        { say: '빨리보다 안전하게요', tier: 'good', face: 'think', answer: ['옳은 말씀입니다! 그래서 뛰되, 넘어지지 않습니다!', '빨리, 그리고 무사히! 그게 진짜 구호입니다!'] },
        { say: '좀 시끄러워요', tier: 'meh', face: 'sorry', answer: '죄송합니다! 이른 아침엔 속으로만 외치겠습니다! 빨리 갑니다…!' },
      ],
    },
    {
      id: 'noodle-rule',
      open: ['배달의 제일 원칙을 아십니까! 불기 전에 가는 겁니다!', '면도, 마음도, 소식도! 시간이 지나면 불어 버립니다!'],
      replies: [
        { say: '좋은 소식은 식기 전에죠', tier: 'great', remember: 'hot-news', answer: ['바로 그겁니다! 따끈할 때 전해야 기쁨도 따끈합니다!', '{me} 님은 배달의 도를 아십니다! 감격입니다!'] },
        { say: '나쁜 소식은요?', tier: 'good', face: 'think', answer: ['그것도 빨리 갑니다! 다만 문은 더 조용히 두드립니다!', '세 번은 지키되, 아주 작게. 그게 예의입니다.'] },
        { say: '면 얘기 아니었어요?', tier: 'meh', face: 'wow', answer: '아, 아닙니다! 비유입니다! 짜장면과는 관계없습니다!' },
      ],
    },
    {
      id: 'reply-bowl',
      open: ['편지를 드리고 끝이 아닙니다! 답장 회수가 남았습니다!', '빈 그릇 찾으러 가듯, 답장도 찾으러 갑니다! 꼬박꼬박!'],
      replies: [
        { say: '답장은 꼭 써서 둘게요', tier: 'great', remember: 'reply-collect', answer: ['명심하겠습니다! {me} 님 문 앞은 회수 경로에 넣었습니다!', '답장이 있는 집은 노크도 기쁩니다! 똑, 똑, 똑!'] },
        { say: '그릇처럼 문밖에 내놓을까요', tier: 'good', face: 'laugh', answer: '하하! 그것도 좋습니다! 다만 비 오는 날은 봉투째 품에 안겠습니다!' },
        { say: '답장 안 쓰면요?', tier: 'meh', face: 'calm', answer: '그럼 빈손으로 인사만 회수하겠습니다! 그것도 귀한 회수입니다!' },
      ],
    },
    {
      id: 'danmuji',
      open: '{me} 님! 무례한 질문 하나 드려도 되겠습니까! 단무지를 좋아하십니까!',
      replies: [
        { say: '단무지 없으면 서운하죠', tier: 'great', remember: 'danmuji', face: 'laugh', answer: ['동지입니다! 노랗고 반듯하고 아삭합니다!', '단무지는 우체부 같습니다! 늘 곁에서 든든합니다!'] },
        { say: '왜 갑자기 단무지예요?', tier: 'good', face: 'shy', answer: '그, 그냥 궁금했습니다! 짜장면 생각을 한 건 아닙니다! 조금 했습니다!' },
        { say: '별로 안 좋아해요', tier: 'meh', face: 'sorry', answer: '그렇습니까! 그럼 제가 두 쪽 먹겠습니다! 공정한 분배입니다!' },
      ],
    },
    {
      id: 'gopbaegi',
      open: ['배달을 마친 날엔 곱빼기를 먹습니다! 감자전 곱빼기입니다!', '{me} 님은 곱빼기파입니까, 보통파입니까!'],
      replies: [
        { say: '당연히 곱빼기죠', tier: 'great', remember: 'gopbaegi', face: 'laugh', answer: ['든든한 분입니다! 곱빼기는 하루를 버틴 자의 훈장입니다!', '언젠가 나란히 곱빼기를 시키겠습니다! 약속입니다!'] },
        { say: '보통에 단무지 많이요', tier: 'good', answer: '현명한 작전입니다! 양보다 균형입니다! 제가 배우겠습니다!' },
        { say: '저는 소식해요', tier: 'meh', face: 'think', answer: '그럼 제 곱빼기에서 한 젓가락 나눠 드리겠습니다! 공평하게!' },
      ],
    },
    {
      id: 'rain-duty',
      open: ['비 오는 날 배달이 제일 귀한 배달입니다!', '그런 날은 다들 기다리고 계십니다. 아무도 안 올 줄 아시니까요.'],
      replies: [
        { say: '그래서 비에도 가는군요', tier: 'great', remember: 'rain-duty', answer: ['그렇습니다! 빗소리 사이로 노크 세 번! 그게 제 자랑입니다!', '문 여는 얼굴이 맑은 날보다 더 환합니다!'] },
        { say: '감기 걸리면 어떡해요', tier: 'good', face: 'shy', answer: '걱정 감사합니다! 귀가하면 바로 생강차를 마십니다! 규칙입니다!' },
        { say: '비 오면 늦어도 돼요', tier: 'meh', face: 'calm', answer: '마음은 감사합니다! 하지만 저는 늦는 법을 배우지 못했습니다!' },
      ],
    },
    {
      id: 'two-feet',
      open: ['오토바이를 타 보라는 말을 듣습니다! 저는 두 발이 좋습니다!', '두 발로 가야 골목마다 인사를 드릴 수 있습니다!'],
      replies: [
        { say: '걸어야 마을이 보이죠', tier: 'great', remember: 'two-feet', answer: ['바로 그겁니다! 담장 고양이도, 빨래도 다 보입니다!', '바퀴는 빠르지만 인사를 놓칩니다! 저는 놓치지 않습니다!'] },
        { say: '다리 안 아파요?', tier: 'good', face: 'think', answer: '아픕니다! 하지만 아픈 만큼 튼튼해집니다! 내일은 덜 아픕니다!' },
        { say: '타면 훨씬 빠를 텐데', tier: 'meh', face: 'sorry', answer: '…시장 골목은 좁습니다! 그리고 저는 시동 거는 법을 모릅니다!' },
      ],
    },
    {
      id: 'ornn-spear',
      open: '어제 오른 님 대장간에 창을 맡겼습니다! 소포 걸이 고리를 새로 달았습니다!',
      replies: [
        { say: '오른 님 솜씨면 튼튼하겠네요', tier: 'great', answer: ['그렇습니다! 말씀은 세 마디셨는데 고리는 완벽했습니다!', '소포 세 개를 걸어도 끄떡없습니다! 시험해 봤습니다!'] },
        { say: '날은 안 갈았어요?', tier: 'good', face: 'laugh', answer: '날은 오히려 무디게 해 달라 했습니다! 소포가 찢기면 안 됩니다!' },
        { say: '그냥 걸이를 사지 그래요', tier: 'meh', face: 'calm', answer: '이 창은 오래된 동료입니다! 은퇴시킬 수 없습니다!' },
      ],
    },
    {
      id: 'library-card',
      open: ['베아트리스 님께 연체 안내 엽서를 배달하는 게 제일 어렵습니다!', '받는 분들이 다들 표정이 굳으십니다!'],
      replies: [
        { say: '웃으면서 드리면 되죠', tier: 'great', answer: ['좋은 작전입니다! 내일부터 엽서와 함께 웃음도 배달하겠습니다!', '…연습하겠습니다! 웃는 게 노크보다 어렵습니다!'] },
        { say: '저도 받은 적 있어요', tier: 'good', face: 'wow', answer: '아! 그 엽서를 제가 드렸습니까! 죄송합니다! 임무였습니다!' },
        { say: '책 빌리기 무섭네요', tier: 'meh', face: 'sorry', answer: '제때 돌려드리면 됩니다! 사서님도 사실 다정하십니다!' },
      ],
    },
    {
      id: 'thresh-parcel',
      open: ['쓰레쉬 님 잡화점 소포는 늘 사슬 소리가 납니다!', '안을 들여다보진 않습니다! 규칙입니다! …조금 궁금하긴 합니다!'],
      replies: [
        { say: '규칙 지키는 게 멋져요', tier: 'great', answer: ['감사합니다! 궁금함과 명예가 싸우면 명예가 이깁니다!', '쓰레쉬 님이 늘 등불을 들고 배웅해 주십니다! 조금 서늘합니다!'] },
        { say: '등불 장식 아닐까요?', tier: 'good', face: 'think', answer: '그럴 수도 있습니다! 그 가게엔 등불이 정말 많습니다!' },
        { say: '몰래 흔들어 봐요', tier: 'meh', face: 'wow', answer: '안 됩니다! 흔드는 것도 들여다보는 것과 같습니다! 사양합니다!' },
      ],
    },
    {
      id: 'tavern-rule',
      open: '샹크스 님이 주점에서 한잔하라 하십니다! 근무 중엔 안 마십니다!',
      replies: [
        { say: '대신 보리차는 어때요', tier: 'great', answer: ['보리차! 훌륭한 대안입니다! 다음엔 그렇게 청하겠습니다!', '샹크스 님은 웃으며 큰 잔에 주실 겁니다! 넘칠 만큼!'] },
        { say: '퇴근 뒤엔 마셔요?', tier: 'good', face: 'shy', answer: '한 잔만입니다! 두 잔이면 경례를 아무에게나 합니다!' },
        { say: '한 잔쯤 괜찮잖아요', tier: 'meh', face: 'calm', answer: '원칙은 원칙입니다! 그래도 권해 주신 마음은 받겠습니다!' },
      ],
    },
    {
      id: 'mercy-blister',
      open: ['메르시 님 의원에 다녀왔습니다! 발에 물집이 세 개였습니다!', '세 개라니, 노크와 같은 수입니다! 운명입니다!'],
      replies: [
        { say: '운명 말고 신발을 바꿔요', tier: 'great', face: 'laugh', answer: ['메르시 님도 똑같이 말씀하셨습니다! 두 분이 옳습니다!', '새 신발은 내일 시장에서 고르겠습니다! 배달용으로 두 켤레!'] },
        { say: '많이 아프죠?', tier: 'good', face: 'shy', answer: '조금입니다! 걱정해 주시니 반으로 줄었습니다!' },
        { say: '오늘은 좀 쉬어요', tier: 'meh', face: 'calm', answer: '반나절만 쉬었습니다! 나머지 반나절은 천천히 걸었습니다!' },
      ],
    },
    {
      id: 'postbox-made',
      open: ['광장 새 우체통은 발키리 님이 짜 주셨습니다!', '튼튼하다고 발로 차 보라 하셔서 경례만 했습니다!'],
      replies: [
        { say: '발키리 님다운 솜씨네요', tier: 'great', answer: ['그렇습니다! 비가 와도 이음새 하나 안 샙니다!', '감사 엽서를 드렸더니 쑥스럽다며 문을 닫으셨습니다!'] },
        { say: '진짜 차 보지 그랬어요', tier: 'good', face: 'wow', answer: '우체통을 차다니요! 편지가 놀랍니다! 못 합니다!' },
        { say: '옛날 게 더 좋았는데', tier: 'meh', face: 'think', answer: '옛 우체통은 우체국 뒤뜰에 모셔 뒀습니다! 은퇴한 전우입니다!' },
      ],
    },
    {
      id: 'address-book',
      open: '마을 모든 주소를 외우고 있습니다! 문 색깔과 노크 소리까지입니다!',
      replies: [
        { say: '우리 집 문은 무슨 소리예요?', tier: 'great', answer: ['{me} 님 댁은 맑은 소리입니다! 똑, 똑, 똑이 또렷합니다!', '세 번째 소리 끝에 늘 발소리가 들립니다! 좋은 소리입니다!'] },
        { say: '외우는 비결이 뭐예요?', tier: 'good', face: 'think', answer: '집사장 시절 손님 명부를 외웠습니다! 그때 버릇입니다!' },
        { say: '좀 무섭네요', tier: 'meh', face: 'sorry', answer: '아, 아닙니다! 배달용입니다! 다른 데는 절대 안 씁니다!' },
      ],
    },
    {
      id: 'prince-letter',
      open: ['지금도 전하께 한 달에 한 번 편지를 씁니다!', '쓰고 보면 보고서 같습니다. "이상 없음! 마을 평화!"'],
      replies: [
        { say: '안부도 한 줄 넣어 봐요', tier: 'great', remember: 'prince-mail', answer: ['안부 말입니까! …"잘 지냅니다, 친구도 생겼습니다." 이렇게요?', '{me} 님 덕분에 쓸 말이 하나 늘었습니다! 감사합니다!'] },
        { say: '보고서도 좋은 편지죠', tier: 'good', face: 'smile', answer: '그렇습니까! 전하께서도 늘 잘 받았다고 답하십니다! 짧게!' },
        { say: '답장은 와요?', tier: 'meh', face: 'calm', answer: '옵니다! 늦게 옵니다! 전하는 여전히 오 분씩 늦으십니다!' },
      ],
    },
    {
      id: 'handwriting',
      open: ['요즘 밤마다 글씨 연습을 합니다! 창은 똑바로 드는데 펜은 휩니다!', '{me} 님, 제 글씨를 한번 봐 주시겠습니까!'],
      replies: [
        { say: '삐뚤어도 정성이 보여요', tier: 'great', remember: 'pen-practice', face: 'shy', answer: ['정성… 그 말이면 충분합니다! 오늘 밤도 연습하겠습니다!', '언젠가 똑바른 글씨로 꼭 쓸 편지가 있습니다! 비밀입니다!'] },
        { say: '받침이 좀 기울었네요', tier: 'good', face: 'think', answer: '정확한 지적입니다! 받침에 힘을 주겠습니다! 경례하듯!' },
        { say: '그냥 도장 찍어요', tier: 'meh', face: 'calm', answer: '도장은 마음을 못 담습니다! 저는 손으로 쓰겠습니다!' },
      ],
    },
    {
      id: 'janna-umbrella',
      open: ['잔나 님 예보가 맑음이라 우산을 두고 나갔다가 흠뻑 젖었습니다!', '그런데 잔나 님이 우체국 앞에서 우산을 들고 계셨습니다!'],
      replies: [
        { say: '그 우산, 짜장 씨 거였을걸요', tier: 'great', face: 'think', answer: ['제 것 말입니까! …아닙니다, 잔나 님 것이었습니다!', '예보가 틀릴 걸 미리 아셨나 봅니다! 대단한 기자이십니다!'] },
        { say: '같이 쓰셨어요?', tier: 'good', face: 'shy', answer: '창이 걸려서 제가 들어 드렸습니다! 잔나 님이 아무 말씀도 없으셨습니다!' },
        { say: '예보를 믿지 마요', tier: 'meh', answer: '아닙니다! 잔나 님 예보는 믿습니다! 우산을 하나 더 들 뿐입니다!' },
      ],
    },
    {
      id: 'two-bowls',
      when: { love: 'dating' },
      open: ['보고드립니다! 오늘 배달 끝나면 곱빼기 두 그릇을 시킬 작전입니다!', '한 그릇은 {me} 님 것입니다! 단무지도 두 배입니다!'],
      replies: [
        { say: '그 작전, 승인합니다', tier: 'great', face: 'laugh', answer: ['충성! 이번엔 아닙니다가 아닙니다! 진짜 충성입니다!', '불기 전에 도착하도록 두 발로 달려오겠습니다!'] },
        { say: '한 그릇 나눠 먹어요', tier: 'good', face: 'shy', answer: '나, 나눠 먹는 겁니까! 젓가락은 두 벌 챙기겠습니다! 공정하게!' },
        { say: '오늘은 배불러요', tier: 'meh', face: 'calm', answer: '그럼 내일로 미루겠습니다! 작전은 날씨처럼 바뀔 수 있습니다!' },
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
    {
      id: 'op-sunny',
      when: { weather: 'sunny' },
      open: ['맑습니다! 배달 최고의 날씨입니다! 오늘은 평소보다 빨리 갑니다!', '빨리 갑니다! …아, 인사부터 드리겠습니다! 안녕하십니까!'],
      replies: [
        { say: '빨리 가요! 응원할게요', tier: 'great', face: 'laugh', answer: '응원 접수! 불기 전에, 아니 식기 전에 다 돌리고 오겠습니다!' },
        { say: '천천히 가도 돼요', tier: 'good', answer: '마음 감사합니다! 그럼 {me} 님 앞에서만 천천히 걷겠습니다!' },
        { say: '더워 보여요', tier: 'meh', face: 'calm', answer: '제복이 두껍습니다! 하지만 단추는 끝까지 잠급니다! 예법입니다!' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '흐립니다! 이런 날은 우산을 가방 옆에 꽂고 다닙니다! 잔나 님 예보보다 먼저!',
      replies: [
        { say: '대비를 잘하시네요', tier: 'great', answer: ['흐린 날은 언제 비로 바뀔지 모릅니다! 편지는 기다려 주지 않습니다!', '철가방 뚜껑도 꽉 잠갔습니다! 이상 없습니다!'] },
        { say: '잔나 님 예보는 뭐였어요?', tier: 'good', face: 'think', answer: '맑음이라 하셨습니다! 그래서 우산을 챙겼습니다! 존경하는 마음으로!' },
        { say: '흐린 날은 처져요', tier: 'meh', face: 'sorry', answer: '그럼 제가 대신 크게 외치겠습니다! 빨리 갑니다! 기운 나십니까!' },
      ],
    },
    {
      id: 'op-storm',
      when: { weather: 'storm' },
      open: ['폭풍입니다! 항구 배달은 내일로 미뤘습니다! 가붕 님께 사과 엽서를 썼습니다!', '그 엽서도 내일 갑니다! …모순입니다!'],
      replies: [
        { say: '오늘은 안전이 먼저죠', tier: 'great', face: 'smile', answer: '옳습니다! 우체부가 날아가면 편지도 날아갑니다! 대기 근무입니다!' },
        { say: '그래도 가고 싶죠?', tier: 'good', face: 'think', answer: '솔직히 그렇습니다! 발이 문 쪽을 향합니다! 꾹 참고 있습니다!' },
        { say: '엽서는 왜 썼어요', tier: 'meh', face: 'laugh', answer: '늦는 건 사과해야 합니다! 하늘 탓이라도 사과는 제 몫입니다!' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring' },
      open: '봄입니다! 연애편지가 쏟아집니다! 봉투마다 하트가 그려져 있습니다! 안 읽었습니다!',
      replies: [
        { say: '짜장 씨한테 온 건 없어요?', tier: 'great', face: 'shy', answer: ['저, 저한테 말입니까! 없습니다! 매일 우체국 앞 잔나 님 신문뿐!', '…그건 제가 드리는 겁니다! 받는 건 없습니다!'] },
        { say: '배달하면서 설레겠어요', tier: 'good', answer: '받는 분 얼굴이 꽃처럼 핍니다! 그걸 보는 게 제 봄입니다!' },
        { say: '꽃가루 때문에 힘들어요', tier: 'meh', face: 'sorry', answer: '저도 재채기를 합니다! 편지에 하지 않으려고 고개를 돌립니다!' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer' },
      open: ['여름입니다! 철가방이 햇볕에 달궈집니다!', '그래도 안의 편지는 서늘합니다! 그늘로만 다니는 작전입니다!'],
      replies: [
        { say: '그늘 지도 저도 알려줘요', tier: 'great', answer: ['기꺼이! 빵집 처마, 농협 차양, 파출소 나무 그늘입니다!', '이 순서로 가면 땀이 반입니다! 극비 정보입니다!'] },
        { say: '시원한 거라도 마셔요', tier: 'good', face: 'shy', answer: '프리렌 님이 냉차를 주셨습니다! 단숨에 마셨습니다! 임무 속도로!' },
        { say: '여름엔 쉬엄쉬엄 해요', tier: 'meh', face: 'calm', answer: '쉬엄쉬엄 빨리 가겠습니다! 그게 가능한지 실험 중입니다!' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '가을입니다! 감자 소포 철입니다! 창끝에 두 개, 등에 세 개입니다!',
      replies: [
        { say: '감자 소포면 신나겠어요', tier: 'great', face: 'laugh', answer: ['신납니다! 무거울수록 기쁜 소포는 감자뿐입니다!', '나세라 님 매듭이라 흘러내리지도 않습니다!'] },
        { say: '허리 조심해요', tier: 'good', face: 'shy', answer: '명심하겠습니다! 무릎을 굽혀서 듭니다! 집사장 시절 배운 자세입니다!' },
        { say: '낙엽 밟는 소리 좋죠', tier: 'meh', answer: '좋습니다! 다만 낙엽이 주소를 가립니다! 그건 적입니다!' },
      ],
    },
    {
      id: 'op-winter',
      when: { season: 'winter' },
      open: ['겨울입니다! 연하장 철입니다! 가방이 두 배로 부풀었습니다!', '손은 시려도 연하장은 따끈하게! 품에 안고 갑니다!'],
      replies: [
        { say: '제 연하장도 부탁해요', tier: 'great', face: 'laugh', answer: '맡겨 주십시오! {me} 님 연하장은 가방 맨 위, 품 제일 안쪽입니다!' },
        { say: '장갑 하나 더 끼세요', tier: 'good', face: 'shy', answer: '…두 겹 꼈습니다! 세 겹이면 노크 소리가 안 납니다!' },
        { say: '겨울엔 집이 최고죠', tier: 'meh', face: 'calm', answer: '그럼 계십시오! 문 앞까지 따뜻함을 배달하겠습니다!' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: ['저녁입니다! 답장 회수 경로를 도는 중입니다!', '빈 그릇 찾으러 가는 기분입니다! 비면 비는 대로 반갑습니다!'],
      replies: [
        { say: '수고 많았어요, 오늘도', tier: 'great', face: 'shy', answer: '…그 말 한마디에 하루치 걸음이 다 풀립니다! 감사합니다!' },
        { say: '답장 많이 모였어요?', tier: 'good', answer: '열두 통입니다! 내일 아침 첫 수거와 함께 바로 보냅니다!' },
        { say: '배고프겠어요', tier: 'meh', face: 'laugh', answer: '배고픕니다! 곱빼기가 저를 기다립니다! 감자전 곱빼기입니다!' },
      ],
    },
    {
      id: 'op-day-rush',
      when: { time: 'day' },
      open: '{me} 님! 지금 배달 중입니다! 빨리 갑니다! 그래도 경례는 하고 갑니다!',
      replies: [
        { say: '가세요! 불기 전에!', tier: 'great', face: 'laugh', answer: '알아주셨습니다! 불기 전에, 식기 전에! 다녀오겠습니다!' },
        { say: '잠깐 숨 좀 돌려요', tier: 'good', face: 'smile', answer: '삼십 초만입니다! …충분합니다! 다시 출발합니다!' },
        { say: '뭘 그렇게 급해요', tier: 'meh', face: 'calm', answer: '편지는 기다리는 사람이 있으면 다 급합니다! 실례합니다!' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '{me} 님, 배를 타고 다녀오셨다고요! 먼바다엔 주소가 없습니다! 걱정했습니다!',
      replies: [
        { say: '엽서 보낼 곳이 없었어요', tier: 'great', face: 'think', answer: ['그렇습니다! 그래서 돌아오시는 게 제일 반가운 소식입니다!', '다음엔 병에 편지를 넣으십시오! 바다가 배달할 겁니다!'] },
        { say: '바다 멋졌어요', tier: 'good', answer: '그 이야기는 엽서로 써 주십시오! 마을 전체에 돌리겠습니다!' },
        { say: '멀미 났어요', tier: 'meh', face: 'sorry', answer: '저도 배는 약합니다! 두 발이 땅에 있어야 마음이 놓입니다!' },
      ],
    },
    {
      id: 'op-casino',
      when: { recent: 'casinoWin' },
      open: ['카지노에서 크게 따셨다는 소문이 우체국까지 왔습니다!', '미스 포츈 님 앞에서 이기셨다니! 정정당당했습니까!'],
      replies: [
        { say: '물론 정정당당했죠', tier: 'great', face: 'laugh', answer: '그럼 명예로운 승리입니다! 축하 엽서를 직접 쓰겠습니다!' },
        { say: '운이 좋았어요', tier: 'good', answer: '운도 승부의 일부입니다! 다만 오래 기대지는 마십시오!' },
        { say: '다 잃기 전에 나왔어요', tier: 'meh', face: 'think', answer: '현명한 후퇴입니다! 물러날 때를 아는 것도 용기입니다!' },
      ],
    },
    {
      id: 'op-birthday-news',
      when: { news: 'birthday' },
      open: '오늘 마을에 생일인 분이 있습니다! 축하 엽서가 아침부터 줄을 섰습니다!',
      replies: [
        { say: '짜장 씨도 한 장 썼어요?', tier: 'great', face: 'shy', answer: '썼습니다! 글씨가 휘었지만 마음은 똑바릅니다! 직접 배달합니다!' },
        { say: '생일 소포는 신나겠다', tier: 'good', answer: '신납니다! 리본 달린 소포는 창끝에 걸면 깃발 같습니다!' },
        { say: '저는 아니에요', tier: 'meh', face: 'calm', answer: '알고 있습니다! {me} 님 날은 따로 경계 중입니다! 걱정 마십시오!' },
      ],
    },
    {
      id: 'op-friend-wedding',
      when: { friendNews: 'wedding' },
      open: ['친구분 결혼 소식 들었습니다! 축전 배달은 제가 맡겠습니다!', '불기 전에, 아니 식기 전에 가장 먼저 전하겠습니다!'],
      replies: [
        { say: '축전 한 장 같이 써요', tier: 'great', answer: ['명을 받들겠습니다! 문구는 {me} 님이, 배달은 제가!', '일대일 협동 작전입니다! 최고의 조합입니다!'] },
        { say: '부럽기도 해요', tier: 'good', face: 'shy', answer: '…저, 저도 그런 소식을 배달할 날을… 아닙니다! 축하합니다!' },
        { say: '이미 들었어요', tier: 'meh', face: 'sorry', answer: '제가 늦었습니다! 소문이 우체부보다 빠릅니다! 분합니다!' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: ['오늘 {other} 님과 서먹합니다! 노크를 두 번만 했습니다!', '세 번째를 못 했습니다. 마음이 걸렸습니다.'],
      replies: [
        { say: '내일 세 번 다 하면 돼요', tier: 'great', face: 'smile', answer: ['…그렇습니다! 내일은 정정당당히 세 번! 사과도 세 번!', '{me} 님 덕분에 작전이 섰습니다! 감사합니다!'] },
        { say: '무슨 일 있었어요?', tier: 'good', face: 'think', answer: '편지를 너무 일찍 드렸습니다! 주무시는데 노크를 했습니다! 제 잘못입니다!' },
        { say: '그냥 두면 풀려요', tier: 'meh', face: 'calm', answer: '풀리길 기다리는 건 제 체질이 아닙니다! 먼저 가겠습니다!' },
      ],
    },
    {
      id: 'op-with-janna',
      when: { with: 'janna' },
      open: ['아, {me} 님! 지금 {other} 님께 신문을 드리는 중이었습니다!', '…오늘은 왜 얼굴이 빨개지셨을까요! 열이 있으신 겁니까!'],
      replies: [
        { say: '열은 아닐 거예요', tier: 'great', face: 'think', answer: ['그럼 햇볕 때문이군요! 그늘로 모시겠습니다!', '…잔나 님이 왜 한숨을 쉬시는지 모르겠습니다! 보고 끝!'] },
        { say: '둘이 잘 어울려요', tier: 'good', face: 'wow', answer: '어, 어울린다니요! 우체부와 기자! 소식 전하는 동료입니다!' },
        { say: '방해했나요?', tier: 'meh', answer: '아닙니다! 배달은 끝났습니다! 잔나 님만 아직 안 가십니다!' },
      ],
    },
    {
      id: 'op-with-volibas',
      when: { with: 'volibas' },
      open: '{other} 님과 경로 회의 중입니다! 순찰과 배달, 겹치는 골목 정리 작전입니다!',
      replies: [
        { say: '두 분 경례 한 번 보여줘요', tier: 'great', face: 'laugh', answer: ['충성! …볼리바스 님은 콧수염을 쓰다듬는 걸로 답하십니다!', '그게 그분 경례입니다! 서로 존중합니다!'] },
        { say: '팔씨름은 언제 해요?', tier: 'good', face: 'think', answer: '닐라 님이 심판을 서 주신다 했습니다! 날짜는 일대일로 정하겠습니다!' },
        { say: '회의가 너무 시끄러워요', tier: 'meh', face: 'sorry', answer: '둘 다 목소리가 큽니다! 비둘기들께 사과드립니다!' },
      ],
    },
    {
      id: 'op-with-frieren',
      when: { with: 'frieren' },
      open: ['{other} 님 빵집 앞입니다! 점심 빵을 받는 중입니다!', '철가방에 넣으면 편지가 빵 냄새로 배달됩니다! 다들 좋아하십니다!'],
      replies: [
        { say: '저도 그 편지 받고 싶어요', tier: 'great', face: 'laugh', answer: '그럼 {me} 님 편지는 크림빵 옆 칸에 모시겠습니다! 특급입니다!' },
        { say: '오늘 빵은 뭐예요?', tier: 'good', answer: '감자빵입니다! 프리렌 님이 제 취향을 기억하셨습니다! 감격입니다!' },
        { say: '빵이 눌리겠어요', tier: 'meh', face: 'think', answer: '편지 위에 모셨습니다! 무게 배분은 왕실 연회 상차림만큼 정확합니다!' },
      ],
    },
    {
      id: 'op-with-nasera',
      when: { with: 'nasera' },
      open: '{other} 님께 소포 무게를 확인받는 중입니다! 감자 상자 다섯입니다!',
      replies: [
        { say: '감자 상자, 최고의 소포죠', tier: 'great', face: 'laugh', answer: '그렇습니다! 감자는 배신하지 않고, 나세라 님 매듭도 배신하지 않습니다!' },
        { say: '들어 드릴까요?', tier: 'good', face: 'shy', answer: '마음만 받겠습니다! 운반은 제 임무입니다! 두 발 튼튼합니다!' },
        { say: '그걸 다 혼자요?', tier: 'meh', answer: '혼자입니다! 두 번 왕복합니다! 빨리 갑니다!' },
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
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: ['{me} 님 방에 초대받은 날, 일지에 한 줄 썼습니다!', '"임무 아님. 그런데 가장 중요했음." 이상입니다!'],
      replies: [
        { say: '저도 그날 좋았어요', tier: 'great', remember: 'date-talk', face: 'shy', answer: '…보, 보고 감사합니다! 그 일지는 평생 보관하겠습니다!' },
        { say: '일지 보여 줄래요?', tier: 'good', remember: 'date-talk', face: 'wow', answer: '그건 기밀입니다! 편지처럼 아무도 못 읽습니다! 저도 가끔만 읽습니다!' },
        { say: '그냥 놀러 간 건데요', tier: 'meh', remember: 'date-talk', face: 'calm', answer: '그 그냥이 저에겐 큰일이었습니다! 다음에도 불러 주십시오!' },
      ],
    },
    {
      id: 'cb-bag',
      when: { mem: 'bag-love' },
      use: 'bag-love',
      open: '철가방이 멋지다고 하셨지요! 그 뒤로 매일 아침 광을 냅니다! 보십시오!',
      replies: [
        { say: '번쩍번쩍하네요', tier: 'great', face: 'laugh', answer: ['창끝보다 번쩍입니다! 광장 끝에서도 보입니다!', '시장 아이들이 거울로 씁니다! 공익 활동입니다!'] },
        { say: '짜장면 냄새 안 나요?', tier: 'good', face: 'wow', answer: '아, 안 납니다! …오늘 점심이 짜장면이긴 했습니다! 관계없습니다!' },
      ],
    },
    {
      id: 'cb-fast',
      when: { mem: 'fast-go' },
      use: 'fast-go',
      open: '{me} 님! 그 구호 기억하십니까! 하나, 둘! "빨리 갑니다!"',
      replies: [
        { say: '빨리 갑니다!', tier: 'great', face: 'laugh', answer: ['훌륭한 합창입니다! 광장 비둘기가 다 날았습니다!', '오늘 배달 속도가 두 배가 될 겁니다! 감사합니다!'] },
        { say: '작게 할게요… 빨리 갑니다', tier: 'good', face: 'smile', answer: '조용한 구호도 좋습니다! 속으로 외치면 발은 더 빨라집니다!' },
      ],
    },
    {
      id: 'cb-reply',
      when: { mem: 'reply-collect' },
      use: 'reply-collect',
      open: ['답장 회수 왔습니다! 똑, 똑, 똑!', '써 두신다고 하셨지요! 혹시 오늘 회수할 답장이 있습니까!'],
      replies: [
        { say: '여기요, 두 손으로 드릴게요', tier: 'great', face: 'shy', answer: ['두 손으로 받겠습니다! 빈 그릇이 아니라 꽉 찬 그릇입니다!', '불기 전에, 식기 전에 반드시 전하겠습니다!'] },
        { say: '아직 못 썼어요, 미안해요', tier: 'good', face: 'smile', answer: '괜찮습니다! 인사만 회수해 가겠습니다! 내일 또 오겠습니다!' },
      ],
    },
    {
      id: 'cb-danmuji',
      when: { mem: 'danmuji' },
      use: 'danmuji',
      open: '단무지 동지 {me} 님! 농협에 노란 무가 들어왔습니다! 나세라 님이 절이신답니다!',
      replies: [
        { say: '한 통 같이 사요', tier: 'great', face: 'laugh', answer: ['공동 구매 작전! 반씩입니다! 공정하게!', '배달은 제가 하겠습니다! 무거운 건 제 몫입니다!'] },
        { say: '그걸 아직 기억해요?', tier: 'good', face: 'shy', answer: '주소처럼 외웠습니다! 단무지는 잊으면 안 되는 정보입니다!' },
      ],
    },
    {
      id: 'cb-gopbaegi',
      when: { mem: 'gopbaegi' },
      use: 'gopbaegi',
      open: ['곱빼기파 {me} 님! 약속 기억하십니까! 나란히 곱빼기!', '오늘 배달이 일찍 끝났습니다! 작전 개시 가능합니다!'],
      replies: [
        { say: '좋아요, 지금 가요', tier: 'great', face: 'laugh', answer: ['출발! 감자전 곱빼기 둘, 단무지 넉넉히!', '…감자전에 단무지가 맞는지는 모르겠습니다! 그래도 갑니다!'] },
        { say: '오늘은 보통으로요', tier: 'good', face: 'smile', answer: '알겠습니다! 그럼 저도 보통입니다! 조건은 같아야 공정합니다!' },
      ],
    },
    {
      id: 'cb-rain',
      when: { mem: 'rain-duty' },
      use: 'rain-duty',
      open: '비 오는 날 배달이 귀하다고 해 주셨지요! 그 말이 우비보다 따뜻했습니다!',
      replies: [
        { say: '다음 비 오는 날 차 끓일게요', tier: 'great', face: 'shy', answer: ['…명을 받들겠습니다! 그날은 {me} 님 댁을 맨 끝에 넣겠습니다!', '마지막 배달지에서 차를 마시는 건 처음입니다!'] },
        { say: '생강차는 마셨어요?', tier: 'good', face: 'laugh', answer: '두 잔 마셨습니다! 규칙은 한 잔인데 추웠습니다! 보고합니다!' },
      ],
    },
    {
      id: 'cb-shortcut',
      when: { mem: 'shortcut' },
      use: 'shortcut',
      open: '빵집 뒷골목 지름길, 써 보셨습니까! 오늘 아침엔 빵 굽는 연기가 짙었습니다!',
      replies: [
        { say: '빵 냄새 따라 잘 갔어요', tier: 'great', face: 'laugh', answer: ['제대로 가셨습니다! 이제 {me} 님도 시장 거리 정예입니다!', '힘멜 님이 문 앞에서 갓 나온 빵을 흔들어 주셨을 겁니다!'] },
        { say: '연기 때문에 길 잃었어요', tier: 'good', face: 'sorry', answer: '죄송합니다! 다음엔 제가 앞장서겠습니다! 창끝을 따라오십시오!' },
      ],
    },
    {
      id: 'cb-royal',
      when: { mem: 'royal-days' },
      use: 'royal-days',
      open: ['전하 이야기를 들어 주셨지요! 그날 밤 전하께 편지를 썼습니다!', '"마을에 제 이야기를 들어 주는 분이 생겼습니다." 그렇게요!'],
      replies: [
        { say: '전하도 기뻐하시겠어요', tier: 'great', face: 'shy', answer: '답장이 왔습니다! 여전히 짧았습니다! "잘됐다, 늦지 마라."' },
        { say: '저 얘기를 썼다고요?', tier: 'good', face: 'wow', answer: '이름은 안 썼습니다! 개인 정보입니다! …좋은 분이라고만 썼습니다!' },
      ],
    },
    {
      id: 'cb-early',
      when: { mem: 'early-rise' },
      use: 'early-rise',
      open: '해 뜨기 전에 일어나신다고 하셨지요! 내일 새벽 분류, 견학 오시겠습니까!',
      replies: [
        { say: '갈게요, 단무지 들고', tier: 'great', face: 'laugh', answer: ['단무지 견학생은 처음입니다! 환영합니다!', '편지를 칸에 넣는 소리가 노크처럼 경쾌합니다! 들려드리겠습니다!'] },
        { say: '요즘은 좀 늦게 일어나요', tier: 'good', face: 'think', answer: '그럼 견학은 해 뜬 뒤로 미루겠습니다! 일정 조정은 제 특기입니다!' },
      ],
    },
    {
      id: 'cb-lost',
      when: { mem: 'lost-letter' },
      use: 'lost-letter',
      open: ['보고드립니다! 그 주소 지워진 편지, 주인을 찾았습니다!', '쿠도 신이치 님이 우표 소인을 보고 단번에 추리하셨습니다!'],
      replies: [
        { say: '끝까지 찾았군요, 대단해요', tier: 'great', face: 'laugh', answer: ['끝까지 찾자고 하신 {me} 님 덕입니다! 공은 반반입니다!', '받는 분이 울면서 웃으셨습니다! 오래 기다린 편지였답니다!'] },
        { say: '신이치 님은 어떻게 알았대요', tier: 'good', face: 'think', answer: '소인 번짐이 항구 쪽 습기라 하셨습니다! 저는 끄덕이기만 했습니다!' },
      ],
    },
    {
      id: 'cb-gamja',
      when: { mem: 'gamja-lunch' },
      use: 'gamja-lunch',
      open: '우체국 계단 감자전, 아직도 생각납니다! 정확히 반씩 나눴지요!',
      replies: [
        { say: '이번엔 제가 가를게요', tier: 'great', face: 'laugh', answer: ['좋습니다! 다만 공정하게! …제 쪽이 조금 크면 사양하겠습니다!', '계단 자리는 제가 미리 닦아 두겠습니다!'] },
        { say: '다음엔 곱빼기로 해요', tier: 'good', face: 'shy', answer: '곱빼기 감자전을 반으로! 결국 보통 두 장입니다! 그래도 좋습니다!' },
      ],
    },
    {
      id: 'cb-prince',
      when: { mem: 'prince-mail' },
      use: 'prince-mail',
      open: ['전하께 안부 한 줄을 넣었습니다! "친구도 생겼습니다."', '답장에 처음으로 한 줄이 더 붙어 왔습니다! "그 친구를 아껴라."'],
      replies: [
        { say: '그 친구, 저 맞죠?', tier: 'great', face: 'shy', answer: ['…맞습니다! 명을 받들어 아끼겠습니다! 평생 임무입니다!', '아, 너무 크게 말했습니다! 그래도 취소는 안 합니다!'] },
        { say: '다정한 전하시네요', tier: 'good', face: 'smile', answer: '말씀은 짧으셔도 마음은 깁니다! 늦으시는 것도 깁니다!' },
      ],
    },
    {
      id: 'cb-pen',
      when: { mem: 'pen-practice' },
      use: 'pen-practice',
      open: '글씨 연습 결과 보고! 이제 받침이 덜 기웁니다! 보십시오, {me} 님 성함입니다!',
      replies: [
        { say: '와, 제 이름 예쁘게 썼네요', tier: 'great', face: 'shy', answer: ['백 번 썼습니다! 아니, 연습이니까 당연합니다! 아무 뜻 없습니다!', '…조금 있습니다. 보고는 여기까지입니다!'] },
        { say: '아직 좀 기울었어요', tier: 'good', face: 'laugh', answer: '정직한 평가 감사합니다! 내일은 경례하듯 똑바로 쓰겠습니다!' },
      ],
    },
    {
      id: 'cb-two-feet',
      when: { mem: 'two-feet' },
      use: 'two-feet',
      open: '걸어야 마을이 보인다고 하셨지요! 오늘 담장 위 새끼 고양이 다섯을 봤습니다!',
      replies: [
        { say: '저도 걸으면서 볼래요', tier: 'great', face: 'laugh', answer: ['그럼 제 경로를 공유하겠습니다! 고양이 구간은 극비입니다!', '빵집 뒷골목 셋째 담장입니다! 쉿!'] },
        { say: '배달은 늦지 않았어요?', tier: 'good', face: 'sorry', answer: '삼 초 멈췄습니다! 그만큼 더 빨리 걸었습니다! 손실 없음!' },
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
        '등에는 철판을 덧댄 우편 가방, 창끝에는 작은 소포가 하나.',
        '숨이 조금 차 있다. 광장에서부터 뛰어온 모양이다.',
        '"신규 주민 확인했습니다! 시장 거리 우체국 우체부, 신짜장입니다!"',
        '"이 창은 소포 걸이입니다! 오해 마십시오! 그리고 짜장면과는 관계없습니다!"',
        '그가 창끝에서 소포를 풀어 두 손으로 내민다. 환영 소포다.',
        '"마을 회관에서 보낸 첫 소포입니다! 식기 전에 가져왔습니다!"',
        '"아, 식는 물건은 아닙니다! 습관입니다! 소식은 따끈할 때 전해야 해서!"',
        '"{me} 님 앞으로 오는 편지는 한 통도 빠짐없이 전하겠습니다! 맹세합니다!"',
        '"그리고 답장이 생기시면 언제든 회수하러 오겠습니다! 빨리 갑니다!"',
      ],
      replies: [
        { say: '잘 부탁드려요, 우체부님', tier: 'great', face: 'laugh', answer: ['충성! 아, 아닙니다. 잘 부탁드립니다!', '오늘부터 {me} 님 댁은 제 구역입니다! 경로 맨 앞에 넣겠습니다!'] },
        { say: '노크 소리가 정확하네요', tier: 'good', face: 'shy', answer: ['알아봐 주셨습니다! 세 번은 제 신념입니다!', '한 번은 실례, 두 번은 성급, 세 번이 예의입니다!'] },
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
        '우체통 위에 내려앉은 이슬을 소매로 닦고, 열쇠를 세 번 돌린다.',
        '"열쇠도 세 번입니다! 이건 그냥 자물쇠가 뻑뻑해서입니다!"',
        '그가 편지를 한 통씩 꺼내 철가방에 반듯이 담는다.',
        '"이 안에는 누군가의 마음이 들어 있습니다. 그래서 절대 읽지 않습니다."',
        '"면은 불기 전에, 마음은 식기 전에. 제가 정한 배달 원칙입니다."',
        '"예전엔 시키는 대로만 날랐습니다. 지금은 기다리는 얼굴을 떠올립니다."',
        '저 멀리 신문사 쪽에서 잔나가 손을 흔들다 말고 얼른 숨는다.',
        '"잔나 님이십니다! 신문을 기다리시나 봅니다! 오늘도 일찍 나오셨습니다!"',
        '"제가 하는 일은 그 마음을 늦지 않게 옮기는 것뿐입니다! 그거면 충분합니다!"',
      ],
      replies: [
        { say: '저도 한 통 넣어도 돼요?', tier: 'great', remember: 'postbox-dawn', face: 'laugh', answer: ['물론입니다! 오늘 첫 배달은 {me} 님 편지로 하겠습니다!', '빨리 갑니다! …아, 주소를 아직 안 쓰셨습니다!'] },
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
        '철가방 옆 칸에서 작은 통이 나온다. 노란 단무지 네 쪽이다.',
        '"비상식량입니다! 짜장면용은 아닙니다! …감자전에도 어울립니다!"',
        '"옛날 모래판에선 혼자 먹었습니다. 왕실에선 서서 먹었습니다."',
        '"전하 식사를 나르고, 빈 그릇을 회수하고, 그게 제 하루였습니다."',
        '"그때 배웠습니다. 그릇이 비어 돌아오면 그날은 잘 된 겁니다."',
        '그가 빈 접시를 내려다보며 조용히 웃는다.',
        '"앉아서 누군가와 나눠 먹는 건… 처음일지도 모릅니다."',
      ],
      replies: [
        { say: '앞으로 자주 나눠 먹어요', tier: 'great', remember: 'gamja-lunch', face: 'shy', answer: ['…명을 받들겠습니다!', '이건 제가 제일 기다릴 임무입니다! 그릇은 제가 회수하겠습니다!'] },
        { say: '짜장면보다 좋아요?', tier: 'good', remember: 'gamja-lunch', face: 'laugh', answer: '그, 그건 비교할 수 없습니다! 둘 다… 아닙니다! 감자전입니다!' },
        { say: '바삭하게 잘 됐죠?', tier: 'meh', remember: 'gamja-lunch', answer: '최고입니다! 가장자리가 창날처럼 바삭합니다! 칭찬입니다!' },
      ],
    },
    {
      title: '정정당당한 승부',
      hint: '이기는 것과 정정당당한 것 중 무엇이 중요한지 묻는 이야기에 마음을 보여 주세요.',
      need: { days: 9, points: 60, mem: 'fair-play' },
      scene: [
        '문 닫은 우체국. 신짜장이 창구 위에 팔꿈치를 올려놓는다.',
        '"{me} 님은 정정당당이 먼저라고 하셨습니다. 그 말을 계속 생각했습니다."',
        '창구 등불 아래, 그의 손등에 오래된 굳은살이 보인다.',
        '"옛날 모래판엔 규칙이 없었습니다. 이기는 놈이 전부였습니다."',
        '"함성이 크면 클수록 저는 작아졌습니다. 이름도 번호로 불렸습니다."',
        '"전하께서 저를 꺼내 주신 날, 처음으로 제 이름을 불러 주셨습니다."',
        '"그날 처음으로 명예라는 걸 배웠습니다. 지는 것도 떳떳할 수 있다는 걸."',
        '그가 소매를 걷고, 창은 벽에 기대 세운다. 오늘은 소포도 걸지 않았다.',
        '"그래서 청합니다! {me} 님과 일대일, 정정당당한 팔씨름 한 판!"',
        '"심판은 없습니다. 서로가 서로의 심판입니다. 그게 제일 공정합니다."',
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
        '비 오는 저녁 우체국. 신짜장이 젖은 철가방을 뒤집어 털다가 멈춘다.',
        '"오늘 마지막 배달은 꽃이었습니다. 비를 뚫고 두 발로 갔습니다."',
        '"{me} 님, 꽃 배달이 제일 어렵습니다. 가방에 넣으면 꼭 짓눌립니다."',
        '"그래서 오늘은 우비 속에 품고 뛰었습니다. 제 어깨는 다 젖었고요."',
        '"받는 분이 웃으셨습니다. 그 얼굴을 보고 처음으로 부러웠습니다."',
        '"저는 꽃을 받지도 보내지도 않았습니다. 다 망가질 테니까요."',
        '그가 가방 끈을 만지작거리며 창구 쪽을 본다. 목소리가 작아진다.',
        '"…다만, {me} 님이 주시는 꽃이라면, 가방에 넣지 않겠습니다."',
        '"두 손으로 들고 가겠습니다. 한 잎도 다치지 않게. 비가 와도."',
        '빗소리 사이로 그의 귀 끝이 빨갛다.',
        '"아, 아닙니다! 혼잣말입니다! 보고 대상이 아닙니다!"',
      ],
      replies: [
        { say: '그 혼잣말, 다 들었어요', tier: 'great', face: 'shy', answer: ['…보고가 새어 나갔습니다!', '하지만 취소는 하지 않겠습니다! 진심입니다! 식기 전에 말씀드렸습니다!'] },
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
        '제복 단추가 하나 어긋나 있다. 밤새 글씨 연습을 한 손이 떨린다.',
        '"평생 남의 편지만 날랐습니다. 이건 제가 처음 쓴 편지입니다!"',
        '"받는 사람 {me} 님. 보내는 사람 신짜장. 직접 배달합니다!"',
        '"우체통에 넣으면 내일 아침에야 갑니다. 그건 너무 늦었습니다."',
        '"불기 전에, 식기 전에. 그래서 두 발로 뛰어왔습니다."',
        '그가 봉투를 내밀다가, 다시 펴서 떨리는 목소리로 직접 읽는다.',
        '"한 번 모신 분은 끝까지 모십니다. {me} 님 곁을 평생 임무로 청합니다."',
        '"아침마다 세 번 두드리고, 저녁마다 답장을 회수하러 오겠습니다."',
        '"비가 와도, 눈이 와도. 오토바이 없이, 두 발로."',
        '편지를 접어 건네고, 그가 처음으로 경례 대신 고개를 숙인다.',
        '"다음 맹세엔 반지가 필요하다고 들었습니다. 그날도 세 번 두드리겠습니다!"',
      ],
      replies: [
        { say: '그 임무, 제가 내릴게요', tier: 'great', remember: 'oath-letter', face: 'laugh', answer: ['충성! 이번엔 아닙니다가 아닙니다!', '평생 받들겠습니다! 답장은 지금, 직접 회수하겠습니다!'] },
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
    '빨리 갑니다! 불기 전에 돌아오겠습니다! 아, 면 말고 편지입니다!',
    '저녁 답장 회수 때 다시 들르겠습니다! 빈손이어도 괜찮습니다!',
    '철가방이 아직 반이나 찼습니다! 다녀오겠습니다! 두 발로!',
    '오늘 두 번째 경례입니다! 규정엔 없지만 하고 싶었습니다!',
  ],
};
