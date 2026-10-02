// The five district gates on the hub's rim (lounge-districts.ts): a timber
// gate with a hand-lettered board naming the district and its road. The open
// gate (시장 거리) stands wide with lanterns; a locked one has a rope across
// and a small sign that says what opens it. Procedural pieces only, in the
// valley's warm low-poly palette. No React.
import * as THREE from 'three';
import { DISTRICTS, DISTRICT_IDS, HUB_SIGNPOST, districtOpen, type DistrictId } from './lounge-districts';

const FONT = '"Jua", "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const mat = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0 });

function boardTexture(lines: string[], open: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const c = canvas.getContext('2d');
  if (c) {
    c.fillStyle = open ? '#e9d3a6' : '#cbbfa8';
    c.fillRect(0, 0, 512, 192);
    c.strokeStyle = open ? '#8a6440' : '#6f6558';
    c.lineWidth = 10;
    c.strokeRect(6, 6, 500, 180);
    c.fillStyle = '#3c2716';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `62px ${FONT}`;
    c.fillText(lines[0], 256, 70);
    c.font = `28px ${FONT}`;
    c.fillText(lines[1] ?? '', 256, 142, 480);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export class VillageDistrictGates {
  readonly root = new THREE.Group();
  private disposables: { dispose: () => void }[] = [];
  private glows: THREE.Mesh[] = [];
  private gates = new Map<DistrictId, { group: THREE.Group; key: string; own: { dispose: () => void }[] }>();

  constructor(parent: THREE.Object3D) {
    this.root.name = 'district-gates';
    for (const id of DISTRICT_IDS) this.build(id, districtOpen(id), DISTRICTS[id].hint);
    this.buildSignpost();
    parent.add(this.root);
  }
  /**
   * The village's opened districts and the live progress of the locked ones
   * ("박물관 물고기 7/12종"). A gate is rebuilt only when its state changed.
   * Returns true when something changed.
   */
  setState(state: Partial<Record<DistrictId, { open: boolean; progress: string }>>) {
    let changed = false;
    for (const id of DISTRICT_IDS) {
      const st = state[id];
      if (!st) continue;
      const line = st.open ? '' : st.progress ? `${DISTRICTS[id].hint} · ${st.progress}` : DISTRICTS[id].hint;
      if (this.gates.get(id)?.key === `${st.open}|${line}`) continue;
      this.build(id, st.open, line);
      changed = true;
    }
    return changed;
  }
  private own<T extends { dispose: () => void }>(x: T) {
    this.disposables.push(x);
    return x;
  }
  private build(id: DistrictId, open: boolean, hint: string) {
    const d = DISTRICTS[id];
    const old = this.gates.get(id);
    if (old) {
      old.group.removeFromParent();
      for (const x of old.own) x.dispose();
      this.glows = this.glows.filter((m) => !old.group.children.includes(m));
    }
    const start = this.disposables.length;
    const g = new THREE.Group();
    g.name = 'district-gate-' + id;
    const wood = this.own(mat(open ? '#7a5534' : '#6b5845'));
    const post = this.own(new THREE.BoxGeometry(0.22, 2.6, 0.22));
    for (const x of [-1.5, 1.5]) {
      const m = new THREE.Mesh(post, wood);
      m.position.set(x, 1.3, 0);
      m.castShadow = true;
      g.add(m);
    }
    const beam = new THREE.Mesh(this.own(new THREE.BoxGeometry(3.6, 0.22, 0.26)), wood);
    beam.position.set(0, 2.5, 0);
    beam.castShadow = true;
    const board = new THREE.Mesh(
      this.own(new THREE.PlaneGeometry(2.2, 0.82)),
      this.own(new THREE.MeshBasicMaterial({ map: this.own(boardTexture([`${d.no ? `${d.no}. ` : ''}${d.name}`, open ? `${d.gate.road} · ${d.tagline}` : hint], open)), toneMapped: false, side: THREE.DoubleSide })),
    );
    board.position.set(0, 2.05, 0.14);
    // The board always turns toward the camera (straight down −z, 구역 공통 규격) so it reads the right way round.
    board.rotation.y = -d.gate.rot;
    g.add(beam, board);
    if (open) {
      for (const x of [-1.5, 1.5]) {
        const glow = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.13, 10, 8)), this.own(new THREE.MeshBasicMaterial({ color: '#ffd98a' })));
        glow.position.set(x, 2.78, 0);
        this.glows.push(glow);
        g.add(glow);
      }
    } else {
      // A rope across the opening, sagging a little.
      const rope = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.035, 0.035, 3, 6)), this.own(mat('#b79a6a')));
      rope.rotation.z = Math.PI / 2;
      rope.position.set(0, 0.9, 0.05);
      g.add(rope);
    }
    // Face into the hub.
    g.position.set(d.gate.x, 0.03, d.gate.z);
    g.rotation.y = d.gate.rot;
    this.root.add(g);
    this.gates.set(id, { group: g, key: `${open}|${open ? '' : hint}`, own: this.disposables.splice(start) });
  }
  /** 친구에게 가기: a finger post beside the plaza board. */
  private buildSignpost() {
    const g = new THREE.Group();
    g.name = 'hub-signpost';
    const wood = this.own(mat('#7a5534'));
    const post = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.14, 1.9, 0.14)), wood);
    post.position.y = 0.95;
    post.castShadow = true;
    const board = new THREE.Mesh(
      this.own(new THREE.PlaneGeometry(1.5, 0.56)),
      this.own(new THREE.MeshBasicMaterial({ map: this.own(boardTexture(['친구에게 가기', '가 본 구역 입구로'], true)), toneMapped: false, side: THREE.DoubleSide })),
    );
    board.position.set(0, 1.62, 0.09);
    g.add(post, board);
    g.position.set(HUB_SIGNPOST.x, 0.03, HUB_SIGNPOST.z - 0.6);
    this.root.add(g);
  }
  /** Lanterns glow at night. */
  setNight(night: boolean) {
    for (const glow of this.glows) (glow.material as THREE.MeshBasicMaterial).color.set(night ? '#ffd98a' : '#b8a27a');
  }
  dispose() {
    for (const g of this.gates.values()) for (const d of g.own) d.dispose();
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
    this.root.removeFromParent();
  }
}
