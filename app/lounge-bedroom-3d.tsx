'use client';

// This application surface must receive keyboard focus for directional walking.
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Footprints,
  LoaderCircle,
  Palette,
  Sun,
} from 'lucide-react';
import * as THREE from 'three';
import { loungeSprites } from './lounge-sprites';
import { defaultBedroom } from './lounge-bedroom-data';
import { bedroomTheme } from './lounge-bedroom-themes';
import {
  createBedroomScene,
  BEDROOM_WALL_COLOR,
  BEDROOM_FLOOR_COLOR,
} from './lounge-bedroom-scene';
import {
  advanceLocomotion,
  RUN_SPEED_MULTIPLIER,
  type LocomotionState,
} from './lounge-locomotion';
import type { LoungeSave } from './lounge-look';
import { ACTORS } from './theater-data';
import {
  WALK_ROOM,
  WALK_START,
  findWalkPath,
  walkStep,
  type WalkPoint,
} from './lounge-bedroom-navigation';
import './lounge-bedroom-3d.css';

type Direction = 'up' | 'down' | 'left' | 'right';
const KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  w: 'up',
  ArrowDown: 'down',
  s: 'down',
  ArrowLeft: 'left',
  a: 'left',
  ArrowRight: 'right',
  d: 'right',
};

function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material)
      for (const material of Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]) {
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

/** An intentionally separate walk room, sharing only the account's look and finishes. */
export function Bedroom3D({
  save,
  onDecorate,
}: {
  save: LoungeSave;
  onDecorate: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const directions = useRef(new Set<Direction>());
  const runToggle = useRef(false),
    shiftHeld = useRef(false);
  const [runPressed, setRunPressed] = useState(false);
  const latest = useRef(save);
  useLayoutEffect(() => {
    latest.current = save;
  }, [save]);
  const [state, setState] = useState<
    'loading' | 'ready' | 'partial' | 'unavailable'
  >('loading');
  const [message, setMessage] = useState('방에 햇살을 들이는 중…');
  const room = save.bedroom ?? defaultBedroom(save.actor);
  const paint = useRef<{
    wall: THREE.MeshStandardMaterial;
    floor: THREE.MeshStandardMaterial[];
  } | null>(null);

  useEffect(() => {
    if (paint.current) {
      paint.current.wall.color.set(BEDROOM_WALL_COLOR[room.wall]);
      paint.current.floor.forEach((material, index) =>
        material.color
          .set(BEDROOM_FLOOR_COLOR[room.floor])
          .offsetHSL(0, 0, ((index % 3) - 1) * 0.018),
      );
    }
  }, [room.wall, room.floor]);

  useEffect(() => {
    const host = hostRef.current!;
    const pressed = directions.current;
    let disposed = false,
      frame = 0,
      visible = true,
      contextFailed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
    } catch {
      queueMicrotask(() => {
        if (!disposed) {
          setState('unavailable');
          setMessage(
            '이 기기에서는 입체 방을 열 수 없어요. 꾸미기는 계속 이용할 수 있어요.',
          );
        }
      });
      return () => {
        disposed = true;
      };
    }
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-6, 6, 4.8, -4.8, 0.1, 60);
    camera.position.set(11, 10, 13);
    camera.lookAt(0, 1.08, 0);
    camera.updateMatrixWorld();
    const cameraRight = new THREE.Vector3().setFromMatrixColumn(
      camera.matrixWorld,
      0,
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    // Only static geometry casts shadows; a contact shadow follows the sprite.
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    const canvas = renderer.domElement;
    canvas.className = 'b3-canvas';
    canvas.setAttribute(
      'aria-label',
      `${ACTORS[latest.current.actor]}의 입체 방. 바닥을 누르거나 방향키로 걸어 보세요.`,
    );
    canvas.setAttribute('role', 'img');
    host.insertBefore(canvas, host.firstChild);

    const studio = createBedroomScene(
      scene,
      renderer,
      latest.current,
      host,
      () => disposed,
    );
    paint.current = studio.paint;
    const modelPromises = studio.promises;

    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 440;
    spriteCanvas.height = 540;
    const spriteTexture = new THREE.CanvasTexture(spriteCanvas);
    spriteTexture.colorSpace = THREE.SRGBColorSpace;
    spriteTexture.minFilter = THREE.LinearFilter;
    spriteTexture.generateMipmaps = false;
    // Keep the 2D art upright in world space. A screen-facing Sprite leans toward
    // this elevated camera, so its upper body can overlap furniture in front.
    const avatarHeight = 1.82;
    const cameraUp = new THREE.Vector3().setFromMatrixColumn(
      camera.matrixWorld,
      1,
    );
    const avatarGeometry = new THREE.PlaneGeometry(
      // Compensate for the elevated view so the original drawing keeps its ratio.
      avatarHeight * cameraUp.y * (spriteCanvas.width / spriteCanvas.height),
      avatarHeight,
    );
    // loungeSprites.draw places the soles at 97% of the texture's height.
    avatarGeometry.translate(0, avatarHeight * 0.47, 0);
    const sprite = new THREE.Mesh(
      avatarGeometry,
      new THREE.MeshBasicMaterial({
        map: spriteTexture,
        transparent: true,
        alphaTest: 0.12,
        depthTest: true,
        depthWrite: true,
        toneMapped: false,
      }),
    );
    sprite.rotation.y = Math.atan2(camera.position.x, camera.position.z);
    scene.add(sprite);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 64;
    const shadowContext = shadowCanvas.getContext('2d')!;
    const shadowGradient = shadowContext.createRadialGradient(
      32,
      32,
      4,
      32,
      32,
      31,
    );
    shadowGradient.addColorStop(0, 'rgba(62, 49, 31, 0.3)');
    shadowGradient.addColorStop(0.45, 'rgba(62, 49, 31, 0.16)');
    shadowGradient.addColorStop(1, 'rgba(62, 49, 31, 0)');
    shadowContext.fillStyle = shadowGradient;
    shadowContext.fillRect(0, 0, 64, 64);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    shadowTexture.colorSpace = THREE.SRGBColorSpace;
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 0.52),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    scene.add(shadow);
    const destination = new THREE.Mesh(
      new THREE.RingGeometry(0.13, 0.17, 32),
      new THREE.MeshBasicMaterial({
        color: '#f7f0cd',
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    destination.rotation.x = -Math.PI / 2;
    destination.visible = false;
    scene.add(destination);
    let position = { ...WALK_START },
      path: WalkPoint[] = [];
    let locomotion: LocomotionState = { phase: 0, facing: 1 };
    let sprites: Awaited<ReturnType<typeof loungeSprites>> | null = null;
    const spritesPromise = loungeSprites().then(async (value) => {
      sprites = value;
      if (
        !disposed &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        const save = latest.current;
        await value.warmMotion(save.actor, save.looks[save.actor]).catch(() => {
          /* Retain the existing wardrobe when optional motion art is offline. */
        });
      }
    });
    void Promise.allSettled([...modelPromises, spritesPromise]).then(
      (results) => {
        if (disposed || contextFailed) return;
        if (results.at(-1)?.status === 'rejected') {
          setState('unavailable');
          setMessage(
            '캐릭터 그림을 불러오지 못했어요. 꾸미기로 돌아갔다가 다시 열어 주세요.',
          );
        } else if (results.some((result) => result.status === 'rejected')) {
          setState('partial');
          setMessage(
            '일부 소품을 불러오지 못했어요. 기본 방에서 산책할 수 있어요.',
          );
        } else {
          setState('ready');
          setMessage('바닥을 누르면 그곳으로 걸어가요.');
        }
      },
    );

    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.06);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const rayPoint = new THREE.Vector3();
    const onPointer = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return;
      host.focus({ preventScroll: true });
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.ray.intersectPlane(ground, rayPoint);
      if (
        !hit ||
        Math.abs(hit.x) > WALK_ROOM.width / 2 + 0.2 ||
        Math.abs(hit.z) > WALK_ROOM.depth / 2 + 0.2
      )
        return;
      path = findWalkPath(position, { x: hit.x, z: hit.z });
      const last = path.at(-1);
      destination.visible = Boolean(last);
      if (last) {
        destination.position.set(last.x, 0.07, last.z);
      }
    };
    const keydown = (event: KeyboardEvent) => {
      const direction = KEYS[event.key] ?? KEYS[event.key.toLowerCase()];
      if (
        !direction ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        document.querySelector('dialog[open]')
      )
        return;
      event.preventDefault();
      pressed.add(direction);
      path = [];
      destination.visible = false;
    };
    const runKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Shift' || event.repeat) return;
      shiftHeld.current = true;
      setRunPressed(true);
    };
    const keyup = (event: KeyboardEvent) => {
      const direction = KEYS[event.key] ?? KEYS[event.key.toLowerCase()];
      if (direction) pressed.delete(direction);
      if (event.key === 'Shift') {
        shiftHeld.current = false;
        setRunPressed(runToggle.current);
      }
    };
    const blur = () => {
      pressed.clear();
      shiftHeld.current = false;
      setRunPressed(runToggle.current);
      path = [];
      destination.visible = false;
    };
    const visibilityChanged = () => {
      if (document.hidden) blur();
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      if (!disposed) {
        contextFailed = true;
        cancelAnimationFrame(frame);
        setState('unavailable');
        setMessage(
          '입체 화면 연결이 끊겼어요. 꾸미기로 돌아갔다가 다시 열어 주세요.',
        );
      }
    };
    canvas.addEventListener('pointerdown', onPointer);
    canvas.addEventListener('webglcontextlost', contextLost);
    host.addEventListener('keydown', keydown);
    host.addEventListener('keydown', runKeydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibilityChanged);
    host.addEventListener('focusout', blur);
    const resize = () => {
      const width = host.clientWidth,
        height = host.clientHeight;
      if (!width || !height) return;
      const aspect = width / height;
      // Include the high rear wall corner, not just the floor footprint.
      const halfHeight = Math.max(5.9, 7.1 / aspect);
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) blur();
    });
    visibilityObserver.observe(host);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let previous = performance.now(),
      lastSprite = -100,
      lastRender = -100,
      lastData = -100;
    let lastMotion: 'walk' | 'run' | 'idle' = 'idle',
      lastFacing: 1 | -1 = 1;
    const animate = (now: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      if (!visible || document.hidden) return;
      const before = position;
      const held = pressed;
      const running = runToggle.current || shiftHeld.current,
        speed = 2.25 * (running ? RUN_SPEED_MULTIPLIER : 1);
      let horizontal = Number(held.has('right')) - Number(held.has('left'));
      let vertical = Number(held.has('down')) - Number(held.has('up'));
      if (horizontal || vertical) {
        path = [];
        destination.visible = false;
        const length = Math.hypot(horizontal, vertical);
        horizontal /= length;
        vertical /= length;
        position = walkStep(
          position,
          (horizontal + vertical) * Math.SQRT1_2 * speed * dt,
          (vertical - horizontal) * Math.SQRT1_2 * speed * dt,
        );
      } else if (path.length) {
        const next = path[0],
          dx = next.x - position.x,
          dz = next.z - position.z,
          distance = Math.hypot(dx, dz),
          step = Math.min(distance, speed * dt);
        if (distance < 0.025) path.shift();
        else
          position = walkStep(
            position,
            (dx / distance) * step,
            (dz / distance) * step,
          );
        if (!path.length) destination.visible = false;
      }
      const walking =
        Math.hypot(position.x - before.x, position.z - before.z) > 0.0001;
      const movedX = position.x - before.x,
        movedZ = position.z - before.z,
        moved = Math.hypot(movedX, movedZ),
        playerMotion = advanceLocomotion(
          locomotion,
          {
            distance: moved,
            horizontal: movedX * cameraRight.x + movedZ * cameraRight.z,
          },
          running ? 'run' : 'walk',
          2.25,
        );
      locomotion = playerMotion.state;
      sprite.position.set(position.x, 0.065, position.z);
      shadow.position.set(position.x, 0.066, position.z);
      if (
        sprites &&
        (playerMotion.motion !== lastMotion ||
          locomotion.facing !== lastFacing ||
          now - lastSprite > (walking ? 40 : 80))
      ) {
        const current = latest.current;
        const changed = sprites.draw(
          spriteCanvas,
          current.actor,
          current.looks[current.actor],
          playerMotion.motion,
          locomotion.phase,
          false,
          reduced.matches,
          { facing: locomotion.facing },
        );
        if (changed) spriteTexture.needsUpdate = true;
        lastSprite = now;
        lastMotion = playerMotion.motion;
        lastFacing = locomotion.facing;
      }
      if (now - lastData > 150) {
        host.dataset.avatarX = position.x.toFixed(3);
        host.dataset.avatarZ = position.z.toFixed(3);
        host.dataset.walking = String(walking);
        host.dataset.motion = playerMotion.motion;
        host.dataset.facing = String(locomotion.facing);
        lastData = now;
      }
      if (now - lastRender > (walking ? 33 : 80)) {
        renderer.render(scene, camera);
        lastRender = now;
      }
    };
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      pressed.clear();
      paint.current = null;
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointer);
      canvas.removeEventListener('webglcontextlost', contextLost);
      host.removeEventListener('keydown', keydown);
      host.removeEventListener('keydown', runKeydown);
      host.removeEventListener('focusout', blur);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibilityChanged);
      disposeObject(scene);
      studio.sun.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  const holdDirection = (
    direction: Direction,
    target: HTMLButtonElement,
    pointerId: number,
  ) => {
    target.setPointerCapture(pointerId);
    directions.current.add(direction);
  };
  return (
    <section className="b3-room" aria-label="입체 방 산책">
      <header className="b3-heading">
        <div>
          <span className="b3-eyebrow">
            <Sun size={14} /> 좋아하는 것들로 채운 하루
          </span>
          <h1>
            {ACTORS[save.actor]}의 {bedroomTheme(save.actor).title}
          </h1>
          <p>{bedroomTheme(save.actor).description}</p>
        </div>
        <span className="b3-mode-label">{bedroomTheme(save.actor).tag}</span>
      </header>
      <div className="b3-scene-frame">
        {/* Keyboard focus is required for directional movement in this application surface. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div
          ref={hostRef}
          className="b3-scene"
          tabIndex={0}
          role="application"
          aria-label="입체 방. 클릭 또는 방향키와 WASD로 이동하고 Shift 또는 달리기 버튼으로 달립니다"
          data-testid="bedroom-3d"
          data-load-state={state}
        >
          <div className="b3-scene-note" aria-hidden="true">
            <span>BEOMDEW ATELIER</span>
            <strong>취향이 머무는 곳</strong>
          </div>
          {state === 'loading' && (
            <output className="b3-loading">
              <LoaderCircle size={19} />
              {message}
            </output>
          )}
          {state === 'unavailable' && (
            <div className="b3-fallback" aria-live="polite">
              <strong>잠시, 꾸미기에서 만나요</strong>
              <p>{message}</p>
              <button type="button" onClick={onDecorate}>
                <Palette size={16} /> 내 방 꾸미기
              </button>
            </div>
          )}
          {state !== 'unavailable' && (
            <div className="b3-pad" aria-label="걷기 방향">
              <button
                type="button"
                className="b3-pad-run"
                aria-label="달리기 전환"
                aria-pressed={runPressed}
                onClick={() => {
                  runToggle.current = !runToggle.current;
                  setRunPressed(runToggle.current || shiftHeld.current);
                }}
              >
                <Footprints size={15} /> {runPressed ? '달리기 켬' : '달리기'}
              </button>
              {(
                [
                  ['up', ArrowUp, '위로 걷기'],
                  ['left', ArrowLeft, '왼쪽으로 걷기'],
                  ['down', ArrowDown, '아래로 걷기'],
                  ['right', ArrowRight, '오른쪽으로 걷기'],
                ] as const
              ).map(([direction, Icon, label]) => (
                <button
                  key={direction}
                  type="button"
                  className={`b3-pad-${direction}`}
                  aria-label={label}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    holdDirection(
                      direction,
                      event.currentTarget,
                      event.pointerId,
                    );
                  }}
                  onPointerUp={() => directions.current.delete(direction)}
                  onPointerCancel={() => directions.current.delete(direction)}
                  onLostPointerCapture={() =>
                    directions.current.delete(direction)
                  }
                  onKeyDown={(event) => {
                    if (event.key === ' ' || event.key === 'Enter') {
                      event.preventDefault();
                      directions.current.add(direction);
                    }
                  }}
                  onKeyUp={() => directions.current.delete(direction)}
                  onBlur={() => directions.current.delete(direction)}
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="b3-scene-footer">
          <span>
            <Footprints size={15} /> 바닥을 눌러 이동
            <span className="b3-key-help"> · 방향키 / WASD · Shift 달리기</span>
          </span>
          <span className="b3-garden-tag">
            <i /> 나만의 산책
          </span>
        </div>
      </div>
      {state === 'partial' && <output className="b3-status">{message}</output>}
      <div className="b3-room-caption">
        <div>
          <strong>산책하는 스튜디오 · 자유롭게 꾸미는 캔버스</strong>
          <p>
            스튜디오는 정해진 가구 배치로 산책하는 공간이에요. 꾸미기에서는 새
            방에 소품을 자유롭게 배치할 수 있어요. 꾸미기 배치는 따로 저장되고,
            벽·바닥 색과 입은 코디는 산책방에도 함께 적용돼요.
          </p>
        </div>
        <button type="button" onClick={onDecorate}>
          <Palette size={16} /> 내 방 꾸미기 <span aria-hidden="true">↗</span>
        </button>
      </div>
      <p className="b3-credit">
        소파·튤립·책장·화분 선반·티 테이블은{' '}
        <a
          href="https://karchive.vibeline.co.kr/models"
          target="_blank"
          rel="noreferrer"
        >
          kArchive
        </a>
        의 모델을 사용했어요. 출처: 쓰레드 dogfooter. 가구·커튼·쿠션은{' '}
        <a
          href="https://3dassets.dev/packs/bedroom-and-living-room-furniture"
          target="_blank"
          rel="noreferrer"
        >
          3DAssets.dev
        </a>
        의 CC0 모델입니다. 미쿠 테마 소품은 이 게임을 위한 팬 아트예요.
      </p>
    </section>
  );
}
