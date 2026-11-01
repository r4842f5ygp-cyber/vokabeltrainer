const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const C=require('../core.js');
const code=fs.readFileSync(require.resolve('../data.js'),'utf8');
const old={id:'1',front:'Enge',back:'tightness',notes:'',reps:2,interval:3,ease:2.5,due:123456};
function harness({raw=JSON.stringify([old]),fetcher,device='device-a'}={}) {
 const items=new Map([['wesentlich_vocab_cards_v1',raw],['wesentlich_vocab_device_v2',device]]), els=new Map();let fail=false;
 const el=id=>{if(!els.has(id)) els.set(id,{value:'',textContent:'',disabled:false,children:[],classList:{add(){},remove(){},toggle(){},contains(){return true;}},append(...x){this.children.push(...x);},replaceChildren(){this.children=[];},showModal(){},close(){}});return els.get(id);};
 const context=vm.createContext({VocabCore:C,crypto:require('node:crypto').webcrypto,Date,JSON,Blob,URL,TextDecoder,Uint8Array,AbortController,structuredClone,console,
 navigator:{onLine:true},setTimeout:()=>1,clearTimeout(){},confirm:()=>true,alert(){},
 localStorage:{getItem:k=>items.get(k)||null,setItem(k,v){if(fail)throw new Error('quota');items.set(k,v);}},
 document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){},createElement:()=>el('tmp'),body:{appendChild(){}}},window:{addEventListener(){}},
 fetch:fetcher||(()=>{throw new Error('offline');}),updateStats(){},renderCardList(){},
 STORAGE_KEY:'wesentlich_vocab_cards_v1',GITHUB_TOKEN_KEY:'wesentlich_gh_token',GITHUB_GIST_KEY:'wesentlich_gh_gist',cards:[]});
 vm.runInContext(code,context); const run=s=>vm.runInContext(s,context);run('loadData()');return {run,items,el,fail:()=>{fail=true;}};
}
function connect(h){h.items.set('wesentlich_gh_token','test-only');h.items.set('wesentlich_gh_gist','abc');}
test('migration retains untouched v1 recovery copy',()=>{const h=harness();assert.equal(h.items.get('wesentlich_vocab_cards_v1'),JSON.stringify([old]));assert.equal(h.run('cards[0].reps'),2);});
test('corrupt local data blocks writes and network sync without overwriting original',async()=>{
 let calls=0;const h=harness({raw:'BROKEN',fetcher:async()=>{calls++;}});connect(h);await h.run('syncNow()');
 assert.equal(h.run('storageBlocked'),true);assert.equal(calls,0);assert.equal(h.items.get('wesentlich_vocab_cards_v1'),'BROKEN');
});
test('failed storage write leaves current state and input intact',()=>{
 const h=harness();h.el('paste-input').value='neu;new';h.fail();h.run('autoPasteImport()');
 assert.equal(h.run('cards.length'),1);assert.equal(h.el('paste-input').value,'neu;new');assert.match(h.el('paste-result').textContent,/Nicht gespeichert/);
});
test('paste auto-add, duplicate skipping and undo preserve previous cards',()=>{
 const h=harness();h.el('paste-input').value='neu;new\nEnge;tightness';h.run('autoPasteImport()');assert.equal(h.run('cards.length'),2);
 h.run('autoPasteImport()');assert.equal(h.run('cards.length'),2);h.run('undoPasteImport()');assert.equal(h.run('cards.length'),1);assert.equal(h.run('cards[0].base.reps'),2);
});
test('paste with invalid rows is all-or-nothing',()=>{
 const h=harness();h.el('paste-input').value='neu;new\nmissing;';h.run('autoPasteImport()');assert.equal(h.run('cards.length'),1);assert.match(h.el('paste-result').textContent,/Noch nichts/);
});
test('HTTP failures never report synchronized and preserve local data',async()=>{
 for(const status of [401,403,429,500]) {
  const h=harness({fetcher:async()=>({ok:false,status})});connect(h);await h.run('syncNow()');
  assert.equal(h.run('cards.length'),1);assert.match(h.el('global-sync-status').textContent,/bleiben lokal/);assert.doesNotMatch(h.el('global-sync-status').textContent,/^Synchronisiert/);
 }
});
test('failed PATCH is visible even after successful GET',async()=>{
 const h=harness({fetcher:async(url,o)=>o.method==='PATCH'?{ok:false,status:500}:{ok:true,json:async()=>({files:{'wesentlich_vocab.json':{content:JSON.stringify([old])}}})}});
 connect(h);await h.run('syncNow()');assert.match(h.el('global-sync-status').textContent,/HTTP 500/);
});
test('truncated or corrupt remote files stop before writing',async()=>{
 for(const file of [{truncated:true,content:'[]'},{content:'INVALID'}]) {
  let patches=0;const h=harness({fetcher:async(url,o)=>{if(o.method==='PATCH')patches++;return {ok:true,json:async()=>({files:{'wesentlich_vocab.json':file}})};}});
  connect(h);await h.run('syncNow()');assert.equal(patches,0);assert.equal(h.run('cards.length'),1);
 }
});
test('concurrent devices write distinct snapshots and subsequently converge',async()=>{
 const files={'wesentlich_vocab.json':{content:JSON.stringify([old])}};const writes=[];
 const fetcher=async(url,o)=>{if(o.method==='PATCH'){const updates=JSON.parse(o.body).files;writes.push(Object.keys(updates)[0]);Object.assign(files,updates);return{ok:true,json:async()=>({})};}return{ok:true,json:async()=>({files:structuredClone(files)})};};
 const a=harness({fetcher,device:'a'}),b=harness({fetcher,device:'b'});connect(a);connect(b);
 a.el('paste-input').value='Alpha;alpha';a.run('autoPasteImport()');b.el('paste-input').value='Beta;beta';b.run('autoPasteImport()');
 await Promise.all([a.run('syncNow()'),b.run('syncNow()')]);assert.equal(new Set(writes).size,2);
 await Promise.all([a.run('syncNow()'),b.run('syncNow()')]);assert.equal(a.run('cards.length'),3);assert.equal(b.run('cards.length'),3);
 assert.deepEqual(JSON.parse(a.run('JSON.stringify(state)')),JSON.parse(b.run('JSON.stringify(state)')));
});
test('overlapping sync requests are serialized within a page',async()=>{
 let gets=0;const h=harness({fetcher:async(url,o)=>{if(!o.method)gets++;return{ok:true,json:async()=>o.method?{}:{files:{'wesentlich_vocab.json':{content:JSON.stringify([old])}}}};}});
 connect(h);await Promise.all([h.run('syncNow()'),h.run('syncNow()')]);assert.equal(gets,1);
});
