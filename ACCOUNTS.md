# 계정과 서버 운영

## 고정 계정

| 친구 | 아이디 |
|---|---|
| 도원 | dowon |
| 강재 | gangjae |
| 민서 | minseo |
| 승준 | seungjun |
| 민재 | minjae |
| 재민 | jaemin |
| 호현 | hohyeon |

개인 활성화 코드는 소유자에게 1:1로 전달하며 저장소·HTML·공개 문서·AI 대화·단체방에 포함하지 않습니다. (2026-09에 코드 7개가 공개 공유된 AI 대화에 노출된 적이 있습니다. 미사용 코드는 아래 ‘활성화 코드 재발급’으로 교체합니다.) 새로 발급하는 코드는 7일 뒤 만료됩니다. 본인 코드로 첫 로그인에서 비밀번호를 정합니다. 이후 아이디와 비밀번호로 로그인합니다. 복구 코드는 최초 활성화, 비밀번호 변경 및 복구 때 새로 발급되며 이전 코드는 사용할 수 없습니다. 코드 전달 응답이 네트워크 오류로 유실되었지만 새 비밀번호로 로그인할 수 있다면 내 계정에서 비밀번호를 다시 변경하여 새 복구 코드를 보관합니다.

## 구성

- 화면: GitHub Pages, main의 `docs/index.html`과 `docs/assets/`의 별도 캐시 이미지(개수는 빌드마다 다름). 이미지 파일명에는 내용 해시가 들어갑니다.
- 기존 Supabase 프로젝트: `ogfpeqeoaznwjbrbedbx`, 서울 리전.
- `hohyeon-auth`: 개인 코드·비밀번호를 검증하는 공개 진입점(verify_jwt=false). IP당 요청 제한(60회/분), (계정, IP) 조합의 **실패 누적 잠금**(아래 ‘보안 동작’), 동시 계정 작업을 막는 60초 계정 뮤텍스(`hh_account_lock`, 실패 잠금이 아님), Supabase Auth password hashing과 서명된 세션을 사용합니다. 프로젝트의 다른 Auth 사용자는 게임 계정으로 인정하지 않습니다.
- `hohyeon-api`: (verify_jwt=true) JWT 및 게임의 활성 세션(30일 비활동 시 만료) 확인 후 프로필/원장/게임을 처리합니다. uid와 배역은 서버의 roster에서 결정합니다.
- `hohyeon` 전용 스키마: members, sessions, world, rate_limits, auth_failures, auth_events, profile_history. RLS 활성화, anon/authenticated 접근 및 RPC 실행 권한 없음. service_role만 접근하는 설계라 클라이언트용 RLS 정책을 만들지 않습니다. 기존 public 투표 데이터는 보존합니다.
- 서버 키는 Edge 환경에서만 읽습니다. 브라우저에는 publishable key만 들어갑니다.

프로필은 revision 비교 후 저장합니다. 여러 방의 비공개 게임 상태·공통 지갑·요청 영수증은 단일 world revision으로 원자적으로 확정합니다. 경합한 요청은 최신 DB 상태에서 다시 계산합니다. 사용자의 마지막 512개 변경 요청 영수증과 지속적인 접속 epoch로 재전송과 과거 연결의 부활을 막습니다. 같은 계정으로 다른 탭에 로그인하면 UI를 전환하며, 이미 대기 중인 저장과 게임 요청도 원래 uid와 토큰 uid가 일치해야 전송됩니다.

자동 딜러와 접속 만료는 다음 서버 요청에서 진행됩니다. 모든 창이 닫힌 동안 계속 도는 프로세스는 없습니다. 한 명이라도 접속하면 Realtime 알림/최대 8초 조회 및 저장된 진행 시점으로 계속됩니다. 모든 참가자가 떠난 방의 예약금도 다음 요청에서 정리됩니다. 접속 만료는 180초입니다.

## 보안 동작

