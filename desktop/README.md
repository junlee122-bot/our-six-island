# 범타듀 밸리 데스크톱 앱 (Tauri 2)

친구 7명이 Windows·macOS에서 설치해서 쓰는 데스크톱 버전이에요. 게임 자체는
GitHub Pages와 **같은 정적 웹 빌드**(`scripts/build-standalone.mjs`)이고, 이 폴더는
그 빌드를 감싸는 얇은 네이티브 창(Tauri)만 담고 있어요. 서버(Supabase Edge
Functions·Realtime)는 웹과 똑같이 `https://ogfpeqeoaznwjbrbedbx.supabase.co`를 써요.

```
desktop/
├─ app-icon.png              아이콘 원본 (public/favicon.svg → 1024px, sharp)
├─ dist/                     npm run build:desktop 결과 (git 무시)
└─ src-tauri/
   ├─ tauri.conf.json        창·CSP·번들·업데이터 설정
   ├─ Cargo.toml / Cargo.lock
   ├─ capabilities/default.json   웹 페이지가 쓸 수 있는 네이티브 권한
   ├─ icons/                 npx tauri icon desktop/app-icon.png -o desktop/src-tauri/icons
   └─ src/
      ├─ main.rs, lib.rs     플러그인 등록, 창 생성, 다운로드 처리
      └─ desktop-init.js     게임보다 먼저 주입: F11 전체 화면, 외부 링크 → 기본 브라우저
app/desktop-bridge.ts        게임 코드와 셸을 잇는 브리지 (아래 "연결 지점")
.github/workflows/desktop.yml  태그 푸시 → Windows/macOS 설치 파일 → 초안 릴리스
```

## 명령어

| 명령 | 하는 일 |
| --- | --- |
| `npm run build:desktop` | 웹 게임을 `desktop/dist`로 빌드 (`--out desktop/dist --site-url /`). 베이스 경로는 원래 `./`라 추가 설정 없음 |
| `npm run desktop:dev` | 위 빌드 후 개발용 창 실행 (Rust 필요) |
| `npm run desktop:build` | 현재 OS용 설치 파일 생성 → `desktop/src-tauri/target/release/bundle/` |

로컬 빌드 준비물: Node 22, Rust stable(`rustup`), Windows는 WebView2(윈10/11 기본 포함)
와 VS Build Tools "C++ 데스크톱", macOS는 Xcode Command Line Tools, Linux는
`libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev`.
`desktop:dev`는 웹 개발 서버 없이 `dist`를 그대로 띄우므로, 게임 코드를 고친 뒤에는
다시 실행해야 반영돼요. (빠른 반복은 웹 `npm run dev`로.)

## 창·플러그인 설정 요약

- 창 제목 `범타듀 밸리`, 기본 1600×900, 최소 1280×720, 크기 조절 가능, 가운데 배치.
- **F11 전체 화면**: `desktop-init.js`가 주입해서 게임 코드 수정 없이 바로 동작.
- **single-instance**: 앱을 두 번 실행하면 새 창 대신 기존 창을 앞으로 가져와요.
- **deep-link**: `beomtadew://lounge/<코드>` 링크를 앱이 받아요(아래 "초대 딥 링크").
- **창 닫기**: 닫기 버튼을 누르면 게임이 저장을 마친 뒤(최대 4초) 창이 닫혀요
  (`onDesktopCloseRequested`, 권한 `core:window:allow-close`/`allow-destroy`).
- **PC 설정**: 게임 안 Esc 메뉴와 설정(그래픽·화면·소리·조작·알림)이 창 모드/전체 화면을
  이 창으로 바꾸고, 마지막 선택을 다음 실행 때 되살려요.
- **notification**: 플러그인이 `window.Notification`을 OS 알림으로 바꿔 줘서, 기존
  `app/lounge/feedback.ts`의 알림 코드가 그대로 윈도우 토스트/맥 알림 센터로 가요.
- **opener**: 크레딧 등 `target="_blank"` 외부 링크를 기본 브라우저로 열어요.
- **다운로드**: `<a download>`(복구 코드 .txt, 코디 PNG)는 사용자 "다운로드" 폴더에 저장.
- **updater + process**: 아래 "자동 업데이트" 참고. 지금은 비활성(자리표시자 키).
- **CSP**: `'self'` + Supabase(`https://…supabase.co`, `wss://…supabase.co`) +
  three.js GLB 텍스처용 `blob:`/`data:`만 허용. 다른 서버를 쓰게 되면
  `tauri.conf.json → app.security.csp.connect-src`에 추가해야 해요.

