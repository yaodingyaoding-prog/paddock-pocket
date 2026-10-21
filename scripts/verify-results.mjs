import assert from 'node:assert/strict';
import { resultLabel } from '../lib/result-label.ts';
// Different API shapes must preserve the actual sporting meaning.
assert.equal(resultLabel({ position: 1, time: '1:32.274' }), '1:32.274');
assert.equal(resultLabel({ q1: '1:33.241', q2: '1:31.639', q3: '1:31.373' }), '1:31.373');
assert.equal(resultLabel({ q1: '1:33.241', q2: null, q3: null }), '1:33.241');
assert.equal(resultLabel({ result: { position: 1, time: '1:42:00.785', resultStatus: 'Ok' } }), '1:42:00.785');
assert.equal(resultLabel({ result: { position: 17, time: '1:42:21.305', resultStatus: 'Ok', lapsBehindLeader: 2 } }), '落后 2 圈');
assert.equal(resultLabel({ result: { position: 18, time: '1:39:58.746', resultStatus: 'Dnf', laps: 59 } }), 'DNF · 59 圈');
assert.equal(new Intl.DateTimeFormat('zh-CN', {timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date('2026-10-25T20:00:00Z')), '04:00');
console.log('7 result and timezone checks passed.');
