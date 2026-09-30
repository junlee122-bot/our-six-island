import * as THREE from 'three';
import { LOUNGE_ASSETS } from './lounge-assets';
import { CASINO_LENDER_SPOT, LENDER_NAME } from './lounge-casino-lender';
import { interiorToWorld } from './lounge-interior-layout';
import { BANKER_SPOT } from './lounge-bank-layout';
import { SALON_STYLIST_SPOT } from './lounge-salon-layout';
import { npcChibi } from './lounge-npc-chibi';

/** Bottom alpha row of each optimized full-body image, measured after matting. */
const FOOT_LINE = { lender: .9808, banker: .9859, stylist: .9859 } as const;

/** An independent illustrated resident, not another instance of the dealer. */
type ResidentView = {
  /** A friend's sprite card (canvas height as the camera sees it, room units). */
  card: number;
  /** Screen-up per unit of height on an upright plane (cos of the camera pitch). */
  upY: number;
  /** Colour multiplied into the sprite (a dark room's warm dimness). */
  tint?: string;
  shadow: { geometry: THREE.BufferGeometry; material: THREE.Material };
  onLoad: (state: 'loaded' | 'unavailable') => void;
};
export const createInteriorLender = (scene: THREE.Scene, view: ResidentView) => createResident(scene, view, 'lender');
export const createInteriorBanker = (scene: THREE.Scene, view: ResidentView) => createResident(scene, view, 'banker');
export const createInteriorStylist = (scene: THREE.Scene, view: ResidentView) => createResident(scene, view, 'stylist');

function createResident(scene: THREE.Scene, view: ResidentView, kind: 'lender' | 'banker' | 'stylist') {
  const at = interiorToWorld(kind === 'banker' ? BANKER_SPOT : kind === 'stylist' ? SALON_STYLIST_SPOT : CASINO_LENDER_SPOT);
  const root = new THREE.Group();
  root.name = kind === 'banker' ? 'bank-clerk-nyamo' : kind === 'stylist' ? 'salon-stylist-gwen' : 'casino-lender-rose';
  scene.add(root);
  const ownedGeometry: THREE.BufferGeometry[] = [], ownedMaterial: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  let disposed = false, loaded = false;
  // In the world they are chibi at a friend's size (lounge-npc-chibi.ts); the tall art stays for dialogue.
  const chibi = npcChibi(kind === 'banker' ? 'nyamo' : kind === 'stylist' ? 'gwen' : 'rose');
  // Upright, stretched by 1 / cos(pitch): on screen exactly a friend's card (구역 공통 규격).
  const upright = view.card / view.upY;
  const geometry = chibi
    ? new THREE.PlaneGeometry(view.card * (chibi.w / chibi.h), upright)
    : new THREE.PlaneGeometry(view.card * 2 / 3, upright);
  geometry.translate(0, chibi ? upright * 0.47 : upright * (FOOT_LINE[kind] - 0.5), 0);
  ownedGeometry.push(geometry);
  const material = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.12, toneMapped: false });
  if (view.tint) material.color.set(view.tint);
  material.visible = false;
  ownedMaterial.push(material);
  const figure = new THREE.Mesh(geometry, material);
  figure.position.set(at.x, 0.025, at.z);
  figure.userData.npc = kind === 'banker' ? 'bank-clerk' : kind === 'stylist' ? 'salon-stylist' : 'casino-lender';
  root.add(figure);
  const shadow = new THREE.Mesh(view.shadow.geometry, view.shadow.material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(at.x, 0.035, at.z);
  shadow.scale.set(1.15, 1.1, 1);
  root.add(shadow);

  if (kind === 'lender') {
  // A flat felt runner marks the approach without adding a hidden obstacle.
  const rugGeometry = new THREE.PlaneGeometry(2.3, 2.15);
  const rugMaterial = new THREE.MeshStandardMaterial({ color: '#682b35', roughness: 1 });
  ownedGeometry.push(rugGeometry); ownedMaterial.push(rugMaterial);
  const rug = new THREE.Mesh(rugGeometry, rugMaterial);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(at.x, 0.012, at.z + 0.5);
  rug.receiveShadow = true;
  root.add(rug);

  // The plaque is attached to the rear wall, outside the walkable floor.
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 144;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#472e22'; context.fillRect(0, 0, 512, 144);
    context.strokeStyle = '#cda65e'; context.lineWidth = 7; context.strokeRect(8, 8, 496, 128);
    context.fillStyle = '#fff1d4'; context.font = '40px Jua, sans-serif';
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(`${LENDER_NAME}의 대출 상담`, 256, 75);
  }
  const signTexture = new THREE.CanvasTexture(canvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  textures.push(signTexture);
  const signGeometry = new THREE.PlaneGeometry(2.3, 0.65);
  const signMaterial = new THREE.MeshBasicMaterial({ map: signTexture, toneMapped: false });
  ownedGeometry.push(signGeometry); ownedMaterial.push(signMaterial);
  const sign = new THREE.Mesh(signGeometry, signMaterial);
  sign.position.set(at.x, 1.5, -5.84);
  root.add(sign);
  }

  const image = chibi?.asset ?? (kind === 'banker' ? LOUNGE_ASSETS.bankClerkSprite : kind === 'stylist' ? LOUNGE_ASSETS.salonStylistSprite : LOUNGE_ASSETS.casinoLenderSprite);
  new THREE.TextureLoader().load(image, (texture) => {
    if (disposed) { texture.dispose(); return; }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    textures.push(texture);
    material.map = texture;
    material.visible = true;
    material.needsUpdate = true;
    loaded = true;
    view.onLoad('loaded');
  }, undefined, () => { if (!disposed) view.onLoad('unavailable'); });

  return {
    at,
    hits: () => loaded ? [figure] : [],
    dispose() {
      disposed = true;
      scene.remove(root);
      for (const resource of [...ownedGeometry, ...ownedMaterial, ...textures]) resource.dispose();
    },
  };
}
