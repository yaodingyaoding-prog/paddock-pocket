import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {RecoverableSection} from '../app/recoverable-section';
import {CircuitPreview} from '../app/circuit-scene';
import circuits from '../lib/circuit-images.json';
import {Dialog} from '../app/dialog';
function BrokenModule(){throw new Error('Failed to fetch dynamically imported module');return null;}
function Fixture(){
 const [broken,setBroken]=useState(true),[dialog,setDialog]=useState(false);
 return <><nav><button onClick={()=>setBroken(false)}>返回赛程</button></nav>
 <RecoverableSection key={String(broken)}>{broken?<BrokenModule/>:<p>赛程正常显示</p>}</RecoverableSection>
 <button onClick={()=>setDialog(true)}>打开资料</button>
 {dialog&&<Dialog title="资料" close={()=>setDialog(false)}><RecoverableSection><BrokenModule/></RecoverableSection></Dialog>}
 <CircuitPreview circuit={circuits.circuits[0]} interactive/>
 </>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
