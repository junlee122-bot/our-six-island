import * as THREE from 'three';
import { HOST_CELL, HOST_SHEET, hostCell } from './lounge-host-sprites';
import { NPCS, type NpcId } from './lounge-npc-data';
import { npcChibi } from './lounge-npc-chibi';
import type { WalkPoint } from './lounge-bedroom-navigation';

/**
 * The invited resident in my room: a pose-sheet host (smile cell) or a single
 * keyed full-body image, at the same floor/scale as friends.
 */
export function createBedroomNpc(scene: THREE.Scene, camera: THREE.Camera, shadowGeometry: THREE.BufferGeometry, shadowMaterial: THREE.Material, onLoad: () => void, friendPlane = 1.82) {
  const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  // Chibi residents on a friend's plane: same height and feet line (lounge-npc-chibi.ts).
  const chibiGeometries = new Map<string, THREE.PlaneGeometry>();
  const chibiGeometry = (w: number, h: number) => {
    const key = `${w}x${h}`;
    let g = chibiGeometries.get(key);
    if (!g) {
      g = new THREE.PlaneGeometry(friendPlane * up.y * (w / h), friendPlane);
      g.translate(0, friendPlane * 0.47, 0);
      chibiGeometries.set(key, g);
    }
    return g;
  };
  // Pose sheets and single images stand as tall as the friend plane implies
  // (upright planes stretched like the friends', 1 / up.y).
  const stretch = 1 / Math.max(0.2, up.y);
  const height = (1.7 * HOST_CELL.h / HOST_CELL.figure) * stretch;
  const sheetGeometry = new THREE.PlaneGeometry(height * up.y * HOST_CELL.w / HOST_CELL.h, height);
  sheetGeometry.translate(0, height / 2 - height * (HOST_CELL.h - HOST_CELL.foot) / HOST_CELL.h, 0);
  const cell = hostCell('smile'), uv = sheetGeometry.attributes.uv as THREE.BufferAttribute;
  const left = cell.x / (HOST_CELL.w * HOST_CELL.cols), right = (cell.x + HOST_CELL.w) / (HOST_CELL.w * HOST_CELL.cols);
  const top = 1 - cell.y / (HOST_CELL.h * HOST_CELL.rows), bottom = 1 - (cell.y + HOST_CELL.h) / (HOST_CELL.h * HOST_CELL.rows);
  uv.setXY(0, left, top); uv.setXY(1, right, top); uv.setXY(2, left, bottom); uv.setXY(3, right, bottom);
  // Single images are 660 × 990 with the soles near the bottom edge; the figure fills ~95% of the height.
  const imageHeight = (1.7 / 0.95) * stretch;
  const imageGeometries = new Map<number, THREE.PlaneGeometry>();
  const imageGeometry = (foot: number) => {
    let g = imageGeometries.get(foot);
    if (!g) {
      g = new THREE.PlaneGeometry(imageHeight * up.y * (2 / 3), imageHeight);
      g.translate(0, imageHeight * (foot - 0.5), 0);
      imageGeometries.set(foot, g);
    }
    return g;
  };
  const materials = new Map<NpcId, THREE.MeshBasicMaterial>();
  const textures: THREE.Texture[] = [];
  const placeholder = new THREE.MeshBasicMaterial({ visible: false });
  const mesh = new THREE.Mesh(sheetGeometry, placeholder);
  mesh.rotation.y = Math.atan2(camera.position.x, camera.position.z);
  const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  mesh.visible = shadow.visible = false;
  mesh.name = 'invited-npc';
  scene.add(mesh, shadow);
  let disposed = false, current: NpcId | undefined;
  const materialFor = (npc: NpcId) => {
    const cached = materials.get(npc);
    if (cached) return cached;
    const material = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.12, toneMapped: false, visible: false });
    materials.set(npc, material);
    const art = NPCS[npc].art;
    const chibi = npcChibi(npc);
    // Residents without a picture yet are never drawn.
    if (art.kind === 'pending' && !chibi) return material;
    new THREE.TextureLoader().load(chibi ? chibi.asset : art.kind === 'sheet' ? HOST_SHEET[art.host] : art.kind === 'image' ? art.asset : '', (texture) => {
      if (disposed) { texture.dispose(); return; }
      textures.push(texture);
      texture.colorSpace = THREE.SRGBColorSpace;
      material.map = texture;
      material.visible = true;
      material.needsUpdate = true;
      onLoad();
    }, undefined, () => {});
    return material;
  };
  return {
    update(npc: NpcId | undefined, point: WalkPoint) {
      const changed = current !== npc || mesh.position.x !== point.x || mesh.position.z !== point.z;
      current = npc;
      mesh.visible = shadow.visible = !!npc;
      if (npc) {
        const art = NPCS[npc].art;
        const chibi = npcChibi(npc);
        mesh.geometry = chibi ? chibiGeometry(chibi.w, chibi.h) : art.kind === 'sheet' ? sheetGeometry : imageGeometry(art.kind === 'image' ? art.foot : 0.985);
        mesh.material = materialFor(npc);
      }
      mesh.position.set(point.x, 0.065, point.z);
      shadow.position.set(point.x, 0.066, point.z);
      return changed;
    },
    dispose() {
      disposed = true;
      scene.remove(mesh, shadow);
      sheetGeometry.dispose();
      imageGeometries.forEach((g) => g.dispose());
      chibiGeometries.forEach((g) => g.dispose());
      placeholder.dispose();
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
    },
  };
}