## 설치 파일 만드는 법 (사용자가 할 일)

1. `package.json`의 `"version"`을 올려요 (예: `0.1.1`). 앱 버전·릴리스 이름이 여기서 나와요.
2. 커밋 후 태그 푸시: `git tag v0.1.1 && git push origin v0.1.1`
   (또는 GitHub → Actions → **Desktop app** → Run workflow).
3. 약 15–25분 뒤 Releases에 **초안(draft)** 릴리스가 생겨요:
   - Windows x64: `beomtadew-valley_<버전>_windows_x64.msi`, `…_x64.exe`(NSIS 설치 파일, 사용자 폴더 설치라 관리자 권한 불필요)
   - macOS 유니버설(Intel+Apple Silicon): `…_darwin_universal.dmg`
4. 확인 후 **Publish release** → 친구들에게 링크 전달.

### 서명 없이 배포할 때 친구들이 보게 될 경고

7명끼리 쓰는 거라 유료 인증서 없이도 충분해요. 대신 처음 한 번은:

- **Windows SmartScreen**: "Windows의 PC 보호" → **추가 정보** → **실행**.
  없애려면 코드 서명 인증서가 필요해요. 가장 싼 방법은 Azure Trusted Signing(월 약
  $10, 개인은 국가 제한 있음) 또는 OV 인증서(연 $200+). 설정은
  `tauri.conf.json → bundle.windows.signCommand` / `certificateThumbprint`.
- **macOS Gatekeeper**: 이 설정은 ad-hoc 서명(`bundle.macOS.signingIdentity: "-"`)이라
  "손상됨" 대신 "확인되지 않은 개발자" 경고가 떠요. **시스템 설정 → 개인정보 보호 및
  보안 → 그래도 열기**(Sequoia 이상), 또는 앱 우클릭 → 열기.
  그래도 "손상되었습니다"가 뜨면 터미널에서
  `xattr -dr com.apple.quarantine "/Applications/범타듀 밸리.app"`.
  경고를 없애려면 Apple Developer Program($99/년) 가입 후 `desktop.yml`에서 주석 처리된
  `APPLE_CERTIFICATE`… 시크릿을 켜면 서명+공증(notarization)까지 자동으로 돼요.

### 자동 업데이트 켜기 (선택)

1. 키 생성: `npx tauri signer generate -w ~/.tauri/beomtadew.key` (비밀번호 설정).
2. 출력된 **공개 키**를 `tauri.conf.json → plugins.updater.pubkey`에 붙여 넣기
   (지금은 `REPLACE_WITH_…` 자리표시자).
3. 개인 키 파일 내용과 비밀번호를 저장소 시크릿
   `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`로 등록.
   **개인 키를 잃어버리면 기존 설치본은 더 이상 업데이트를 받을 수 없어요.**
4. `bundle.createUpdaterArtifacts`를 `true`로. (키 없이 `true`면 빌드가 실패해서 기본값은 `false`.)
5. 워크플로가 `latest.json`을 릴리스에 올리고, 앱은
   `https://github.com/junlee122-bot/our-six-island/releases/latest/download/latest.json`을
   확인해요. `latest`는 **공개된(초안 아님) 최신 릴리스**만 가리키니 Publish해야 반영돼요.
6. 게임 쪽에서는 `checkForDesktopUpdate()` → 사용자가 동의하면
   `checkForDesktopUpdate(true)`(다운로드·설치·재시작)를 호출하면 돼요.

참고: 게임 코드만 바뀌는 업데이트도 앱 재설치(업데이트)가 필요해요. 앱 안의 게임은
설치 파일에 들어 있는 `dist`라서, Pages에 배포해도 앱에는 반영되지 않아요.
서버(Edge Functions) 프로토콜을 바꿀 때는 구버전 앱 호환을 신경 써 주세요.

## 웹 전용 가정 점검 (앱 안에서 깨지거나 달라지는 것)

