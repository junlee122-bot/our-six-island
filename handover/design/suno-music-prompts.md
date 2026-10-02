# Suno 음악 프롬프트 (2026-10-03)

게임에는 음악 슬롯 9개가 있다(`app/lounge-music-tracks.ts:9-10`). 지금은 전부 코드로 만든 합성음이 대신 나온다.
이 문서는 슬롯마다 Suno에 넣을 프롬프트와, 만든 파일을 게임에 넣는 방법을 정리한다.

## 0. Suno에서 공통으로 할 것

- **Custom 모드**를 쓰고 **Instrumental**을 켠다. 가사 칸은 비워 둔다.
- **Style 칸**에는 아래 영어 문장을 그대로 붙여 넣는다. Suno는 영어 장르·악기 단어를 가장 잘 알아듣는다.
- **Exclude styles**(v4.5 이상)에는 공통으로 아래를 넣는다.
  `vocals, choir, lyrics, spoken word, EDM drop, dubstep, heavy distorted guitar, trap hi-hats, fade out`
- **길이·고르기**: 2:00~3:00으로 만들고, 한 프롬프트에서 4~6곡을 뽑아 고른다. 고르는 기준은 셋이다.
  1. 처음 5초가 바로 본론인지(긴 인트로가 없을 것).
  2. 끝이 페이드아웃 없이 끝나는지.
  3. 박자가 처음부터 끝까지 일정한지(루프용).
- **통일감 만들기**: 마을 테마(`village`)를 먼저 하나 확정한다. 그다음 다른 슬롯은 그 곡을 **Cover**(또는 Persona)로 편곡해서 만든다.
  - 지역마다 악기와 리듬은 달라도 같은 선율이 흐르면 하나의 게임처럼 들린다.
  - 이 기능을 쓸 수 없는 요금제면 Style 문장만으로 만들어도 된다.
- **이름 쓰지 않기**: 실제 가수·곡·영화 이름은 쓰지 않는다(`ASSETS.md` 규칙).
  - '타짜 느낌'은 이름 대신 분위기 단어로 쓴다.
- **권리**: 유료 요금제에서 만든 곡만 쓴다. 상업 이용 권리 때문이다.

## 1. 지금 있는 슬롯 9개

| 슬롯 | 쓰이는 곳 |
| --- | --- |
| `casino` | 카지노, 체스·포커·블랙잭 테이블 |
| `hall` | 회관, 미용실·은행, 섯다·고스톱·요트·라이어 테이블 |
| `tavern` | 허풍 주점(라이어스 바) |
| `market` | ① 시장 거리 |
| `harbor` | ② 항구 |
| `hillside` | ③ 언덕 주택가 |
| `ranch` | ④ 목장·과수원 |
| `foothill` | ⑤ 산기슭 마을 |
| `offshore` | 먼바다 배 위 |

### `casino` — 카지노
```
Instrumental noir tango for a cozy game casino, 104 BPM, D minor, bandoneon lead, pizzicato strings, upright bass, brushed snare, low piano stabs, a hint of gayageum glissando, sly and stylish 1970s Korean gambling-film mood, tense but playful, steady tempo, seamless loop, no fade out
```

### `hall` — 회관
```
Instrumental warm Korean folk-fusion for a village community hall, 12/8 gutgeori rhythm on janggu, gayageum and daegeum melody over soft acoustic guitar and light strings, cheerful, festive yet relaxed, like neighbors gathering for card games, steady tempo, seamless loop, no fade out
```

### `tavern` — 허풍 주점 (기존 설계 문서 `design-tavern.md:461` 문장을 다듬음)
```
Instrumental cozy smoky harbor tavern, slow swing shuffle 88 BPM, upright bass, brushed snare, slightly out-of-tune honky-tonk piano, accordion, soft gayageum plucks as accents, warm, playful and a little mischievous, bluffing card game mood, steady tempo, seamless loop, no fade out
```

### `market` — ① 시장 거리
```
Instrumental bustling village market polka, 120 BPM, G major, accordion and fiddle lead, ukulele strums, glockenspiel sparkles, light hand percussion, a short haegeum phrase, busy friendly shoppers, bright morning energy, cozy farming game soundtrack, steady tempo, seamless loop, no fade out
```

### `harbor` — ② 항구
```
Instrumental seaside harbor waltz, 3/4 at 132 BPM, A dorian, nylon guitar and accordion, soft flute, gentle marimba, light shaker like lapping waves, breezy, nostalgic, salty air and seagulls, cozy farming game soundtrack, steady tempo, seamless loop, no fade out
```

### `hillside` — ③ 언덕 주택가
```
Instrumental peaceful pastoral, 72 BPM, F major, felt piano and acoustic guitar fingerpicking, warm cello pad, soft daegeum melody, quiet residential hillside at golden hour, calm, homely and a little wistful, cozy life-sim soundtrack, steady tempo, seamless loop, no fade out
```

### `ranch` — ④ 목장·과수원
```
Instrumental cheerful ranch and orchard tune, 6/8 at 104 BPM, D major, banjo and mandolin, whistled melody, tin whistle, upright bass, light woodblock clip-clop rhythm, sunny fields, cows and apple trees, bouncy and wholesome, cozy farming game soundtrack, steady tempo, seamless loop, no fade out
```

### `foothill` — ⑤ 산기슭 마을
```
Instrumental mountain foothill work song, 92 BPM, D dorian, janggu and buk drum groove, haegeum and daegeum melody, acoustic guitar, low male hum-like synth pad without words, sturdy, earthy, miners and woodcutters heading up the trail, hopeful, steady tempo, seamless loop, no fade out
```

