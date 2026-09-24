# 범타듀 밸리에서 이 스킬을 쓰는 방법

출처: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT, LICENSE 동봉)

이 게임은 웹 랜딩페이지나 SaaS가 아니라 3D 마을 + 2D 캐릭터 소셜 게임입니다.

- 쓰는 것: `data/ux-guidelines.csv`(접근성·터치·애니메이션·피드백·성능 점검표), `data/stacks/threejs.csv`, `data/stacks/react.csv`, `data/motion.csv`(전환 200–300ms, 누름 150–200ms 기준), `colors.csv`의 Card & Board Game 행(카지노·회관 테이블 톤), `typography.csv`의 Korean Modern(Noto Sans KR).
- 쓰지 않는 것: `--design-system` 자동 생성 결과(랜딩페이지 구조와 SaaS 색을 추천함), 랜딩·차트 패턴.
- 게임 쪽 규칙이 우선: 월드는 항상 전체 화면, HUD 배치는 README의 "게임 화면 흐름"을 따름, 한국어 UI는 `app/lounge-text.ts`의 josa/NAMES/formatBeom 사용, 글자 11px 이상, 터치 44px 이상.