앱 안의 페이지 주소는 `tauri://localhost/index.html`(macOS) /
`http://tauri.localhost/index.html`(Windows)이에요. 이를 기준으로 점검했어요.

| # | 위치 | 웹에서의 가정 | 앱에서 생기는 일 | 권장 변경 | 상태 |
|---|---|---|---|---|---|
| 1 | `app/lounge/FriendsModal.tsx` (`link()`), `app/multiplayer-ui.tsx`, `app/theater-game.tsx` | 초대 링크 = `location.href` + `#lounge=코드` | `tauri://localhost/…#lounge=…` 링크가 복사돼 친구가 열 수 없음 | `shareableInviteUrl('lounge', code)` 사용 → 공개 웹 주소(`WEB_URL`) 기준 링크. 섬·극장도 앱에서는 `WEB_URL` 기준 | **연결됨** |
| 2 | `app/lounge-game.tsx:472` (`location.hash`의 `lounge=` 읽기), `app/lounge-cloud-room.ts:365-373` (`clearInviteHash`), `app/theater-game.tsx:17`, `app/island-game.tsx:40` | 초대 링크를 브라우저로 열면 해시로 방 코드 전달 | 앱은 항상 `index.html`로 시작해서 해시가 없음 → 링크로 앱 안의 방에 들어갈 수 없음(코드 직접 입력은 가능) | `tauri-plugin-deep-link`로 `beomtadew://lounge/<코드>` 등록 + single-instance의 `deep-link` 기능으로 실행 중인 앱에 전달(아래 "초대 딥 링크"). 웹 링크 페이지의 "앱으로 열기" 버튼은 아직 없음 | **구현됨**(실기기 확인 필요) |
| 3 | `app/lounge-auth.ts:5-12` (`persistSession: true`, `storageKey: 'hohyeon-auth-v1'`) | Supabase 세션(리프레시 토큰 포함)을 `localStorage`에 저장 | 앱 전용 웹뷰 저장소에 평문 저장(WebView2: `%LOCALAPPDATA%\io.github.junlee122bot.beomtadew\EBWebView`, macOS: `~/Library/WebKit/…`). 브라우저와 로그인 공유 안 됨 | `createClient`의 `auth.storage`에 OS 키체인 어댑터 전달: `tauri-plugin-keyring`(커뮤니티) 또는 Rust에서 `keyring` 크레이트로 `get/set/remove` 커맨드 3개 노출. `tauri-plugin-stronghold`는 비밀번호가 필요해 게임엔 과함. 7명 규모에선 현 상태도 수용 가능 | 권장만 |
| 4 | `app/lounge-settings.ts:69,79,117-123`, `app/lounge-cloud-save.ts:39,62,99-100,168`, `app/lounge/friend-looks.ts:15,37`, `app/lounge/LifePanels.tsx:173,180`, `app/lounge-game.tsx:318,326`, `app/lounge-wallet.ts:179`, `app/lounge/AccountModal.tsx:66` | `localStorage`에 설정·초안 저장·힌트 | 동작은 함. 다만 저장소가 **앱 origin 전용**이라 웹에서 쓰던 설정/로컬 초안은 안 넘어옴(계정 저장은 클라우드라 OK). `identifier`를 바꾸거나 Windows에서 `useHttpsScheme`을 바꾸면 origin이 바뀌어 전부 초기화 | `identifier`·스킴은 첫 배포 후 **절대 변경 금지**. 필요 시 `tauri-plugin-store`로 이전 | 문서화 |
| 5 | `app/lounge/ErrorBoundary.tsx:26-35` (`reloadOnce`), `app/lounge-game.tsx:275,1334`, `app/lounge/GameScreen.tsx:310` | 청크 로드 실패 = "새 배포가 올라옴" → 새로고침하면 해결 | 앱은 파일이 설치본에 있어 새로고침해도 같은 파일. 실패는 설치 손상일 가능성 | 앱에서는 자동 새로고침을 하지 않고 `DesktopRecovery`가 "업데이트 확인" → 새 버전 설치 또는 "앱 다시 시작"(`relaunchDesktopApp`)을 보여 줌. 저장 멈춤·일반 오류는 "다시 시작"(페이지 다시 불러오기, 앱에서도 동작) | **구현됨** |
| 6 | 서비스 워커 없음, `manifest.webmanifest` (`scripts/build-standalone.mjs:155-176`) | PWA 설치 메타데이터 | 서비스 워커가 없어서 문제 없음. 매니페스트는 무시됨 | 없음 | 확인 |
| 7 | 베이스 경로 `./` (`scripts/build-standalone.mjs:182`), OG 절대 URL (`:275,292`) | Pages 하위 경로 | `./`라 그대로 동작. `--site-url /`로 OG URL도 상대 경로로 | 없음 | `build:desktop`에 반영 |
| 8 | `app/lounge/feedback.ts:47-52` (`document.title`), `:66-71` (`tabHidden`), `app/lounge-cloud-room.ts:151,171` | 탭이 숨겨졌을 때만 제목 배지·알림, 숨김 탭은 느린 폴링 | 앱 창은 다른 창 뒤에 있어도 `visible` → 알림이 안 뜸. 제목 표시줄 반영은 플랫폼별로 다름 | `attention()`이 `document.hasFocus()`로 "창이 뒤에 있음"도 판단(웹에서도). 앱에서는 제목을 `setDesktopTitle()`로 | **연결됨** (폴링 속도는 그대로) |
| 9 | `app/lounge/feedback.ts:90-105`, `app/lounge/SettingsModal.tsx:42,97` | 웹 `Notification` API | notification 플러그인이 `window.Notification`을 대체해서 **그대로 동작**. 단 `onclick`(창 포커스)은 데스크톱에서 호출되지 않음 | 앱에서는 `desktopNotify()`(설정 → 알림 → 데스크톱 알림)와 `requestDesktopAttention()`(작업 표시줄 깜빡임/Dock 튕김, 설정에서 끌 수 있음)을 따로 호출. 권한은 `requestDesktopNotificationPermission()` | **연결됨** |
| 10 | (삭제됨) `navigator.vibrate` | 모바일 진동 | PC 전용이 되면서 진동 설정과 코드를 지웠어요 | 없음 | 삭제 |
| 11 | `app/lounge/CreditsModal.tsx:13…`, `app/lounge-village.tsx:2726`, `app/lounge-bedroom-3d.tsx:1287` (`target="_blank"`) | 새 탭 열기 | 웹뷰에선 아무 일도 안 일어남 | `desktop-init.js`가 가로채 기본 브라우저로 열기 (`openExternal()`도 제공) | **구현됨** |
| 12 | `app/lounge-account-ui.tsx:47-58`, `app/lounge-wardrobe.tsx:261-264`, `app/theater-game.tsx:33` (`<a download>` + `blob:`) | 브라우저 다운로드 | Windows는 동작, macOS WKWebView는 기본 처리 없음 | `lib.rs`의 `on_download`가 "다운로드" 폴더로 저장. macOS에서 `blob:` 다운로드 파일명이 제대로 나오는지 실기기 확인 필요 | **구현됨**(검증 필요) |
| 13 | `navigator.clipboard.writeText` (`app/lounge/FriendsModal.tsx:51`, `app/lounge-account-ui.tsx:80`) | 보안 컨텍스트 클립보드 | `tauri://`·`http://tauri.localhost` 모두 보안 컨텍스트로 취급되어 동작 (실패 시 기존 fallback 문구) | 필요하면 `tauri-plugin-clipboard-manager` | 확인 |
| 14 | `app/lounge-auth.ts:41` (`fetch …/functions/v1/…`), `app/multiplayer-transport.ts:6` (Realtime `wss://`) | 페이지 origin에서 CORS | Edge Functions가 `Access-Control-Allow-Origin: *` (`supabase/functions/_shared/server.ts:106`)라 앱 origin에서도 OK. CSP에 두 origin 허용됨 | Supabase 프로젝트를 바꾸면 CSP도 같이 | 구현됨 |
| 15 | 창 최소화 시 타이머 | 백그라운드 탭 스로틀링 | WebView2/macOS App Nap도 최소화 시 타이머를 늦춰 Realtime 하트비트가 끊길 수 있음 | 필요하면 `WebviewWindowBuilder::background_throttling(BackgroundThrottlingPolicy::Disabled)` 검토 | 권장만 |

