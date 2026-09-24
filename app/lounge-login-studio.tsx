'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LOUNGE_MODELS } from './lounge-model-assets';

function releaseStudio(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    for (const material of Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : []) {
      materials.add(material);
      for (const value of Object.values(material))
        if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const texture of textures) {
    texture.dispose();
    const source = texture.source.data;
    if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap)
      source.close();
  }
  for (const material of materials) material.dispose();
}

/** A static set, rendered only after resize or an asset has arrived. */
export function LoginStudio() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState('loading');
  useEffect(() => {
    const host = hostRef.current!;
    const stage = host.closest<HTMLElement>('.l-login-stage');
    let disposed = false;
    let contextFailed = false;
    let frame = 0;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      queueMicrotask(() => {
        if (!disposed) setState('fallback');
      });
      return () => {
        disposed = true;
      };
    }
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-6, 6, 4.8, -4.8, 0.1, 60);
    camera.position.set(9, 8, 12);
    camera.lookAt(0, 1.08, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);
    const requestRender = () => {
      if (disposed || contextFailed || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!disposed && !contextFailed) {
          renderer.render(scene, camera);
          host.dataset.painted = 'true';
        }
      });
    };
    const light = new THREE.DirectionalLight('#fff1d4', 3.2);
    light.position.set(-3, 9, 6);
    light.castShadow = true;
    light.shadow.mapSize.set(512, 512);
    Object.assign(light.shadow.camera, {
      left: -7,
      right: 7,
      top: 7,
      bottom: -7,
      near: 0.5,
      far: 25,
    });
    light.shadow.normalBias = 0.035;
    scene.add(light, new THREE.HemisphereLight('#fffaf0', '#b5a080', 2.5));
    const materials = new Map<string, THREE.MeshStandardMaterial>();
    const mat = (color: string) => {
      if (!materials.has(color))
        materials.set(
          color,
          new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
        );
      return materials.get(color)!;
    };
    const box = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      color: string,
    ) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };
    // Leave the foreground floor open for the immediately visible 2D friend.
    box(8.4, 0.24, 5.9, 0, -0.15, 0, '#aa8663');
    for (let row = 0; row < 15; row++)
      box(
        8.18,
        0.05,
        0.375,
        0,
        0,
        -2.7 + row * 0.39,
        row % 3 ? '#d2b78f' : '#d9c19f',
      );
    box(8.4, 3.3, 0.13, 0, 1.64, -2.95, '#eee5d3');
    box(0.13, 3.3, 5.9, -4.15, 1.64, 0, '#e1dfcd');
    box(8.4, 0.13, 0.18, 0, 0.15, -2.84, '#c9b393');
    box(0.18, 0.13, 5.8, -4.04, 0.15, 0, '#c9b393');
    box(8.5, 0.08, 0.21, 0, 3.3, -2.95, '#bda383');
    box(0.21, 0.08, 6, -4.15, 3.3, 0, '#bda383');
    box(2.7, 1.8, 0.08, -1.1, 2.1, -2.84, '#b89b73');
    box(2.45, 1.55, 0.1, -1.1, 2.1, -2.77, '#c6dcd4');
    for (const x of [-2.3, -1.1, 0.1])
      box(0.07, 1.59, 0.13, x, 2.1, -2.68, '#fff3d9');
    box(2.45, 0.07, 0.13, -1.1, 2.1, -2.68, '#fff3d9');
    box(2.95, 0.09, 0.37, -1.1, 1.28, -2.66, '#e6cfaa');
    // Small framed music artwork introduces the house's mint accent.
    box(1.14, 1.36, 0.1, 2.43, 2.23, -2.82, '#b49a75');
    box(1, 1.23, 0.04, 2.43, 2.23, -2.74, '#e3ece1');
    for (let i = 0; i < 7; i++) {
      const h = [0.23, 0.47, 0.74, 0.41, 0.66, 0.36, 0.19][i];
      box(
        0.07,
        h,
        0.02,
        2.04 + i * 0.13,
        2.06 + h / 2,
        -2.707,
        i === 3 ? '#c57c88' : '#5b9e96',
      );
    }
    const rug = new THREE.Mesh(
      new THREE.CircleGeometry(1.38, 48),
      mat('#a6b7a6'),
    );
    rug.rotation.x = -Math.PI / 2;
    rug.scale.y = 0.7;
    rug.position.set(0.5, 0.048, 0.9);
    rug.receiveShadow = true;
    scene.add(rug);
    const loader = new GLTFLoader();
    const place = async (
      url: string,
      width: number,
      depth: number,
      height: number,
      x: number,
      z: number,
      rotation = 0,
    ) => {
      const { scene: model } = await loader.loadAsync(url);
      if (disposed) {
        releaseStudio(model);
        return;
      }
      let textured = false;
      model.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        for (const surface of Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]) {
          const material = surface as THREE.MeshStandardMaterial;
          const image = material.map?.image as { width?: number } | undefined;
          if (typeof image?.width === 'number' && image.width > 0)
            textured = true;
        }
      });
      if (!textured) {
        releaseStudio(model);
        throw new Error('The studio furniture texture could not be loaded.');
      }
      model.rotation.y = rotation;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const scale = Math.min(
        width / Math.max(size.x, 0.001),
        depth / Math.max(size.z, 0.001),
        height / Math.max(size.y, 0.001),
      );
      model.scale.multiplyScalar(scale);
      const fitted = new THREE.Box3().setFromObject(model);
      const center = fitted.getCenter(new THREE.Vector3());
      model.position.set(x - center.x, 0.06 - fitted.min.y, z - center.z);
      model.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      scene.add(model);
      requestRender();
    };
    void Promise.allSettled([
      place(LOUNGE_MODELS.sofa, 3.2, 1.42, 1.36, -1.64, -1.55),
      place(
        LOUNGE_MODELS.archiveBookcase,
        0.64,
        1.2,
        2.02,
        -3.56,
        0.17,
        Math.PI / 2,
      ),
      place(LOUNGE_MODELS.teaTable, 1.2, 1.2, 0.68, -1.08, 0.1),
      place(LOUNGE_MODELS.plantStand, 0.95, 0.84, 1.45, 3.03, -1.72),
    ]).then((results) => {
      if (!disposed && !contextFailed) {
        setState(
          results.some((result) => result.status === 'rejected')
            ? 'partial'
            : 'ready',
        );
        host.dataset.models = String(
          results.filter((result) => result.status === 'fulfilled').length,
        );
      }
    });
    const resize = () => {
      const width = Math.max(1, host.clientWidth),
        height = Math.max(1, host.clientHeight),
        aspect = width / height;
      const half = Math.max(4.35, 5.7 / aspect);
      camera.left = -half * aspect;
      camera.right = half * aspect;
      camera.top = half;
      camera.bottom = -half;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      // Keep the immediately visible DOM figure on the rug, at furniture scale.
      const foot = new THREE.Vector3(0.9, 0.06, 1.05);
      const projectedFoot = foot.clone().project(camera);
      const projectedTop = foot
        .clone()
        .add(new THREE.Vector3(0, 1.9, 0))
        .project(camera);
      const avatarHeight = ((projectedTop.y - projectedFoot.y) * height) / 2;
      const shadowWidth = (0.66 * height) / (half * 2);
      const viewDirection = camera.getWorldDirection(new THREE.Vector3());
      const properties = {
        '--login-avatar-x': `${(projectedFoot.x + 1) * 50}%`,
        '--login-avatar-y': `${(1 - projectedFoot.y) * 50}%`,
        '--login-avatar-width': `${(avatarHeight * 440) / 540}px`,
        '--login-avatar-height': `${avatarHeight}px`,
        '--login-shadow-width': `${shadowWidth}px`,
        '--login-shadow-height': `${shadowWidth * Math.abs(viewDirection.y)}px`,
      };
      for (const [property, value] of Object.entries(properties))
        stage?.style.setProperty(property, value);
      renderer.setSize(width, height, false);
      requestRender();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const lost = (event: Event) => {
      event.preventDefault();
      contextFailed = true;
      if (!disposed) setState('fallback');
    };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    resize();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      releaseStudio(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div className="l-login-studio" data-state={state} aria-hidden="true">
      <div className="l-login-room-fallback">
        <i />
        <i />
        <i />
      </div>
      <div className="l-login-studio-canvas" ref={hostRef} />
    </div>
  );
}