- **응답 통일**: 인증 전 단계의 실패(없는 아이디, 준비 안 된 계정, 이미 시작한 계정에 ‘첫 로그인’, 미활성 계정에 코드로 ‘로그인’, 틀린 코드·비밀번호, 만료된 코드)는 모두 같은 401 메시지를 받습니다. 계정 상태를 추측할 수 없게 하기 위함입니다. 자격 증명이 확인된 뒤의 오류(비밀번호 규칙 등)만 구체적으로 안내합니다.
- **실패 누적 잠금**: 성공은 세지 않고 실패만 셉니다. 키는 (아이디 해시, 클라이언트 IP 해시)라서 다른 곳에서 틀린 시도를 반복해도 친구 본인은 잠기지 않습니다. 연속 5회 실패까지는 제한이 없고, 이후 30초→60초→… 두 배씩 최대 1시간 잠깁니다. 성공하면 초기화되고, 24시간 실패가 없으면 기록이 사라집니다(`hohyeon.auth_failures`, `authLockoutSeconds`).
- **클라이언트 IP**: `cf-connecting-ip` → `x-real-ip` → `x-forwarded-for`의 **마지막** 항목 순으로 씁니다(앞쪽 항목은 클라이언트가 조작 가능). IP는 `HH_IP_SALT`(Edge 비밀값, 선택)로 솔트한 SHA-256 앞 32자로만 저장합니다.
- **비밀번호 규칙**: 10–72자(72바이트)에 더해, 방금 쓴 코드와 같거나 코드를 포함하거나 `HH-`/`HR-` 코드 형태인 비밀번호는 거부합니다. 코드 형태의 비밀번호로 로그인하면 응답에 `passwordLooksLikeCode: true`가 붙고 감사 로그에 `code_like_password`가 남습니다. 이런 계정은 비밀번호를 바꾸게 합니다.
- **활성화 코드 만료**: `members.activation_expires_at`. 이전에 발급된 코드(null)는 만료가 없으므로 재발급으로 교체하는 것을 권장합니다.
- **감사 로그**: 모든 login/activate/recover/password/logout/logoutAll 시도와 관리자 재발급이 `hohyeon.auth_events`(시각, 아이디, 동작, 성공 여부, IP 해시, UA, 사유)에 남습니다. 180일 뒤 정리됩니다.
- **세션**: `hohyeon.sessions.last_seen`을 5분 간격으로 갱신하고 30일 동안 쓰지 않은 세션은 거부·삭제합니다. 계정당 최근 20개만 유지합니다. `op:'logoutAll'`(클라이언트 `accountLogoutAll`)은 이 계정의 모든 앱 세션과 모든 기기의 refresh token을 폐기합니다.
- **Realtime**: 방 알림은 private 채널 `hh-cloud-<방 코드>`로만 발행합니다. `realtime.messages` RLS가 ‘게임 세션이 살아 있고 그 방에 lease가 있는 사용자’만 수신하게 하고, 브라우저의 발행은 막습니다. 클라이언트는 `cloud.channel('hh-cloud-' + code, { config: { private: true } })`로 구독해야 합니다(public 구독은 알림을 받지 못하고 8초 조회로만 갱신). 프로젝트 Realtime 설정의 ‘public 채널 허용’은 투표 앱에 영향이 없다면 끄는 것을 권장합니다.
- **저장**: 서버 저장은 fail-closed입니다. 모르는 `version`이나 읽을 수 없는 저장은 빈 저장으로 바꾸지 않고 409 ‘앱을 새로고침해 업데이트해 주세요.’로 거부합니다(서버보다 새 버전이면 ‘서버가 아직 새 저장 형식을 준비 중’). 새 필드는 `LOUNGE_SAVE_VERSION`을 올리고 `LOUNGE_MIGRATIONS`에 이전 버전 → 새 버전 변환을 추가합니다(`app/lounge-look.ts`). 64KB(`jsonb::text` 기준)를 넘으면 413과 전용 안내를 줍니다. 저장에 성공할 때마다 `hohyeon.profile_history`에 계정별 최근 20개 revision이 남습니다.
- **로그**: Edge 함수는 JSON 한 줄 로그(`event`, `requestId`, `message`, `stack`)를 남기고, 5xx 응답 본문과 `x-request-id` 헤더에 같은 요청 ID를 넣습니다.

