// Small in-page shims avoid a polyfill CDN and run before any application modules.
export const browserSupportScript = `(function(){
  if(!Object.hasOwn)Object.hasOwn=function(value,key){return Object.prototype.hasOwnProperty.call(value,key);};
  if(!Array.prototype.at)Object.defineProperty(Array.prototype,'at',{value:function(index){index=Math.trunc(index)||0;return this[index<0?this.length+index:index];},configurable:true,writable:true});
  if(!Promise.allSettled)Promise.allSettled=function(values){return Promise.all(Array.from(values).map(function(value){return Promise.resolve(value).then(function(v){return {status:'fulfilled',value:v};},function(e){return {status:'rejected',reason:e};});}));};
  var A=window.AbortSignal,C=window.AbortController;
  if(A&&C&&!A.timeout)A.timeout=function(ms){var c=new C();setTimeout(function(){c.abort();},ms);return c.signal;};
  if(A&&C&&!A.any)A.any=function(signals){var c=new C(),cleanups=[];function stop(signal){if(c.signal.aborted)return;c.abort(signal.reason);cleanups.forEach(function(clean){clean();});}Array.from(signals).some(function(signal){if(signal.aborted){stop(signal);return true;}var listener=function(){stop(signal);};signal.addEventListener('abort',listener,{once:true});cleanups.push(function(){signal.removeEventListener('abort',listener);});return false;});return c.signal;};
})();`;
