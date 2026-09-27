import * as THREE from 'three';
import { HOST_CELL, HOST_SHEET, hostCell } from './lounge-host-sprites';
import type { NpcId } from './lounge-romance';
import type { WalkPoint } from './lounge-bedroom-navigation';

/** Reuses the resident's existing sheet, at the same floor/scale as friends. */
export function createBedroomNpc(scene: THREE.Scene, camera: THREE.Camera, shadowGeometry: THREE.BufferGeometry, shadowMaterial: THREE.Material, onLoad: () => void) {
  const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  const height = 1.7 * HOST_CELL.h / HOST_CELL.figure;
  const geometry = new THREE.PlaneGeometry(height * up.y * HOST_CELL.w / HOST_CELL.h, height);
  geometry.translate(0, height / 2 - height * (HOST_CELL.h - HOST_CELL.foot) / HOST_CELL.h, 0);
  const cell = hostCell('smile'), uv = geometry.attributes.uv as THREE.BufferAttribute;
  const left = cell.x / (HOST_CELL.w * HOST_CELL.cols), right = (cell.x + HOST_CELL.w) / (HOST_CELL.w * HOST_CELL.cols);
  const top = 1 - cell.y / (HOST_CELL.h * HOST_CELL.rows), bottom = 1 - (cell.y + HOST_CELL.h) / (HOST_CELL.h * HOST_CELL.rows);
  uv.setXY(0, left, top); uv.setXY(1, right, top); uv.setXY(2, left, bottom); uv.setXY(3, right, bottom);
  const materials = new Map<NpcId, THREE.MeshBasicMaterial>();
  const textures: THREE.Texture[] = [];
  const placeholder = new THREE.MeshBasicMaterial({ visible: false });
  const mesh = new THREE.Mesh(geometry, placeholder);
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
    new THREE.TextureLoader().load(HOST_SHEET[npc], (texture) => {
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
      if (npc) mesh.material = materialFor(npc);
      mesh.position.set(point.x, 0.065, point.z);
      shadow.position.set(point.x, 0.066, point.z);
      return changed;
    },
    dispose() {
      disposed = true;
      scene.remove(mesh, shadow);
      geometry.dispose();
      placeholder.dispose();
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
    },
  };
}
