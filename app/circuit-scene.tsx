'use client';
import {useEffect, useRef, useState} from 'react';
import {Maximize, RotateCcw, X, Move3D} from 'lucide-react';
import profiles from '../lib/circuit-elevation.json';
import {buildElevationRibbon, type ElevationProfile} from '../lib/circuit-elevation';
import {circuitCameraDistance} from '../lib/circuit-camera';

type Circuit = {id?: string; name?: string};
type ProfileInfo = {file: string; minElevation: number; maxElevation: number; elevationRange: number};

function Scene({profile, name, large = false, interactive = false}: {
  profile: ProfileInfo; name?: string; large?: boolean; interactive?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const reset = useRef<() => void>(() => {});
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const abort = new AbortController();
    const cleanups: Array<() => void> = [];
    let gone = false;
    const dispose = () => { cleanups.splice(0).reverse().forEach(cleanup => cleanup()); };
    setStatus('loading');
    const deadline = setTimeout(() => {
      abort.abort();
      dispose();
      if (!gone) setStatus('failed');
    }, 15000);

    async function load() {
      const request = fetch(profile.file, {signal: abort.signal}).then(async response => {
        if (!response.ok) throw new Error('Circuit elevation unavailable');
        return await response.json() as ElevationProfile;
      });
      const [T, {OrbitControls}, data] = await Promise.all([
        import('three'), import('three/addons/controls/OrbitControls.js'), request,
      ]);
      if (gone || abort.signal.aborted || !host.current) return;
      const mount = host.current;
      const ribbon = buildElevationRibbon(data);
      const renderer = new T.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'low-power'});
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setClearColor(0, 0);
      renderer.toneMapping = T.ACESFilmicToneMapping;
      mount.appendChild(renderer.domElement);
      cleanups.push(() => { renderer.dispose(); renderer.domElement.remove(); });

      const scene = new T.Scene();
      const model = new T.Group();
      model.rotation.y = -0.28;
      scene.add(model);
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.BufferAttribute(ribbon.positions, 3));
      geometry.setIndex(new T.BufferAttribute(ribbon.indices, 1));
      geometry.computeVertexNormals();
      const material = new T.MeshStandardMaterial({color: 0x15191c, roughness: 0.48, metalness: 0.15});
      const road = new T.Mesh(geometry, material);
      model.add(road);
      cleanups.push(() => { geometry.dispose(); material.dispose(); });

      const curtainGeometry = new T.BufferGeometry();
      curtainGeometry.setAttribute('position', new T.BufferAttribute(ribbon.curtainPositions, 3));
      curtainGeometry.setIndex(new T.BufferAttribute(ribbon.curtainIndices, 1));
      const curtainMaterial = new T.MeshBasicMaterial({color: 0xef382b, transparent: true, opacity: 0.48, side: T.DoubleSide, depthWrite: false});
      model.add(new T.Mesh(curtainGeometry, curtainMaterial));
      cleanups.push(() => { curtainGeometry.dispose(); curtainMaterial.dispose(); });

      const baseGeometry = new T.BufferGeometry().setFromPoints(ribbon.centerline.map(([x, , z]) => new T.Vector3(x, ribbon.floorY, z)));
      const baseMaterial = new T.LineBasicMaterial({color: 0xef382b, transparent: true, opacity: 0.5});
      model.add(new T.LineLoop(baseGeometry, baseMaterial));
      cleanups.push(() => { baseGeometry.dispose(); baseMaterial.dispose(); });

      scene.add(new T.AmbientLight(0xffffff, 1.1));
      const light = new T.DirectionalLight(0xffffff, 2);
      light.position.set(-20, 100, 60);
      scene.add(light);
      const camera = new T.PerspectiveCamera(35, 1, 0.1, 1000);
      const initialDirection = new T.Vector3(20, 65, 140).normalize();
      camera.position.copy(initialDirection).multiplyScalar(180);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1;
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.enableZoom = large;
      controls.enableRotate = large || interactive;
      controls.maxPolarAngle = Math.PI * 0.88;
      cleanups.push(() => controls.dispose());
      model.updateMatrixWorld(true);
      const sphere = new T.Box3().setFromObject(model).getBoundingSphere(new T.Sphere());
      let dirty = true;
      controls.addEventListener('change', () => { dirty = true; });
      function fit(resetView = false) {
        const direction = resetView ? initialDirection : camera.position.clone().sub(controls.target).normalize();
        const distance = circuitCameraDistance(sphere.radius, camera.aspect);
        controls.target.copy(sphere.center);
        camera.position.copy(sphere.center).addScaledVector(direction, distance);
        controls.minDistance = distance * 0.4;
        controls.maxDistance = distance * 2.5;
        camera.far = Math.max(1000, distance * 5);
        camera.updateProjectionMatrix();
        controls.update(0);
        dirty = true;
      }
      let width = 0, height = 0, needsResize = true;
      const resize = new ResizeObserver(() => { needsResize = true; });
      resize.observe(mount);
      cleanups.push(() => resize.disconnect());
      let visible = true;
      const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; dirty = true; });
      visibility.observe(mount);
      cleanups.push(() => visibility.disconnect());
      reset.current = () => fit(true);
      let frame = 0;
      let previousTime = performance.now();
      function draw(time = performance.now()) {
        frame = requestAnimationFrame(draw);
        const deltaSeconds = Math.min(Math.max(0, (time - previousTime) / 1000), 0.1);
        previousTime = time;
        if (!visible || document.hidden) return;
        if (needsResize) {
          needsResize = false;
          const box = mount.getBoundingClientRect();
          width = Math.round(box.width); height = Math.round(box.height);
          if (width && height) { renderer.setSize(width, height, false); camera.aspect = width / height; fit(); }
        }
        controls.update(deltaSeconds);
        if (!dirty || !width || !height) return;
        renderer.render(scene, camera);
        dirty = false;
      }
      draw();
      cleanups.push(() => cancelAnimationFrame(frame));
      clearTimeout(deadline);
      if (!gone) setStatus('ready');
    }
    void load().catch(() => {
      clearTimeout(deadline);
      abort.abort();
      dispose();
      if (!gone) setStatus('failed');
    });
    return () => { gone = true; clearTimeout(deadline); abort.abort(); dispose(); };
  }, [profile.file, large, interactive, attempt]);

  return <div className={'track-scene' + (large ? ' large' : '')}>
    <div ref={host} role="img" aria-label={(name || '赛道') + '海拔立体模型'}/>
    {status !== 'ready' && <span className="circuit-load-status" role="status">{status === 'failed' ? '3D 加载失败，请重试' : '正在加载 3D…'}</span>}
    {status === 'failed' && <button className="circuit-enable" onClick={() => setAttempt(value => value + 1)}>重试 3D</button>}
    {(large || interactive) && status === 'ready' && <button className="scene-reset" aria-label="重置视角" title="重置视角" onClick={() => reset.current()}><RotateCcw size={16}/></button>}
  </div>;
}

