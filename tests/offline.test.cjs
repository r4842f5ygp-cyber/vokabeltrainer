const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function worker(){
 const handlers={},cache=new Map(),removed=[];let fetched=0,activated=0;
 const scope='https://example.org/vokabeltrainer/';
 const ctx=vm.createContext({URL,Request,Response,self:{registration:{scope},addEventListener:(n,f)=>handlers[n]=f,skipWaiting:()=>activated++},
 caches:{open:async()=>({addAll:async urls=>urls.forEach(u=>cache.set(u.url,{cached:true})),match:async r=>{const value=cache.get(typeof r==='string'?r:r.url);return value instanceof Response?value.clone():value;}}),keys:async()=>['vocab-app:'+scope+':old','vocab-app:'+scope+'vorschau/:other'],delete:async k=>removed.push(k)},fetch:async()=>{fetched++;throw Error('offline');}});
 vm.runInContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),ctx);
 return{handlers,cache,removed,get fetched(){return fetched;},get activated(){return activated;},scope,run:s=>vm.runInContext(s,ctx)};
}
test('offline installation includes every required local asset',async()=>{
 const w=worker();let promise;w.handlers.install({waitUntil:p=>promise=p});await promise;
 for(const url of w.cache.keys()){const file=new URL(url).pathname.slice(new URL(w.scope).pathname.length)||'index.html';assert.ok(fs.existsSync(path.join(root,file)),file);}
 const required=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
 required.push('emotion-table.css','assets/emotions.jpg',...JSON.parse(fs.readFileSync(path.join(root,'assets/audio-manifest.json'),'utf8')).files.map(c=>c.file));
 for(const file of required)assert.ok(w.cache.has(new URL(file,w.scope).href),'not cached: '+file);
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

test('cached audio serves Safari byte ranges offline including suffix and invalid-range responses',async()=>{
 const w=worker(),file=JSON.parse(fs.readFileSync(path.join(root,'assets/audio-manifest.json'),'utf8')).files[0].file,url=w.scope+file;
 w.cache.set(url,new Response(Uint8Array.from([10,20,30,40,50]),{headers:{'Content-Type':'audio/mpeg'}}));
 for(const [range,status,expected]of [['bytes=1-3',206,[20,30,40]],['bytes=-2',206,[40,50]],['bytes=3-',206,[40,50]],['bytes=90-',416,[]]]){
  let response;w.handlers.fetch({request:{method:'GET',url,headers:{get:()=>range}},respondWith:p=>response=p});
  const result=await response;assert.equal(result.status,status);assert.deepEqual([...new Uint8Array(await result.arrayBuffer())],expected);
  assert.ok(result.headers.get('Content-Range'));
 }
 assert.equal(w.fetched,0);
});


