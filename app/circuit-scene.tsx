'use client';
import {useEffect,useRef,useState} from 'react';
import {Maximize,RotateCcw,X,Move3D} from 'lucide-react';
import models from '../lib/circuit-models.json';
import images from '../lib/circuit-images.json';
import {circuitCameraDistance} from '../lib/circuit-camera';
type Row=Record<string,any>;
function Scene({file,preview,name,large=false,interactive=false}:{file:string;preview?:string;name?:string;large?:boolean;interactive?:boolean}){
 const host=useRef<HTMLDivElement>(null),reset=useRef<()=>void>(()=>{});
 const [failed,setFailed]=useState(false),[ready,setReady]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let gone=false,frame=0,dispose=()=>{};const abort=new AbortController();setFailed(false);setReady(false);
  // Bound the entire attempt, including imports. A stalled engine download
  // must expose recovery just like a failed model request.
  const deadline=setTimeout(()=>{abort.abort();dispose();if(!gone)setFailed(true);},15000);
  (async()=>{
   const [T,{STLLoader},{OrbitControls}]=await Promise.all([import('three'),import('three/addons/loaders/STLLoader.js'),import('three/addons/controls/OrbitControls.js')]);
   if(gone||abort.signal.aborted||!host.current)return;const mount=host.current;
   const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);mount.appendChild(renderer.domElement);
   let dirty=true,needsResize=true,renderWidth=0,renderHeight=0;
   const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,1000);camera.position.set(15,115,130);
   const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.enableZoom=large;controls.enableRotate=large||interactive;controls.minDistance=60;controls.maxDistance=330;controls.maxPolarAngle=Math.PI*.88;controls.addEventListener('change',()=>{dirty=true;});
   dispose=()=>{controls.dispose();renderer.dispose();renderer.domElement.remove();};
   const response=await fetch(file,{signal:abort.signal});
   if(!response.ok)throw Error('Circuit model unavailable');
   const geometry=new STLLoader().parse(await response.arrayBuffer());if(gone||abort.signal.aborted){geometry.dispose();renderer.dispose();renderer.domElement.remove();return;}
   geometry.center();geometry.rotateX(-Math.PI/2);geometry.computeVertexNormals();
   const material=new T.MeshStandardMaterial({color:0x55e8ca,roughness:.48,metalness:.12,emissive:0x0e4239,emissiveIntensity:.3});const mesh=new T.Mesh(geometry,material);mesh.rotation.y=-.28;mesh.scale.y=2;scene.add(mesh);
   const bounds=new T.Box3().setFromObject(mesh),sphere=bounds.getBoundingSphere(new T.Sphere()),initialDirection=new T.Vector3(15,115,130).normalize();
   const fit=(resetView=false)=>{const direction=resetView?initialDirection:camera.position.clone().sub(controls.target).normalize();const distance=circuitCameraDistance(sphere.radius,camera.aspect);controls.target.copy(sphere.center);camera.position.copy(sphere.center).addScaledVector(direction,distance);controls.maxDistance=Math.max(330,distance*2.5);controls.minDistance=Math.min(60,distance*.35);camera.far=Math.max(1000,distance*5);camera.updateProjectionMatrix();controls.update();dirty=true;};
   scene.add(new T.AmbientLight(0xffffff,1.5));const key=new T.DirectionalLight(0xe8fff9,3.2);key.position.set(-20,100,50);scene.add(key);const fill=new T.DirectionalLight(0x1d8b91,1.4);fill.position.set(30,-20,-80);scene.add(fill);
   const accent=()=>{const color=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();if(color)material.color.set(color).lerp(new T.Color(0xb6ffe8),.45);dirty=true;};accent();const theme=new MutationObserver(accent);theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-accent']});
   const resize=()=>{const rect=mount.getBoundingClientRect(),width=Math.round(rect.width),height=Math.round(rect.height);if(!width||!height||width===renderWidth&&height===renderHeight)return;renderWidth=width;renderHeight=height;renderer.setSize(width,height,false);camera.aspect=width/height;fit();};const observer=new ResizeObserver(()=>{needsResize=true;});observer.observe(mount);resize();
   reset.current=()=>fit(true);
   let visible=true;const inView=new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)dirty=true;});inView.observe(mount);
   const animate=()=>{frame=requestAnimationFrame(animate);if(!visible||document.hidden)return;if(needsResize){needsResize=false;resize();}controls.update();if(dirty){renderer.render(scene,camera);dirty=false;}};animate();
   dispose=()=>{cancelAnimationFrame(frame);observer.disconnect();inView.disconnect();theme.disconnect();controls.dispose();geometry.dispose();material.dispose();renderer.dispose();renderer.domElement.remove();};
   clearTimeout(deadline);if(!gone)setReady(true);
  })().catch(()=>{clearTimeout(deadline);dispose();if(!gone)setFailed(true);});
  return()=>{gone=true;clearTimeout(deadline);abort.abort();cancelAnimationFrame(frame);dispose();};
 },[file,large,interactive,attempt]);
 return <div className={'track-scene '+(large?'large':'')}>
  {!ready&&preview&&<img className="circuit-flat-preview" src={preview} alt={(name||'赛道')+'平面布局'}/>}
  <div ref={host} role="img" aria-label="立体赛道轮廓"/>
  {!ready&&<span className="circuit-load-status" role="status">{failed?'3D 暂不可用，仍可查看平面布局':'正在加载 3D…'}</span>}
  {failed&&<button className="circuit-enable" onClick={()=>setAttempt(value=>value+1)}>重试 3D</button>}
  {(large||interactive)&&ready&&<button className="scene-reset" aria-label="重置视角" title="重置视角" onClick={()=>reset.current()}><RotateCcw size={16}/></button>}
 </div>;
}
export function CircuitPreview({circuit,interactive=false}:{circuit:Row;interactive?:boolean}){
 const entry=(models as any)[circuit?.id];const [open,setOpen]=useState(false),[enabled,setEnabled]=useState(false);const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const element=dialog.current;if(!element)return;if(open){if(typeof element.showModal==='function')element.showModal();else element.setAttribute('open','');}else if(typeof element.close==='function')element.close();else element.removeAttribute('open');},[open]);
 useEffect(()=>{setOpen(false);setEnabled(false);},[circuit?.id]);
 if(!entry)return <div className="track-pending"><Move3D/><small>赛道模型待补充</small></div>;
 const flat=images.circuits.find(c=>c.id===circuit.id);
 return <><div className={"circuit-preview"+(interactive?" inline-interactive":"")}>
  {enabled?<Scene key={circuit.id} file={entry.file} preview={flat?.file} name={circuit.name} interactive={interactive}/>:<div className="track-scene">{flat&&<img className="circuit-flat-preview" src={flat.file} alt={circuit.name+'平面布局'}/>}<button className="circuit-enable" onClick={()=>setEnabled(true)}>启用 3D</button></div>}
  <button className="scene-maximize" aria-label={"放大"+circuit.name+"3D赛道"} onClick={()=>setOpen(true)}><Maximize size={16}/></button>
 </div>{open&&<dialog ref={dialog} className="sheet circuit-viewer" onCancel={()=>setOpen(false)}><div className="sheet-head"><div><h2>{circuit.name}</h2></div><button className="icon-button" aria-label="关闭" onClick={()=>setOpen(false)}><X size={21}/></button></div><div className="sheet-body"><Scene key={circuit.id} file={entry.file} preview={flat?.file} name={circuit.name} large/><p className="section-note">拖动旋转 · 双指缩放</p>{flat&&<details className="flat-track"><summary>查看详细平面布局</summary><img src={flat.file} alt={circuit.name+'详细布局'}/><small>现用布局 · © Formula 1</small></details>}</div></dialog>}</>;
}
