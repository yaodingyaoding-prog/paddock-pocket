import assert from 'node:assert/strict';
import { contentTransition, motionRecipe } from '../lib/content-motion';
import { createPageMotion } from '../lib/page-motion';

let commits=0,cancels=0;
const pending:Array<{finish:()=>void;reject:(e:Error)=>void}>=[];
const surface={animate:()=>{
  let finish!:()=>void,reject!:(e:Error)=>void;
  const finished=new Promise<void>((resolve,fail)=>{finish=resolve;reject=fail;});
  pending.push({finish,reject});
  return {finished,cancel(){cancels++;reject(Error('superseded'));}};
}};
const first=contentTransition(()=>commits++,()=>surface,18);
assert.equal(commits,1,'Navigation commits immediately, without an outgoing wait');
first.skipTransition();await first.finished;
assert.equal(cancels,1,'Interruption cancels its animation');
assert.equal(commits,1,'Cancelling an entrance never rolls the route back or repeats its update');
const second=contentTransition(()=>commits++,()=>surface,18);
assert.equal(commits,2);
pending.at(-1)!.finish();await second.finished;
assert.equal(commits,2,'Finishing an entrance cannot repeat navigation');
await contentTransition(()=>commits++,()=>null,18).finished;
assert.equal(commits,3,'An empty destination remains usable');

const tab=motionRecipe('tab',18),detail=motionRecipe('detail',18),back=motionRecipe('return',-18);
assert.notDeepEqual(tab.frames,detail.frames,'Main destinations and detail pages have different motion');
assert.notDeepEqual(detail.frames,back.frames,'Returning moves in the opposite direction');
assert.equal(motionRecipe('detail',-18).frames[0].transform,'translate3d(-22px,0,0)');
for(const recipe of [tab,detail,back]){
  assert(Number(recipe.options.duration)<=400);
  assert.equal(recipe.options.fill,'backwards','Staggered blocks start in place before their delay and leave no forwards fill');
  assert.deepEqual(Object.keys(recipe.frames[0]).sort(),['opacity','transform'],'No animated layout, blur or filter');
}
const routes:string[]=[],signals:boolean[]=[];
const navigate=createPageMotion({enabled:()=>true,signal:on=>signals.push(on),start:update=>contentTransition(update,()=>surface,18)});
navigate(()=>routes.push('schedule'));navigate(()=>routes.push('rankings'));navigate(()=>routes.push('profile'));
assert.deepEqual(routes,['schedule','rankings','profile'],'Rapid clicks synchronously select each requested destination');
pending.at(-1)!.finish();await new Promise<void>(resolve=>setImmediate(resolve));
assert.equal(routes.at(-1),'profile','Cancelled predecessors cannot overwrite the last destination');
assert.equal(signals.at(-1),false,'Rapid navigation settles and releases transition state');
let failedCommits=0;
const failure=createPageMotion({enabled:()=>true,signal:()=>{},start:update=>contentTransition(update,()=>({animate(){throw Error('unavailable');}}),18)});
failure(()=>failedCommits++);assert.equal(failedCommits,1,'Animation failures cannot block or duplicate navigation');
console.log('Motion: immediate commits, cancellation, rapid retargeting, cleanup, distinct recipes and animation failure passed.');