### `offshore` — 먼바다 배 위
```
Instrumental gentle sea shanty, 84 BPM, D minor to F major lift, concertina and fiddle, low tom drum like a ship's heartbeat, creaking rhythm, wide strings swell, open ocean adventure, brave but cozy, fishing boat at sea, steady tempo, seamless loop, no fade out
```

## 2. 새로 추가하면 좋은 슬롯 (코드 연결 필요)

지금 마을 광장, 뒷산, 숲, 광산은 코드로 만든 오르골 소리만 난다. 그런데 가장 오래 듣는 곳이 마을 광장이라, 효과가 제일 크다.
새 슬롯은 `MUSIC_TRACKS`에 추가하고 `AREA_SOUND`·마을 화면에 연결하는 작업이 필요하다(코드 작업 1회).

### `village` — 마을 광장 (낮) — **메인 테마, 가장 먼저 만들 곡**
```
Instrumental main theme for a cozy Korean countryside life-sim village, 96 BPM, C major, memorable gentle melody on gayageum doubled by glockenspiel, acoustic guitar, soft strings, light janggu and shaker, warm sunshine, friends living together in one small village, nostalgic and hopeful, steady tempo, seamless loop, no fade out
```

### `village-night` — 마을 광장 (밤)
```
Instrumental night version of a cozy village theme, 70 BPM, A minor, music box and felt piano, soft daegeum breath, warm pad, crickets-like light percussion, starry quiet streets, lanterns glowing, sleepy and tender, steady tempo, seamless loop, no fade out
```

### `woods` — 뒷산·깊은 숲
```
Instrumental enchanted forest wander, 80 BPM, E minor, kalimba and harp arpeggios, soft daegeum, airy strings, gentle hand drum, dappled light through tall trees, curious and slightly mysterious, cozy exploration, steady tempo, seamless loop, no fade out
```

### `mine` — 광산
```
Instrumental cozy cave exploration, 90 BPM, D minor, plucked gayageum ostinato, marimba, deep bass drone, metallic chimes like pickaxe sparks, water drip percussion, mysterious but not scary, steady tempo, seamless loop, no fade out
```

### `mine-deep` — 광산 21~30층·수정 동굴 (4막)
```
Instrumental glittering crystal cavern, 76 BPM, F sharp minor, celesta and vibraphone, shimmering reverb, slow taiko pulse, soft choir-like synth pad without words, wonder and quiet danger, deep underground starlight, steady tempo, seamless loop, no fade out
```

### `festival` — 축제(추석·꽃놀이)
```
Instrumental joyful Korean harvest festival, 128 BPM, G major, samulnori percussion groove with kkwaenggwari and janggu, taepyeongso-like bright lead, gayageum, cheerful brass hits, crowds celebrating under lanterns, energetic and warm, steady tempo, seamless loop, no fade out
```

### `onsen` — 온천 마을 (2막)
```
Instrumental hot spring village relaxation, 66 BPM, B flat major, koto-like plucks and gayageum, soft flute, warm rhodes piano, gentle water ambience-like percussion, steam rising in snowy mountains, deeply calm, steady tempo, seamless loop, no fade out
```

### `island` — 여섯섬 (3막)
```
Instrumental tropical island adventure, 108 BPM, E major, steel drum and ukulele, marimba, light congas, bright flute, a gayageum phrase from the village theme, turquoise sea and palm shade, sunny and adventurous, steady tempo, seamless loop, no fade out
```

### `lighthouse` — 등대 점화 결말 장면 (1회용, 루프 아님)
```
Instrumental emotional finale, 2 minutes, starts with solo gayageum playing the village theme, builds with strings, piano and gentle drums into a warm full orchestral climax, friends lighting an old lighthouse together, tears and smiles, ends with a soft resolved chord
```
- 이 곡은 루프가 아니라 끝맺음이 필요하다. 이 슬롯은 Exclude 칸에서 `fade out`을 빼도 된다.

### `day-end` — 하루 마감 결산 징글 (5~8초)
- Suno는 짧은 곡을 만들기 어렵다. 30초짜리를 만든 뒤 앞 6초만 잘라 쓴다.
```
Instrumental short cozy jingle, music box and glockenspiel with soft gayageum, gentle rising melody resolving to a warm major chord, end of a good day, 6 seconds
```

## 3. 게임에 넣는 법

1. 고른 곡을 `public/assets/lounge/music/<슬롯>.ogg`와 `.mp3`로 저장한다.
   - OGG가 기본이다(이음새 없는 루프). MP3는 사파리용이다.
2. 음량은 −16 LUFS, 피크는 −1.5 dBTP로 맞춘다. ffmpeg 명령은 `ASSETS.md:563-574`에 있다.
3. **루프 구간**: 곡 안에서 마디가 딱 맞는 시작·끝 지점(초)을 찾아 `MUSIC_TRACKS`의 `loopStart`/`loopEnd`에 적는다. Suno 곡의 인트로와 아웃트로는 이 방법으로 건너뛴다.
4. 곡마다 `<슬롯>.prompt.txt`를 남긴다. 적을 것: 서비스, 날짜, 위 프롬프트, 요금제(권리).
5. **파일만 넘겨주면** 연결, 음량 맞추기, 루프 구간 찾기는 내가 한다.
   - 기존 9개 슬롯은 경로만 넣으면 된다.
   - 새 슬롯은 코드 연결이 필요하다.

## 4. 추천 만드는 순서

1. `village` (메인 테마, 가장 오래 듣는 곳)
2. `casino`, `hall`, `tavern` (원래 계획했던 3곡)
3. `village-night`, `market`, `harbor`
4. 나머지 지역과 `day-end` 징글
5. 2막·3막 지역이 생길 때 `onsen`, `island`, `lighthouse`
