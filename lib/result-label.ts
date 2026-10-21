export function resultLabel(p: Record<string, any>): string {
  if (p.q3 || p.q2 || p.q1) return p.q3 || p.q2 || p.q1;
  const r = p.result;
  if (!r) return p.time || p.fastestLap?.time || '—';
  if (r.resultStatus === 'Dnf') return `DNF · ${r.laps ?? '—'} 圈`;
  if (r.resultStatus === 'Dns') return '未发车';
  if (['Dsq', 'Dsqd', 'Disqualified'].includes(r.resultStatus)) return '取消资格';
  if (r.lapsBehindLeader > 0) return `落后 ${r.lapsBehindLeader} 圈`;
  if (r.position > 1 && r.gapToLeader && r.gapToLeader !== '0') return String(r.gapToLeader).startsWith('+') ? r.gapToLeader : `+${r.gapToLeader}`;
  return r.time || p.fastestLap?.time || '—';
}
