'use client';
import {useEffect,useRef,useState} from 'react';
import {Maximize,RotateCcw,X,Move3D} from 'lucide-react';
import models from '../lib/circuit-models.json';
import images from '../lib/circuit-images.json';
type Row=Record<string,any>;
function Scene({file,large=false,interactive=false}:{file:string;large?:boolean;interactive?:boolean}){
 const host=useRef<HTMLDivElement>(null),reset=useRef<()=>void>(()=>{});
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  let gone=false,frame=0,dispose=()=>{};setFailed(false);
  (async()=>{
   const [T,{STLLoader},{OrbitControls}]=await Promise.all([import('three'),import('three/addons/loaders/STLLoader.js'),import('three/addons/controls/OrbitControls.js')]);
   if(gone||!host.current)return;const mount=host.current;
   const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);mount.appendChild(renderer.domElement);
   const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,1000);camera.position.set(15,115,130);
   const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.enableZoom=large;controls.enableRotate=large||interactive;controls.minDistance=60;controls.maxDistance=330;controls.maxPolarAngle=Math.PI*.88;
   dispose=()=>{controls.dispose();renderer.dispose();renderer.domElement.remove();};
   const geometry=await new STLLoader().loadAsync(file);if(gone){geometry.dispose();renderer.dispose();renderer.domElement.remove();return;}
   geometry.center();geometry.rotateX(-Math.PI/2);geometry.computeVertexNormals();
   const material=new T.MeshStandardMaterial({color:0x55e8ca,roughness:.48,metalness:.12,emissive:0x0e4239,emissiveIntensity:.3});const mesh=new T.Mesh(geometry,material);mesh.rotation.y=-.28;mesh.scale.y=2;scene.add(mesh);
   scene.add(new T.AmbientLight(0xffffff,1.5));const key=new T.DirectionalLight(0xe8fff9,3.2);key.position.set(-20,100,50);scene.add(key);const fill=new T.DirectionalLight(0x1d8b91,1.4);fill.position.set(30,-20,-80);scene.add(fill);
   const accent=()=>{const color=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();if(color)material.color.set(color).lerp(new T.Color(0xb6ffe8),.45);};accent();const theme=new MutationObserver(accent);theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-accent']});
   const resize=()=>{const {width,height}=mount.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(mount);resize();
   const initial=camera.position.clone();reset.current=()=>{camera.position.copy(initial);controls.target.set(0,0,0);controls.update();};
   let visible=true;const inView=new IntersectionObserver(es=>{visible=es[0].isIntersecting;});inView.observe(mount);
   const animate=()=>{frame=requestAnimationFrame(animate);if(!visible||document.hidden)return;controls.update();renderer.render(scene,camera);};animate();
   dispose=()=>{cancelAnimationFrame(frame);observer.disconnect();inView.disconnect();theme.disconnect();controls.dispose();geometry.dispose();material.dispose();renderer.dispose();renderer.domElement.remove();};
  })().catch(()=>{dispose();if(!gone)setFailed(true);});
  return()=>{gone=true;cancelAnimationFrame(frame);dispose();};
 },[file,large,interactive]);
 return <div className={'track-scene '+(large?'large':'')}><div ref={host} role="img" aria-label="立体赛道轮廓"/>{failed&&<div className="scene-unavailable"><Move3D size={24}/><span>当前设备无法启用 3D</span></div>}{(large||interactive)&&!failed&&<button className="small-button scene-reset" onClick={()=>reset.current()}><RotateCcw size={14}/>重置视角</button>}</div>;
}
export function CircuitPreview({circuit,interactive=false}:{circuit:Row;interactive?:boolean}){
 const entry=(models as any)[circuit?.id];const [open,setOpen]=useState(false);const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
 useEffect(()=>setOpen(false),[circuit?.id]);
 if(!entry)return <div className="track-pending"><Move3D/><small>赛道模型待补充</small></div>;
 const flat=images.circuits.find(c=>c.id===circuit.id);
 return <><div className={"circuit-preview"+(interactive?" inline-interactive":"")}><Scene file={entry.file} interactive={interactive}/><button className="scene-maximize" aria-label={"放大"+circuit.name+"3D赛道"} onClick={()=>setOpen(true)}><Maximize size={13}/>放大</button></div>{open&&<dialog ref={dialog} className="sheet circuit-viewer" onCancel={()=>setOpen(false)}><div className="sheet-head"><div><p className="eyebrow">CIRCUIT IN THREE DIMENSIONS</p><h2>{circuit.name}</h2></div><button className="icon-button" aria-label="关闭" onClick={()=>setOpen(false)}><X size={21}/></button></div><div className="sheet-body"><Scene file={entry.file} large/><p className="section-note">拖动旋转 · 双指缩放 · 依据赛道坐标重建立体轮廓，模型不包含实际海拔起伏。</p>{flat&&<details className="flat-track"><summary>查看详细平面布局</summary><img src={flat.file} alt={circuit.name+'详细布局'}/><small>现用布局 · © Formula 1</small></details>}</div></dialog>}</>;
}
