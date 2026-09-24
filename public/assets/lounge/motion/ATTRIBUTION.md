# 일곱 친구의 걷기·달리기

- 사용자 제공 프로젝트: [Wanted AI Championship 1641](https://event.wanted.co.kr/ai-championship/2026/projects/1641), **spritegen: 이미지 한장으로 완벽한 걷기와 뛰기를 포함한 스프라이트 만들기**.
- 연결 서비스: https://spritegen.kumastudio.app
- 제작 파이프라인: [aldegad/sprite-gen](https://github.com/aldegad/sprite-gen), v2.7.0, commit `d8a1ce178e0399ad8c97f70efda41f815836c5bb`.
- sprite-gen Copyright 2026 Alex Kim, Apache-2.0. 원문 LICENSE·NOTICE를 함께 보관합니다. 런타임에 sprite-gen 서버/API를 호출하지 않습니다.

그림은 게임의 기존 `club-friends-classic.webp`를 참고해 OpenAI 내장 이미지 생성 도구로 새로 제작했습니다. Sprite-gen의 prepare → component extraction → extract → compose-atlas → compose-gif → inspect / inspect-motion을 실제 사용했습니다. Sprite-gen의 외부 유료 생성 명령은 호출하지 않았습니다.

배열 순서는 도원·강재·민서·승준·민재·재민·호현입니다. 각 WebP는 1920×800, 걷기 6장·달리기 6장, 프레임 셀 320×400입니다. 모든 셀에 16px 안전 여백을 두고 캐릭터별 공통 원본 배율을 적용했습니다. WebP 디코딩 픽셀은 최종 PNG와 같습니다. 원본 생성 ID·SHA256·최종 파일 해시·QA 요약은 `generation.json`, 정확한 사용 사각형은 `app/lounge-motion-layout.json`에 기록합니다.

기본 코디에 새 프레임을 사용합니다. 다른 의상·만두머리는 기존 그림을 유지하는 연속 보행 변형을 사용하고, 기존 original 코디는 기존 보행 프레임을 유지합니다. 피부·머리 색, 모자·안경·머리띠는 프레임마다 게임에서 합성합니다.

일부 원화의 유사 자세와 웅크린 포즈의 크기 차이는 남아 있습니다. inspect-motion은 민재 달리기의 실루엣 유사 프레임 1쌍을 보고했습니다. 발 접촉점·한쪽 발 ROI를 추측하지 않았으므로 14개 행의 `stride_verified`는 모두 false입니다. 이동 거리에 맞춘 재생 속도는 게임의 조작 규칙이며, 원화의 실제 보폭을 계측했다는 의미가 아닙니다.