## 활성화 코드 재발급

미사용 코드가 노출됐거나 만료됐을 때, 또는 탈취된 계정을 되돌릴 때 사용합니다.

1. 로컬에서 실행합니다(서비스 키는 환경 변수로만 전달하고 파일·대화에 남기지 않습니다).
   `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node supabase/admin/rotate-activation-code.mjs <아이디> [--reset] [--days=7]`
   - 새 `HH-` 코드를 만들고 해시·만료(기본 7일)를 저장하고, 앱 세션과 Auth 세션을 폐기한 뒤 Auth 비밀번호를 같은 코드로 바꿉니다. 코드는 이 터미널에만 출력됩니다.
   - 이미 활성화된 계정은 `--reset`이 있어야 합니다. 이 경우 미활성 상태로 돌리고 복구 코드도 지웁니다(원장·저장·지갑은 그대로, auth uid도 유지되므로 잔액이 보존됩니다).
2. 대시보드 SQL 편집기만 쓸 수 있다면 `supabase/admin/rotate-activation-code.sql`의 아이디를 바꿔 실행합니다(결과 표에 코드가 보이므로 바로 1:1로 전달).
3. 새 코드는 친구에게 1:1로 전달하고, 친구가 바로 ‘첫 로그인’을 하게 합니다.
4. 확인: `select username, activated, activation_expires_at from hohyeon.members order by actor;`, `select * from hohyeon.auth_events order by at desc limit 50;`

## 배포 순서

**새 클라이언트는 새 서버가 있어야 동작합니다.** 이번 화면은 private Realtime 채널(`config: { private: true }`), v3 방 저장(3D 꾸미기, `readBedroomStrict`), `world.life` 작업(텃밭·상점·우편·방명록·방 공개 설정), 친구 방 방문(`op: 'visit'`)과 `home` 접속 표시를 전제합니다. 예전 `hohyeon-api`는 v3 방을 v2 기본 방으로 되돌리고 이 작업들을 모르므로, 반드시 아래 순서를 지킵니다. 순서를 바꾸면 방 편집이 사라지거나 게임 알림이 오지 않습니다.

1. **DB 마이그레이션** — `supabase/migrations`를 파일 이름 순서대로 적용합니다(`supabase db push` 또는 SQL 편집기). 이번에는 `20260924120000_hohyeon_hardening.sql`(Realtime 비공개 채널 RLS, 로그인 실패 잠금, 저장 이력 등)과 그보다 새 마이그레이션이 있다면 그것까지입니다. `20260915…` 두 개는 운영 DB에 이미 적용했습니다. 기존 계정이나 원장을 초기화하는 작업은 배포 과정에 넣지 않습니다. 새 마이그레이션은 예전 함수와도 호환됩니다.
2. **Edge 함수** — `supabase/config.toml` 설정대로 두 함수를 배포합니다: `supabase functions deploy hohyeon-auth hohyeon-api`.
   - `hohyeon-auth`: **verify_jwt=false** (자체 자격증명 검증), `hohyeon-api`: **verify_jwt=true**. import map은 둘 다 `supabase/functions/deno.json`(고정 npm 버전)입니다.
   - 번들에는 `supabase/functions/_shared/server.ts`와 루트 `app/*.ts` 공유 엔진 파일(`lounge-accounts.ts`, `lounge-look.ts`, `lounge-bedroom-*.ts`, `lounge-life.ts`, `lounge-room.ts`, `lounge-cloud-engine.ts`, `lounge-games.ts`, `lounge-reactions.ts` 등)이 상대 경로 import로 함께 들어갑니다. 이 파일들을 바꿨다면 두 함수를 다시 배포해야 서버에 반영됩니다.
   - 배포 전 확인: `npm run check`(tsc·테스트·lint), `deno check supabase/functions/*/index.ts`. 선택: Edge 비밀값 `HH_IP_SALT`를 설정합니다.
