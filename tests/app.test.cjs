const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function boot(seed) {
 const els=new Map(), handlers={}, store=seed instanceof Map?new Map(seed):new Map(seed?[['wesentlich_vocab_cards_v1',JSON.stringify(seed)]]:[]);
 for(const match of html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*\bid="([^"]+)"[^>]*)>/g)) {
  const [,tag,attrs,id]=match,classes=new Set((attrs.match(/class="([^"]*)"/)?.[1]||'').split(/\s+/));
  els.set(id,{tagName:tag.toUpperCase(),id,value:id.endsWith('delimiter')?'auto':'',textContent:'',disabled:false,style:{},children:[],
   classList:{contains:n=>classes.has(n),add:(...ns)=>ns.forEach(n=>classes.add(n)),remove:(...ns)=>ns.forEach(n=>classes.delete(n)),toggle(n,on){if(on===undefined)on=!classes.has(n);on?classes.add(n):classes.delete(n);}},
   focus(){},blur(){},append(...items){this.children.push(...items);},appendChild(item){this.children.push(item);},replaceChildren(){this.children=[];},showModal(){this.open=true;},close(){this.open=false;},click(){},remove(){}});
 }
 const document={getElementById(id){assert.ok(els.has(id),'Missing HTML element: '+id);return els.get(id);},activeElement:{id:'',tagName:'BODY'},querySelectorAll:()=>[],addEventListener(){},createElement(){return {append(){},appendChild(){},click(){},remove(){}};},body:{appendChild(){}}};
 const c=vm.createContext({console,crypto:require('node:crypto').webcrypto,Date,JSON,structuredClone,AbortController,TextDecoder,Uint8Array,Blob,URL,
   navigator:{onLine:true},matchMedia:()=>({matches:false}),document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
   setTimeout:()=>1,clearTimeout(){},alert(){},confirm:()=>true,fetch:()=>{throw new Error('No external network permitted in this test');},
   window:{addEventListener:(name,fn)=>{handlers[name]=fn;}}});
 for(const script of [...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1])) vm.runInContext(fs.readFileSync(path.join(root,script),'utf8'),c,{filename:script});
 return {run:s=>vm.runInContext(s,c),els,store,handlers};
}
test('all scripts load in actual HTML order; empty startup works',()=>{
 const h=boot();assert.equal(h.els.get('total-count').textContent,0);assert.equal(h.els.get('empty-study').classList.contains('hidden'),false);
});
test('study, reveal and rating persist a review and survive restart',()=>{
 const h=boot([{id:'1',front:'Enge',back:'tightness',notes:'A note',reps:0,interval:0,ease:2.5,due:0}]);
 h.run('startRound()');assert.equal(h.els.get('front-text').textContent,'Enge');h.run('rateCard(2)');assert.equal(h.run('state.cards[0].reviews.length'),0);
 h.run('revealAnswer();rateCard(2)');assert.equal(h.run('state.cards[0].reviews.length'),1);assert.equal(h.run('cards[0].reps'),1);
 h.run('loadData()');assert.equal(h.run('cards[0].reps'),1);assert.equal(h.run('state.cards[0].reviews.length'),1);
});
test('paste dialog, import, card list and undo integrate with actual app',()=>{
 const h=boot();h.run("switchView('manage');openPasteDialog()");assert.equal(h.els.get('paste-dialog').open,true);
 h.els.get('paste-input').value='Deutsch\tEnglisch\tNotiz\nEnge\ttightness\tA note\nKontakt\tcontact\t';
 h.run('autoPasteImport()');assert.equal(h.run('cards.length'),2);assert.equal(h.els.get('card-list').children.length,2);
 h.run("switchView('study');startRound()");assert.ok(h.els.get('front-text').textContent);h.run('undoPasteImport()');assert.equal(h.run('cards.length'),0);
});
test('full CSV preview and confirm flow preserve existing cards',()=>{
 const h=boot([{id:'old',front:'Enge',back:'tightness',notes:'',reps:3,interval:5,ease:2.5,due:500}]);
 h.els.get('bulk-text-input').value='Deutsch;Englisch;Notiz\nKontakt;contact;Example\nEnge;tightness;';
 h.run('importBulkText()');assert.match(h.els.get('preview-summary').textContent,/1 neue Karten.*1 Dubletten/);assert.equal(h.run('cards.length'),1);
 h.run('confirmImport()');assert.equal(h.run('cards.length'),2);assert.equal(h.run('cards.find(c=>c.id==="old").reps'),3);
 assert.ok(h.store.get('wesentlich_vocab_before_import_v2'));
});
test('sentence answers with commas stay intact',()=>{
 const h=boot();assert.equal(h.run('checkUserAnswer("Yes, I notice that.","Yes, I notice that.").isMatch'),true);
});
test('HTML IDs are unique and all inline handlers parse',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const m of html.matchAll(/\bon(?:click|change|paste)="([^"]*)"/g)) assert.doesNotThrow(()=>new vm.Script('(function(event){'+m[1]+'})'));
});
const seedCards=(n,reps=0)=>Array.from({length:n},(_,i)=>({id:String(i),front:'Begriff '+i,back:'term '+i,notes:'',reps,interval:reps?3:0,ease:2.5,due:0}));
test('round ends after six reviews and never rolls into an endless queue',()=>{
 const h=boot(seedCards(10,2));h.run('startRound()');assert.equal(h.run('round.ids.length'),6);
 for(let i=0;i<6;i++)h.run('revealAnswer();rateCard(2)');
 assert.equal(h.run('currentCard'),null);assert.equal(h.els.get('round-complete').classList.contains('hidden'),false);
 assert.equal(h.run('roundReviews().length'),6);assert.equal(h.run('getDueCards().length'),4);
});
test('new cards are limited to five per calendar day, with existing reviews still available',()=>{
 const h=boot(seedCards(10));h.run('startRound()');assert.equal(h.run('round.ids.length'),5);
 for(let i=0;i<5;i++)h.run('revealAnswer();rateCard(2)');
 h.run('finishRound()');assert.equal(h.run('availableCards().length'),0);assert.equal(h.els.get('start-round').disabled,true);
});
test('pausing and a full restart restore the same question and typed answer',()=>{
 const h=boot(seedCards(4,2));h.run('startRound();revealAnswer();rateCard(2)');
 h.els.get('user-answer').value='my unfinished answer';h.run('saveRoundDraft();pauseRound()');
 const id=h.run('round.ids[roundIndex()]');const restarted=boot(h.store);
 assert.equal(restarted.run('round.paused'),true);restarted.run('resumeRound()');
 assert.equal(restarted.run('currentCard.id'),id);assert.equal(restarted.els.get('user-answer').value,'my unfinished answer');
});
test('a crash after committing a review cannot grade the same slot twice',()=>{
 const h=boot(seedCards(3,2));h.run('startRound()');const before=h.store.get('wesentlich_vocab_round_v1');
 h.run('revealAnswer();rateCard(2)');h.store.set('wesentlich_vocab_round_v1',before);
 const restarted=boot(h.store);restarted.run('resumeRound()');assert.equal(restarted.run('roundIndex()'),1);
 assert.equal(restarted.run('state.cards.flatMap(c=>c.reviews).length'),1);
});
test('switching tabs pauses without grading and resume retains the revealed answer',()=>{
 const h=boot(seedCards(2,2));h.run('startRound();revealAnswer();switchView("manage")');
 assert.equal(h.run('round.paused'),true);assert.equal(h.run('roundReviews().length'),0);
 h.run('switchView("study");resumeRound()');assert.equal(h.run('isRevealed'),true);
});
test('editing changes content and theme, preserving all learning progress',()=>{
 const h=boot(seedCards(2,2));h.run('startRound();revealAnswer();rateCard(2);editCard("0")');
 const before=h.run('JSON.stringify(state.cards.find(c=>c.id==="0").reviews)');
 h.els.get('edit-front').value='Neuer Text';h.els.get('edit-module').value='Kontakt';h.run('saveEdit()');
 assert.equal(h.run('cards.find(c=>c.id==="0").front'),'Neuer Text');assert.equal(h.run('JSON.stringify(state.cards.find(c=>c.id==="0").reviews)'),before);
 assert.equal(h.run('cards.find(c=>c.id==="0").module'),'Kontakt');
});
test('search and theme filter restrict the collection',()=>{
 const h=boot();h.run('addPack("Kontakt halten");addPack("Körper wahrnehmen")');
 h.els.get('manage-module').value='Kontakt halten';h.run('renderCardList()');assert.equal(h.els.get('card-list').children.length,6);
 h.els.get('card-search').value='withdraw';h.run('renderCardList()');assert.equal(h.els.get('card-list').children.length,1);
});
test('starter packs are optional and repeat imports skip duplicates',()=>{
 const h=boot();assert.equal(h.run('cards.length'),0);h.run('addPack("Wünsche klären");addPack("Wünsche klären")');assert.equal(h.run('cards.length'),6);
});
test('deleted cards in a paused round are skipped safely',()=>{
 const h=boot(seedCards(2,2));h.run('startRound();pauseRound();deleteCard("0");resumeRound()');assert.equal(h.run('currentCard.id'),'1');
});
test('HTML tags are properly balanced',()=>{
 const stack=[],voids=new Set(['meta','link','input','br','hr','img']);
 for(const m of html.replace(/<!--[\s\S]*?-->/g,'').matchAll(/<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi)){
  const [,close,tag]=m;if(voids.has(tag))continue;
  if(close)assert.equal(stack.pop(),tag,'unbalanced '+tag);else stack.push(tag);
 }
 assert.deepEqual(stack,[]);
});
