'use client';
import {Component, type ReactNode} from 'react';

// Keep navigation outside this boundary. Remount it on route changes so a failed
// lazy import cannot leave every subsequent page stuck on the same error.
export class RecoverableSection extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){
  if(!this.state.failed)return this.props.children;
  return <section className="card empty" role="alert">
   <h2>这个模块暂时未能打开</h2>
   <p>文件可能下载中断。你可以先浏览其他页面，或重新加载后再试。</p>
   <button className="small-button" onClick={()=>window.location.reload()}>重新加载此页面</button>
  </section>;
 }
}
