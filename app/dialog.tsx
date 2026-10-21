'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {X} from 'lucide-react';
export function Dialog({title,children,close}:{title:string;children:React.ReactNode;close:()=>void}){
 const ref=useRef<HTMLDialogElement>(null),[mounted,setMounted]=useState(false);
 useEffect(()=>setMounted(true),[]);
 useEffect(()=>{if(!mounted)return;const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[mounted]);
 if(!mounted)return null;
 return createPortal(<dialog ref={ref} aria-label={title} className="sheet" onCancel={close} onClick={e=>{if(e.target===ref.current)close();}}><div className="sheet-head"><h2>{title}</h2><button className="icon-button" aria-label="关闭" onClick={close}><X size={21}/></button></div><div className="sheet-body">{children}</div></dialog>,document.body);
}
