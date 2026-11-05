'use client';
import {useEffect, useRef, useState} from 'react';
import {Maximize, RotateCcw, X, Move3D} from 'lucide-react';
import profiles from '../lib/circuit-elevation.json';
import {buildElevationRibbon, type ElevationProfile} from '../lib/circuit-elevation';
import {circuitCameraDistance} from '../lib/circuit-camera';

type Circuit = {id?: string; name?: string};
type ProfileInfo = {file: string; minElevation: number; maxElevation: number; elevationRange: number};
const verticalScale = 3;

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
      const ribbon = buildElevationRibbon(data, verticalScale);
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
      const vertexColor = new T.Color();
      for (let offset = 0; offset < ribbon.colors.length; offset += 3) {
        vertexColor.setRGB(ribbon.colors[offset], ribbon.colors[offset + 1], ribbon.colors[offset + 2], T.SRGBColorSpace).toArray(ribbon.colors, offset);
      }
      geometry.setAttribute('position', new T.BufferAttribute(ribbon.positions, 3));
      geometry.setAttribute('color', new T.BufferAttribute(ribbon.colors, 3));
      geometry.setIndex(new T.BufferAttribute(ribbon.indices, 1));
      geometry.computeVertexNormals();
      const material = new T.MeshStandardMaterial({vertexColors: true, roughness: 0.48, metalness: 0.15});
      const road = new T.Mesh(geometry, material);
      model.add(road);
      cleanups.push(() => { geometry.dispose(); material.dispose(); });

      const baseGeometry = new T.BufferGeometry().setFromPoints(ribbon.centerline.map(([x, , z]) => new T.Vector3(x, ribbon.floorY, z)));
      const baseMaterial = new T.LineBasicMaterial({color: 0x81979c, transparent: true, opacity: 0.25});
      model.add(new T.LineLoop(baseGeometry, baseMaterial));
      cleanups.push(() => { baseGeometry.dispose(); baseMaterial.dispose(); });

      const pins = [
        {point: ribbon.highest, elevation: ribbon.maxElevation, title: '高', color: 0xffb448},
        {point: ribbon.lowest, elevation: ribbon.minElevation, title: '低', color: 0x39c5d4},
      ].map(({point, elevation, title, color}) => {
        const position = new T.Vector3(...point);
        const sphere = new T.SphereGeometry(0.85, 12, 8);
        const markerMaterial = new T.MeshBasicMaterial({color});
        const marker = new T.Mesh(sphere, markerMaterial);
        marker.position.copy(position).add(new T.Vector3(0, 0.8, 0));
        model.add(marker);
        const guide = new T.BufferGeometry().setFromPoints([new T.Vector3(point[0], ribbon.floorY, point[2]), position]);
        const guideMaterial = new T.LineBasicMaterial({color, transparent: true, opacity: 0.55});
        model.add(new T.Line(guide, guideMaterial));
        const label = document.createElement('span');
        label.className = 'circuit-elevation-pin';
        label.textContent = title + ' ' + Math.round(elevation) + ' m';
        label.style.borderColor = '#' + color.toString(16).padStart(6, '0');
        const connector = document.createElement('span');
        connector.className = 'circuit-elevation-connector';
        connector.style.backgroundColor = label.style.borderColor;
        connector.setAttribute('aria-hidden', 'true');
        mount.appendChild(connector);
        mount.appendChild(label);
        cleanups.push(() => { sphere.dispose(); markerMaterial.dispose(); guide.dispose(); guideMaterial.dispose(); label.remove(); connector.remove(); });
        return {position: position.add(new T.Vector3(0, 2.5, 0)), label, connector};
      });

      scene.add(new T.AmbientLight(0xffffff, 1.1));
      const light = new T.DirectionalLight(0xffffff, 2);
      light.position.set(-20, 100, 60);
      scene.add(light);
      const camera = new T.PerspectiveCamera(35, 1, 0.1, 1000);
      const initialDirection = new T.Vector3(20, 85, 140).normalize();
      camera.position.copy(initialDirection).multiplyScalar(180);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.enableZoom = large;
      controls.enableRotate = large || interactive;
      controls.maxPolarAngle = Math.PI * 0.88;
      cleanups.push(() => controls.dispose());
      model.updateMatrixWorld(true);
      const sphere = new T.Box3().setFromObject(road).getBoundingSphere(new T.Sphere());
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
        controls.update();
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
      function draw() {
        frame = requestAnimationFrame(draw);
        if (!visible || document.hidden) return;
        if (needsResize) {
          needsResize = false;
          const box = mount.getBoundingClientRect();
          width = Math.round(box.width); height = Math.round(box.height);
          if (width && height) { renderer.setSize(width, height, false); camera.aspect = width / height; fit(); }
        }
        controls.update();
        if (!dirty || !width || !height) return;
        renderer.render(scene, camera);
        const projectedPins = pins.map(pin => {
          const point = pin.position.clone().applyMatrix4(model.matrixWorld).project(camera);
          return {pin, point, x: (point.x + 1) * width / 2, y: (1 - point.y) * height / 2};
        });
        const [high, low] = projectedPins;
        const overlaps = Math.abs(high.x - low.x) < 70 && Math.abs(high.y - low.y) < 26;
        const middleY = (high.y + low.y) / 2;
        for (const projected of projectedPins) {
          const {pin, point, x, y} = projected;
          const labelY = overlaps ? middleY + (projected === high ? -16 : 16) : y;
          pin.label.style.transform = `translate(${x}px, ${labelY}px) translate(-50%, -100%)`;
          pin.label.hidden = point.z < -1 || point.z > 1;
          pin.connector.style.transform = `translate(${x}px, ${y}px) rotate(${Math.atan2(labelY - y, 0)}rad)`;
          pin.connector.style.width = Math.abs(labelY - y) + 'px';
          pin.connector.hidden = pin.label.hidden;
        }
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
    <p className="circuit-elevation-summary">地形高差 ≈ {Math.round(profile.elevationRange)} m <span>高度 ×{verticalScale}</span></p>
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
        <p className="section-note">拖动旋转 · 双指缩放 · 高度按 {verticalScale} 倍显示</p>
        <p className="circuit-elevation-credit">海拔约 {Math.round(profile.minElevation)}–{Math.round(profile.maxElevation)} m，按 90 米地形数据估算。
          数据来自 <a href="https://open-meteo.com/en/docs/elevation-api" target="_blank" rel="noreferrer">Copernicus DEM / Open-Meteo</a>。
        </p>
      </div>
    </dialog>}
  </>;
}