export function CircuitPreview({circuit, interactive = false}: {circuit: Circuit; interactive?: boolean}) {
  const profile = (profiles as Record<string, ProfileInfo>)[circuit?.id || ''];
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open) { if (typeof element.showModal === 'function') element.showModal(); else element.setAttribute('open', ''); }
    else if (typeof element.close === 'function') element.close(); else element.removeAttribute('open');
  }, [open]);
  useEffect(() => setOpen(false), [circuit?.id]);
  if (!profile) return <div className="track-pending"><Move3D/><small>赛道模型待补充</small></div>;
  return <>
    <div className={'circuit-preview' + (interactive ? ' inline-interactive' : '')}>
      <Scene key={circuit.id} profile={profile} name={circuit.name} interactive={interactive}/>
      <button className="scene-maximize" aria-label={'放大' + circuit.name + '3D赛道'} onClick={() => setOpen(true)}><Maximize size={16}/></button>
    </div>
    {open && <dialog ref={dialog} className="sheet circuit-viewer" onCancel={() => setOpen(false)}>
      <div className="sheet-head"><div><h2>{circuit.name}</h2></div><button className="icon-button" aria-label="关闭" onClick={() => setOpen(false)}><X size={21}/></button></div>
      <div className="sheet-body">
        <Scene key={circuit.id} profile={profile} name={circuit.name} large/>
      </div>
    </dialog>}
  </>;
}
