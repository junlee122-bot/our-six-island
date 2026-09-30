// ③ 언덕 주택가 in three.js, on the district kit (lounge-district-kit.ts, 구역
// 공통 규격): a house per resident who lives up here — the hub's own house
// models (자료: kArchive · 출처: 쓰레드 dogfooter) with a name board by each
// door — the 도서관 (kArchive museum-library), the 청년 자취방 (a duplex with two
// name boards), 츠나데's fenced 텃밭 with decorative crops drawn by the farm's
// own 3D stages (lounge-farm-3d.ts), and a small park with a pergola, benches
// and a picnic table. Layout: lounge-hillside-layout.ts. No React.
import * as THREE from 'three';
import {
  HILL_BENCHES,
  HILL_BOARD,
  HILL_GARDEN,
  HILL_GARDEN_BEDS,
  HILL_HOUSES,
  HILL_LAMPS,
  HILL_LIBRARY,
  HILL_PARK,
  HILL_PERGOLA,
  HILL_TREES,
  HILL_YOUTH,
  HILLSIDE_D,
  HILLSIDE_EXIT,
  HILLSIDE_PAVING,
  HILLSIDE_W,
} from './lounge-hillside-layout';
import { HILLSIDE_MODEL_URLS } from './lounge-district-models';
import { DistrictSet, PAVING, districtMat, shadowed } from './lounge-district-kit';
import { NPCS, isNpcId } from './lounge-npc-data';
import { isNewCrop, newCropShapes, type Instance } from './lounge-farm-3d';

export class HillsideSet extends DistrictSet {
  constructor(look: { ground: string; groundFar: string }) {
    super('hillside', HILLSIDE_MODEL_URLS);
    this.ground(HILLSIDE_W, HILLSIDE_D, look);
    for (const p of HILLSIDE_PAVING) this.pave(p, p.tone === 'plaza' ? PAVING.plaza : p.tone === 'stair' ? PAVING.stone : PAVING.lane);
    for (const h of HILL_HOUSES) this.buildHouse(h);
    this.buildYouth();
    this.buildLibrary();
    this.buildGarden();
    this.buildPark();
    this.buildEdge();
  }

  private nameBoard(text: string, x: number, z: number, color: { bg: string; ink: string; line: string }, name: string) {
    this.signpost(text, '', color, x, z, { w: 1.7, h: 1.5, name });
  }

  private buildHouse(h: (typeof HILL_HOUSES)[number]) {
    this.place(h.model, h.x, h.z, { w: h.w - 0.3, h: h.h, d: h.d - 0.3 }, 0, 'hill-' + h.id);
    const who = isNpcId(h.npc) ? NPCS[h.npc].name : h.npc;
    this.nameBoard(`${who}네 집`, h.door.x + 1.6, h.door.z - 0.5, h.sign, 'hill-sign-' + h.id);
    this.place('hydrangea', h.x - h.w / 2 + 0.7, h.z + h.d / 2 + 0.4, { w: 0.9, h: 0.85, d: 0.8 }, 0, 'hill-flower-' + h.id);
  }

  private buildYouth() {
    const y = HILL_YOUTH;
    this.place(y.model, y.x, y.z, { w: y.w - 0.3, h: y.h, d: y.d - 0.3 }, 0, 'hill-youth');
    this.signpost(y.name, '힘멜 · 야니네코', { bg: '#eef0f4', ink: '#2c3c56', line: '#7486a8' }, y.x - y.w / 2 - 0.2, y.door.z - 0.5, { w: 2, h: 1.7, name: 'hill-sign-youth' });
  }

  private buildLibrary() {
    const L = HILL_LIBRARY;
    this.place('museumLibrary', L.x, L.z, { w: L.w - 0.3, h: L.h, d: L.d - 0.3 }, 0, 'hill-library');
    this.signpost(L.name, L.sub, { bg: '#f1e8f2', ink: '#4f2c55', line: '#9a6fa3' }, L.x + L.w / 2 - 1.2, L.z + L.d / 2 + 0.6, { name: 'hill-sign-library' });
  }

