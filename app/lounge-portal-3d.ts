import * as THREE from 'three';
import { portalAt } from './lounge-portals';

/** A low, warm waystone and a wooden direction sign; never a walking obstacle. */
export function addPortalStone(parent: THREE.Object3D, area: string) {
  const portal = portalAt(area);
  if (!portal) return null;
  const root = new THREE.Group();
  root.name = `waystone-${area}`;
  root.position.set(portal.point.x, 0.045, portal.point.z);
  const stone = new THREE.MeshStandardMaterial({ color: '#cfb68b', roughness: 0.95 });
  const edge = new THREE.MeshStandardMaterial({ color: '#a78660', roughness: 0.95 });
  const wood = new THREE.MeshStandardMaterial({ color: '#88623d', roughness: 0.95 });
  const cream = new THREE.MeshStandardMaterial({ color: '#f1dba3', roughness: 0.9 });
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, rz = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z); mesh.rotation.z = rz; mesh.receiveShadow = true; root.add(mesh);
    return mesh;
  };
  add(new THREE.CylinderGeometry(1.25, 1.3, 0.08, 12), edge, 0, 0, 0);
  add(new THREE.CylinderGeometry(1.08, 1.08, 0.09, 12), stone, 0, 0.035, 0);
  const ring = add(new THREE.TorusGeometry(0.75, 0.035, 4, 24), cream, 0, 0.085, 0);
  ring.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const mark = add(new THREE.BoxGeometry(0.12, 0.015, 0.3), cream, Math.sin(a) * 0.45, 0.085, Math.cos(a) * 0.45);
    mark.rotation.y = a;
  }
  add(new THREE.BoxGeometry(0.12, 1.15, 0.12), wood, 1.05, 0.6, -0.75);
  add(new THREE.BoxGeometry(0.9, 0.43, 0.13), wood, 1.05, 1.13, -0.75);
  add(new THREE.BoxGeometry(0.4, 0.07, 0.025), cream, 1.02, 1.14, -0.675);
  add(new THREE.BoxGeometry(0.2, 0.07, 0.025), cream, 1.19, 1.2, -0.675, -0.65);
  add(new THREE.BoxGeometry(0.2, 0.07, 0.025), cream, 1.19, 1.08, -0.675, 0.65);
  parent.add(root);
  return root;
}

export function disposePortalStone(root: THREE.Object3D | null) {
  const materials = new Set<THREE.Material>();
  root?.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.geometry.dispose();
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m);
  });
  for (const m of materials) m.dispose();
  root?.removeFromParent();
}