3. **Pages** — `npm run build:pages`(기본 출력 `docs/`)로 만든 `docs/index.html`, `docs/assets/`, `manifest.webmanifest`, `icons/`, `favicon.svg`를 커밋해 **main에 머지**하면 GitHub Pages가 `/docs`를 게시합니다. HTML만 올리면 이미지·코드 청크가 빠지므로 `docs/` 전체를 함께 올립니다. 예전 `docs/island.html`·`docs/theater.html`은 그대로 둡니다. 게시 후 배포 HTML의 SHA-256을 로컬 파일과 비교하고, 로그인 → 마을 → 방 → 게임 한 판을 확인합니다.
4. **활성화 코드 재발급** — 아직 쓰지 않은 활성화 코드는 모두 새로 만듭니다(위 ‘활성화 코드 재발급’): `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node supabase/admin/rotate-activation-code.mjs <아이디>`. 새 코드는 친구에게 1:1로만 전달합니다.

서버 쪽 변경이 없는 릴리스는 3번(Pages)만 하면 됩니다. 반대로 서버만 바뀐 경우에도 클라이언트가 새 서버 응답을 기대하는지 먼저 확인합니다.

비공개 계정 생성용 초기 설정 endpoint는 일곱 계정 준비 후 제거했습니다. 계정 추가는 고정 roster·배역 제한·서버 검증 변경을 동반해야 합니다. 소유자도 브라우저에서 다른 친구의 서버 잔액을 직접 수정하는 기능은 없습니다.

## 검증과 운영 한도

규칙 및 저장 회귀 테스트 외에 실제 서버에서 일곱 계정 활성화/로그인, 익명 RPC 차단, 저장 CAS 경쟁, 다른 배역 위조 차단, 7인 라운지, 요청 중복, 다른 기기 접속 승계, 체스 정산, 고스톱 이탈 처리, 홀덤/블랙잭/섯다 정산, 방 이동 잔액 보존, 복구 코드 변경과 이전 세션 차단을 검증했습니다. QA 계정 기록은 개인 코드 전달 전에 새 계정 상태로 정리합니다.

원장은 진행 중인 예약과 최근 종료 게임 500건만 world에 두고, 그보다 오래된 기록은 계정별 합계와 카지노 장부로 접어 둡니다. 그래서 예전의 10,000건 한도로 새 게임이 막히지 않습니다(안전 상한 100,000건). world의 6MB 제한(`hh_world_commit`)은 그대로이며, 도달하면 모든 world 변경이 실패하므로 텃밭·우편·방명록 같은 생활 데이터도 크기 상한을 둡니다. Supabase의 실제 사용량과 요금은 해당 프로젝트 대시보드에서 확인합니다.

보안 검사에서 전용 스키마의 ‘RLS 정책 없음’ 정보 항목은 위의 서버 전용 접근 설계에 해당합니다. 프로젝트 공통의 [유출 비밀번호 검사](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)는 기존 설정대로 비활성화되어 있으며 이번 작업에서 전역 Auth 설정은 바꾸지 않았습니다.

## 이전 기록

2026-09-18 개인 방 저장을 위해 `hohyeon-api` v3을 배포했습니다. JWT 검증과 import map은 유지하고, 배포된 25개 소스 파일이 로컬 패키지와 일치함을 확인했습니다. 방은 기존 프로필 JSON 안에 저장되므로 DB/RLS 변경이나 기존 계정 초기화가 없습니다. 저장 호환성과 검증 범위는 [BEDROOM-SAVE.md](supabase/BEDROOM-SAVE.md)에 기록합니다.

옷장 초기화는 현재 계정의 코디에만 적용합니다. 서버 범 지갑, 이전 섬/극장 파일, 기존 브라우저 지갑은 지우지 않습니다. `hohyeon-lounge-v1`의 본인 코디는 내 계정에서 명시적으로 가져올 수 있습니다. 이전 방장별 지갑 기록은 중복 가능성이 있어 자동 합산하지 않습니다.
