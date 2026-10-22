type RunningAnimation={finished:Promise<unknown>;cancel():void;commitStyles?():void};
type Surface={animate(frames:Keyframe[],options:KeyframeAnimationOptions):RunningAnimation;sample?():Keyframe;clear?():void};

// Animate live content only. No document snapshot or second copy of the page is created.
export function contentTransition(update:()=>void,current:()=>Surface|null,travel:number){
 let cancelled=false,animation:RunningAnimation|undefined;
 const ready=Promise.resolve();
 const finished=(async()=>{
  const outgoing=current();
  if(outgoing){
   animation=outgoing.animate([outgoing.sample?.()||{opacity:1,transform:'translate3d(0,0,0)'},{opacity:.78,transform:`translate3d(${-travel*.35}px,0,0)`}],{duration:75,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
   try{await animation.finished;}catch{return;}
  }
  if(cancelled)return;
  update();
  animation?.cancel();
  const incoming=current();
  if(!incoming)return;
  animation=incoming.animate([{opacity:.78,transform:`translate3d(${travel}px,0,0)`},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:235,easing:'cubic-bezier(.16,1,.3,1)'});
  try{await animation.finished;}catch{/* A newer destination takes over the active animation. */}
  if(!cancelled)incoming.clear?.();
 })();
 return {ready,finished,skipTransition(){cancelled=true;try{animation?.commitStyles?.();}catch{}animation?.cancel();}};
}