## 연결 지점

`app/desktop-bridge.ts`의 함수는 브라우저에선 아무 일도 하지 않아서 웹 동작은 그대로예요.

- `scripts/standalone-entry.tsx`: 시작 시 `installDesktopShortcuts()` (셸이 이미 F11을 넣었으면 건너뜀).
  폰·태블릿(터치 전용이거나 화면 폭 800px 미만)은 게임 대신 "PC 게임이에요" 안내(`app/lounge/PcOnly.tsx`).
- `app/lounge/feedback.ts` `attention()`: 창이 뒤에 있으면(`document.hasFocus()`) 제목 배지,
  앱에서는 `desktopNotify()` + `requestDesktopAttention()`.
- `app/lounge/SettingsModal.tsx`: 알림 토글 → `requestDesktopNotificationPermission()`,
  화면 탭의 창 모드/전체 화면 → `app/lounge-display.ts` → `setDesktopFullscreen()`.
- `app/lounge/SystemMenu.tsx` (Esc 메뉴): 전체 화면 전환, 앱에서는 "게임 끝내기" → 저장 후 `closeDesktopWindow()`.
- `app/lounge-cloud-save.ts`: 앱에서는 `beforeunload` 대신 `onDesktopCloseRequested()`로 저장 후 닫기.
- `app/lounge/ErrorBoundary.tsx`: 파일 로드 실패 시 `DesktopRecovery`(업데이트 확인·앱 다시 시작).
- `app/lounge/FriendsModal.tsx`, `app/multiplayer-ui.tsx`, `app/theater-game.tsx`: 공개 웹 주소 기준 초대 링크.
- `app/lounge-game.tsx`: `takeDesktopLaunchCode()`(앱을 연 초대 링크)와 `onDesktopDeepLink()`(실행 중에 받은 링크).
- 아직 게임 안 버튼이 없는 것: "업데이트 확인"(`checkForDesktopUpdate()`)은 오류 화면에서만 보여요.

