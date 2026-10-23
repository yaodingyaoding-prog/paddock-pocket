import { Flag } from 'lucide-react';

const circuit = 'M110 240 L242 240 Q253 240 259 230 L286 182 Q292 172 304 172 L332 172 Q346 172 350 158 L364 113 Q369 97 389 97 L460 97 Q474 97 483 108 L527 161 Q534 170 546 170 L594 170 Q618 170 618 194 L618 229 Q618 247 600 253 L549 270 Q532 276 524 261 L508 232 Q502 222 490 222 L453 222 Q438 222 431 234 L402 281 Q395 293 381 293 L327 293 Q313 293 306 280 L296 261 Q290 251 277 251 L257 251 Q247 251 240 260 L209 302 Q200 314 184 314 L112 314 Q90 314 90 292 L90 260 Q90 240 110 240 Z';

export function AuthRaceScene() {
  return <aside className="auth-story" aria-label="围场口袋">
    <a className="auth-brand" href="/login"><span className="auth-brand-icon"><Flag size={22}/></span><span>围场口袋<small>PADDOCK POCKET</small></span></a>
    <div className="auth-race-heading"><p className="auth-kicker">FOR THE LOVE OF RACING</p><h1>LIGHTS<br/><span>OUT.</span></h1><p className="auth-race-caption">你的比赛周末，现在发车。</p></div>
    <div className="auth-circuit-stage" aria-hidden="true">
      <div className="auth-stage-grid"/>
      <div className="auth-start-lights">{[0,1,2,3,4].map(index=><span className="auth-light-pod" key={index} style={{'--light-index':index} as React.CSSProperties}><i/><i/></span>)}</div>
      <span className="auth-stage-label">THE RACING LINE</span>
      <svg className="auth-race-circuit" viewBox="50 60 620 300" fill="none">
        <path className="auth-circuit-bed" d={circuit}/>
        <path className="auth-circuit-kerb" d={circuit} pathLength="1000"/>
        <path className="auth-circuit-road" d={circuit}/>
        <path className="auth-circuit-center" d={circuit} pathLength="1000"/>
        <path className="auth-circuit-trace trace-lead" d={circuit} pathLength="1000"/>
        <path className="auth-circuit-trace trace-chase" d={circuit} pathLength="1000"/>
        <path d="M131 231V250M137 231V250M143 231V250" stroke="#eaf0ed" strokeWidth="3"/>
        <path d="M125 226V255" stroke="#ff5148" strokeWidth="2"/>
        <g className="auth-sector-tag"><text x="355" y="79">S1</text><text x="630" y="204">S2</text><text x="170" y="342">S3</text></g>
      </svg>
      <div className="auth-sector-strip">{['01','02','03'].map((sector,index)=><span key={sector} style={{'--sector-index':index} as React.CSSProperties}><small>SECTOR {sector}</small><i/></span>)}</div>
    </div>
    <div className="auth-race-footer"><span className="auth-checker" aria-hidden="true"/><span>EVERY LAP. EVERY WEEKEND.</span><small>F1.xiaodinglab.com</small></div>
  </aside>;
}
