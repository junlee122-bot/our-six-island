'use client';
import { useEffect, useRef, useState } from 'react';
import type { Material, Object3D, Texture } from 'three';
import { LOUNGE_MODELS } from '../lounge-model-assets';
import { ItemIcon } from './ItemIcon';

const FISH_MODELS: Record<string, string> = {
  catfish: LOUNGE_MODELS.fishCatfish,
  carp: LOUNGE_MODELS.fishCarp,
  mackerel: LOUNGE_MODELS.fishMackerel,
};

/** A still trophy, loaded only for a matching catch. No animation loop; the
 * existing painted icon stays visible on slow connections or WebGL failure. */
export function FishCatchModel({ fish }: { fish: string }) {
  const host = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);
  const url = FISH_MODELS[fish];
  useEffect(() => {
    const el = host.current;
    if (!el || !url) return;
    let stopped = false;
    let cleanup = () => {};
    setReady(false);
    void (async () => {
      const [T, { GLTFLoader }] = await Promise.all([import('three'), import('three/addons/loaders/GLTFLoader.js')]);
      if (stopped) return;
      const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      const lost = () => { if (!stopped) setReady(false); };
      renderer.domElement.addEventListener('webglcontextlost', lost);
      el.appendChild(renderer.domElement);
      const scene = new T.Scene();
      const camera = new T.OrthographicCamera(-1.35, 1.35, 1, -1, 0.01, 20);
      camera.position.set(0, 0.25, 4);
      camera.lookAt(0, 0, 0);
      scene.add(new T.HemisphereLight(0xffffff, 0x78634c, 2.3));
      const key = new T.DirectionalLight(0xffffff, 3);
      key.position.set(-2, 3, 4);
      scene.add(key);
      const disposeModel = (model: Object3D) => {
        const geometries = new Set<import('three').BufferGeometry>();
        const materials = new Set<Material>();
        const textures = new Set<Texture>();
        model.traverse((object) => {
          if (!(object instanceof T.Mesh)) return;
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
            materials.add(material);
            for (const value of Object.values(material)) if (value instanceof T.Texture) textures.add(value);
          }
        });
        textures.forEach((texture) => texture.dispose());
        materials.forEach((material) => material.dispose());
        geometries.forEach((geometry) => geometry.dispose());
      };
      const loaded: { model?: Object3D } = {};
      const render = () => {
        if (stopped || !loaded.model) return;
        const w = el.clientWidth, h = el.clientHeight;
        if (!w || !h) return;
        camera.left = -(w / h);
        camera.right = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        renderer.render(scene, camera);
      };
      const observer = new ResizeObserver(render);
      observer.observe(el);
      cleanup = () => {
        observer.disconnect();
        if (loaded.model) disposeModel(loaded.model);
        renderer.domElement.removeEventListener('webglcontextlost', lost);
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      };
      const gltf = await new GLTFLoader().loadAsync(url);
      if (stopped) { disposeModel(gltf.scene); return; }
      const model = gltf.scene;
      loaded.model = model;
      const bounds = new T.Box3().setFromObject(model);
      const size = bounds.getSize(new T.Vector3());
      const center = bounds.getCenter(new T.Vector3());
      model.position.sub(center);
      const group = new T.Group();
      group.add(model);
      group.scale.setScalar(2.25 / Math.max(size.x, size.y, size.z, 0.001));
      scene.add(group);
      render();
      setReady(true);
    })().catch(() => {
      cleanup();
      if (!stopped) setReady(false);
    });
    return () => { stopped = true; cleanup(); };
  }, [url]);
  return <span className="l-catch-model" ref={host} data-ready={ready || undefined}>
    <ItemIcon id={fish} size={132} />
  </span>;
}
