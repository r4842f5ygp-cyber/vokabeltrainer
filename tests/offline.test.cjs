const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function worker(){
 const handlers={},cache=new Map(),removed=[];let fetched=0,activated=0;
 const scope='https://example.org/vokabeltrainer/';
 const ctx=vm.createContext({URL,self:{registration:{scope},addEventListener:(n,f)=>handlers[n]=f,skipWaiting:()=>activated++},
 caches:{open:async()=>({addAll:async urls=>urls.forEach(u=>cache.set(u,{cached:true})),match:async r=>cache.get(typeof r==='string'?r:r.url)}),keys:async()=>['vocab-app:'+scope+':old','vocab-app:'+scope+'vorschau/:other'],delete:async k=>removed.push(k)},fetch:async()=>{fetched++;throw Error('offline');}});
 vm.runInContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),ctx);
 return{handlers,cache,removed,get fetched(){return fetched;},get activated(){return activated;},scope,run:s=>vm.runInContext(s,ctx)};
}
test('offline installation includes every required local asset',async()=>{
 const w=worker();let promise;w.handlers.install({waitUntil:p=>promise=p});await promise;
 for(const url of w.cache.keys()){const file=new URL(url).pathname.split('/').pop()||'index.html';assert.ok(fs.existsSync(path.join(root,file)),file);}
 assert.equal(w.cache.size,14);
});
test('cached navigation and scripts work with network unavailable',async()=>{
 const w=worker();let p;w.handlers.install({waitUntil:q=>p=q});await p;
 for(const file of ['', 'app.js']){let response;w.handlers.fetch({request:{method:'GET',url:w.scope+file},respondWith:p=>response=p});assert.ok((await response).cached);}
 assert.equal(w.fetched,0);
});
test('API calls, POSTs and preview pages are never intercepted',()=>{
 const w=worker();for(const [method,url]of [['GET','https://api.github.com/gists/123'],['POST',w.scope],['GET',w.scope+'vorschau/']]){
  let intercepted=false;w.handlers.fetch({request:{method,url},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
 }
});
test('updates activate only on request and cache cleanup preserves other scopes',async()=>{
 const w=worker();assert.equal(w.activated,0);w.handlers.message({data:'ACTIVATE'});assert.equal(w.activated,1);
 let p;w.handlers.activate({waitUntil:q=>p=q});await p;assert.equal(w.removed.length,1);assert.match(w.removed[0],/:old$/);
});

