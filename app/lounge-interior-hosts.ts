/**
 * The table hosts in the 3D hall and casino: 루미 deals hold'em and blackjack,
 * 매화 runs 섯다 and 고스톱. Each stands at her table's end as an illustrated
 * billboard facing the camera (like the friends' figures), cut from the host's
 * pose sheet by UV (one texture per host, shared by her tables), breathes a
 * little, and changes pose with her table (lounge-host-sprites.ts hostPose).
 */
import * as THREE from 'three';
import type { GameKind } from './lounge-games';
import {
  HOST_CELL,
  HOST_SHEET,
  hostCell,
  hostPose,
  type HostId,
  type HostPose,
} from './lounge-host-sprites';
import { hostStand, type InteriorTable } from './lounge-interior-layout';
import type { TablePhase } from './lounge-table-state';

/** Height of the calm figure (world units): a friend's figure is about as tall. */
export const HOST_FIGURE_HEIGHT = 1.64;

type Host = {
  game: GameKind;
  table: InteriorTable;
  seats: number;
  id: HostId;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  shadow: THREE.Mesh;
  pose: HostPose | null;
  phase: TablePhase | null;
  since: number;
  lift: number;
  seed: number;
};

export function createInteriorHosts(
  scene: THREE.Scene,
  tables: readonly InteriorTable[],
  view: {
    /** The billboards turn with the camera's yaw. */
    yaw: number;
    /** Vertical foreshortening of an upright plane on screen (camera up · y). */
    squash: number;
    shadow: { geometry: THREE.BufferGeometry; material: THREE.Material };
    /** A sheet arrived: render again. */
    onLoad: () => void;
  },
) {
  const cellH = (HOST_FIGURE_HEIGHT * HOST_CELL.h) / HOST_CELL.figure;
  const cellW = cellH * view.squash * (HOST_CELL.w / HOST_CELL.h);
  const sheetW = HOST_CELL.w * HOST_CELL.cols,
    sheetH = HOST_CELL.h * HOST_CELL.rows;
  const materials = new Map<HostId, THREE.MeshBasicMaterial>();
  const textures: THREE.Texture[] = [];
  const loader = new THREE.TextureLoader();
  let disposed = false;
  const materialFor = (id: HostId) => {
    let material = materials.get(id);
    if (material) return material;
    material = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.1, toneMapped: false });
    material.visible = false;
    materials.set(id, material);
    const m = material;
    loader.load(
      HOST_SHEET[id],
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        textures.push(texture);
        m.map = texture;
        m.visible = true;
        m.needsUpdate = true;
        view.onLoad();
      },
      undefined,
      () => {
        /* Without the sheet the table simply has no host figure. */
      },
    );
    return material;
  };

  const hosts: Host[] = [];
  tables.forEach((table, i) => {
    if (!table.host || !table.hostAt) return;
    const geometry = new THREE.PlaneGeometry(cellW, cellH);
    // Soles on the ground: the cell's foot line sits at y = 0.
    geometry.translate(0, cellH / 2 - (cellH * (HOST_CELL.h - HOST_CELL.foot)) / HOST_CELL.h, 0);
    const mesh = new THREE.Mesh(geometry, materialFor(table.host));
    mesh.name = 'host-' + table.host;
    mesh.rotation.y = view.yaw;
    mesh.position.set(table.hostAt.x, 0.02, table.hostAt.z);
    const shadow = new THREE.Mesh(view.shadow.geometry, view.shadow.material);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(table.hostAt.x, 0.035, table.hostAt.z);
    shadow.scale.set(1.15, 1.1, 1);
    shadow.renderOrder = 1;
    scene.add(mesh, shadow);
    hosts.push({ game: table.game, table, seats: 0, id: table.host, mesh, shadow, pose: null, phase: null, since: 0, lift: 0, seed: i });
  });

  const showPose = (host: Host, pose: HostPose) => {
    const cell = hostCell(pose);
    const u0 = cell.x / sheetW,
      u1 = (cell.x + HOST_CELL.w) / sheetW,
      top = 1 - cell.y / sheetH,
      bottom = 1 - (cell.y + HOST_CELL.h) / sheetH;
    // A host at the table's left end is mirrored, so her dealing hand reaches
    // toward the table.
    const [l, r] = host.table.hostAt!.x < host.table.center.x ? [u1, u0] : [u0, u1];
    const uv = host.mesh.geometry.attributes.uv as THREE.BufferAttribute;
    // PlaneGeometry corners: top-left, top-right, bottom-left, bottom-right.
    uv.setXY(0, l, top);
    uv.setXY(1, r, top);
    uv.setXY(2, l, bottom);
    uv.setXY(3, r, bottom);
    uv.needsUpdate = true;
    host.pose = pose;
  };

  return {
    /**
     * Follow each table's phase and seat count, and breathe; `t` is a clock
     * in ms. Returns true when anything on screen changed.
     */
    update(
      t: number,
      tables: ReadonlyMap<GameKind, { phase: TablePhase; seats: number }>,
      reduced: boolean,
    ) {
      let changed = false;
      for (const host of hosts) {
        const table = tables.get(host.game);
        const phase = table?.phase ?? 'empty';
        const seats = table?.seats ?? 0;
        if (seats !== host.seats) {
          host.seats = seats;
          const at = hostStand(host.table, seats) ?? host.table.hostAt!;
          host.mesh.position.x = host.shadow.position.x = at.x;
          host.mesh.position.z = host.shadow.position.z = at.z;
          changed = true;
        }
        if (phase !== host.phase) {
          // A table seen for the first time does not replay its opening beat.
          host.since = host.phase === null ? -1e6 : t;
          host.phase = phase;
        }
        const pose = hostPose(phase, t, host.since, host.seed);
        if (pose !== host.pose) {
          showPose(host, pose);
          changed = true;
        }
        // A slow breath (quantized so an unchanged frame skips the render).
        const lift = reduced ? 0 : Math.round((Math.sin(t / 620 + host.seed) + 1) * 3) * 0.0035;
        if (lift !== host.lift) {
          host.lift = lift;
          host.mesh.position.y = 0.02 + lift;
          host.mesh.scale.y = 1 + lift * 0.4;
          changed = true;
        }
      }
      return changed && hosts.some((h) => h.mesh.material.visible);
    },
    /** Where the host at a table stands now (for her name tag). */
    standAt(game: GameKind) {
      const host = hosts.find((h) => h.game === game);
      return host ? { x: host.mesh.position.x, z: host.mesh.position.z } : null;
    },
    dispose() {
      disposed = true;
      for (const host of hosts) {
        scene.remove(host.mesh, host.shadow);
        host.mesh.geometry.dispose();
      }
      for (const m of materials.values()) m.dispose();
      for (const texture of textures) texture.dispose();
    },
  };
}