## 초대 딥 링크 (`beomtadew://lounge/<코드>`)

- 설정: `Cargo.toml`에 `tauri-plugin-deep-link = "2"`와 single-instance의 `deep-link` 기능,
  `tauri.conf.json → plugins.deep-link.desktop.schemes: ["beomtadew"]`. 설치 파일(NSIS/MSI, .app)이
  스킴을 OS에 등록해요. Windows·Linux 개발 실행(`desktop:dev`)은 `lib.rs`가 `register_all()`로 등록해요.
- 흐름: `src/lib.rs`
  - 앱이 링크로 **처음 실행**되면 `deep_link().get_current()`로 받은 링크를 초기화 스크립트로
    `window.__BEOMTADEW_LAUNCH_LINK__`에 넣어요. 로그인 뒤 `lounge-game.tsx`가 웹 초대의
    `#lounge=` 해시처럼 그 방으로 들어가요.
  - **실행 중**에 링크를 열면(Windows/Linux는 두 번째 실행 → single-instance가 전달, macOS는
    open-url 이벤트) `on_open_url` → `beomtadew:deep-link` 창 이벤트 → `room.switchTo(code)`.
    게임 중이면 바로 옮기지 않고 안내만 해요. 로그인 화면이면 로그인 직후에 써요.
- 링크 형식과 검증: `deepLinkCode()` (`beomtadew://lounge/<코드>`, `beomtadew://lounge=<코드>`,
  `…#lounge=<코드>` 모두 허용, 코드는 영문 대문자·숫자 4–16자).
- 남은 일(사용자 결정): 웹 초대 링크를 연 친구에게 "앱으로 열기"(`beomtadew://lounge/<코드>`)
  버튼을 보여 줄지. 지금 공유되는 링크는 모두 공개 웹 주소예요.
- 확인 필요: macOS에서 앱이 꺼져 있을 때 링크로 처음 실행하는 경우(이벤트가 창 준비 전에 오면
  `get_current()`가 비어 있을 수 있음). 이 저장소 환경에서는 `cargo check`까지만 확인했어요.

## 권한 (capabilities/default.json)

`core:default`, 창 전체 화면/제목/포커스/주의 요청/닫기(`allow-close`, `allow-destroy`), `notification:default`,
`opener:default`(http/https/mailto만), `updater:default`, `process:allow-restart`.
새 네이티브 기능을 쓰면 여기에 권한을 추가해야 해요(없으면 JS 호출이 거부됨).