  private buildGarden() {
    const G = HILL_GARDEN;
    // Fence on three sides (the gate side stays open), soil beds, a scarecrow and a pump.
    for (const [i, [x, z, w, r]] of ([
      [G.x, G.z - G.d / 2, G.w, 0],
      [G.x - G.w / 2, G.z, G.d, Math.PI / 2],
      [G.x + G.w / 2, G.z, G.d, Math.PI / 2],
    ] as const).entries())
      this.place('picketFence', x, z, { w: r ? 0.3 : w, h: 0.8, d: r ? w : 0.3 }, 0, 'hill-fence-' + i);
    const shapes: Instance[] = [];
    const tmp = new THREE.Matrix4();
    for (const [i, b] of HILL_GARDEN_BEDS.entries()) {
      const soil = this.box(2, 0.16, 1.2, '#6a452b');
      soil.position.set(b.x, 0.08, b.z);
      this.root.add(shadowed(soil, false));
      if (!isNewCrop(b.crop)) continue;
      for (let t = 0; t < 3; t++) {
        const local: Instance[] = [];
        newCropShapes(local, b.crop, b.stage, i * 7 + t);
        tmp.makeTranslation(b.x - 0.62 + t * 0.62, 0.16, b.z);
        for (const s of local) shapes.push({ ...s, m: tmp.clone().multiply(s.m) });
      }
    }
    // One instanced mesh per geometry/material pair.
    const groups = new Map<string, Instance[]>();
    for (const s of shapes) {
      const k = s.geo.uuid + s.mat.uuid;
      groups.set(k, [...(groups.get(k) ?? []), s]);
    }
    for (const list of groups.values()) {
      const mesh = new THREE.InstancedMesh(list[0].geo, list[0].mat, list.length);
      list.forEach((s, i) => mesh.setMatrixAt(i, s.m));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = 'hill-garden-crops';
      this.own({ dispose: () => mesh.dispose() });
      this.root.add(mesh);
    }
    this.place('scarecrow', G.x + G.w / 2 - 0.8, G.z - G.d / 2 + 0.8, { w: 1, h: 1.8, d: 0.6 }, 0.3, 'hill-scarecrow');
    this.place('waterPump', G.x - G.w / 2 + 0.7, G.z - G.d / 2 + 0.7, { w: 0.6, h: 1.2, d: 0.6 }, 0, 'hill-pump');
    this.signpost('츠나데 텃밭', '제철 채소 · 약초', { bg: '#e8f0dc', ink: '#2f5a3a', line: '#6f9a58' }, G.x + G.w / 2 + 0.9, G.z + G.d / 2 + 0.4, { w: 2, h: 1.6, name: 'hill-sign-garden' });
  }

  private buildPark() {
    const P = HILL_PARK;
    for (const b of HILL_BENCHES) this.place('parkBench', b.x, b.z, { w: b.w, h: 1.1, d: b.d }, 0, 'hill-' + b.id);
    this.place('wisteriaPergola', HILL_PERGOLA.x, HILL_PERGOLA.z, { w: HILL_PERGOLA.w, h: 2.6, d: HILL_PERGOLA.d }, 0, 'hill-pergola');
    this.place('noticeBoard', HILL_BOARD.x, HILL_BOARD.z, { w: HILL_BOARD.w, h: 1.4, d: HILL_BOARD.d }, 0, 'hill-board');
    // Flower beds round the park.
    const colors = ['#e8a0b4', '#f2d06b', '#b9d98a', '#a8c4e8'];
    for (let i = 0; i < 10; i++) {
      const f = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.14, 8, 6)), this.own(districtMat(colors[i % colors.length])));
      f.position.set(P.x - P.w / 2 + 0.4 + (i % 5) * ((P.w - 0.8) / 4), 0.14, i < 5 ? P.z - P.d / 2 - 0.3 : P.z + P.d / 2 + 0.3);
      this.root.add(f);
    }
    HILL_LAMPS.forEach((l, i) => this.gardenLamp(l.x, l.z, i));
  }

  private buildEdge() {
    for (const [i, t] of HILL_TREES.entries()) this.tree(t.x, t.z, t.s, !!t.pine, i);
    this.plantRing(this.ring(HILLSIDE_W, HILLSIDE_D, { side: 'e', z: HILLSIDE_EXIT.z }));
    // Stone steps down to the hub on the east edge.
    for (let i = 0; i < 4; i++) {
      const step = this.box(0.6, 0.12, 2.8, '#b3a792');
      step.position.set(HILLSIDE_W / 2 - 0.3 - i * 0.6, 0.06 + (3 - i) * 0.04, HILLSIDE_EXIT.z);
      this.root.add(shadowed(step, false));
    }
    this.signpost('친구에게 가기', '마을 중심은 동쪽 계단', { bg: '#c49a62', ink: '#3c2716', line: '#7d5a36' }, HILLSIDE_EXIT.x - 1.2, HILLSIDE_EXIT.z - 2.3, { w: 1.6, h: 1.4, name: 'hill-road-sign' });
  }
}
