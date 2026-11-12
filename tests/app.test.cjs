const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function boot(seed) {
 const els=new Map(), handlers={}, store=seed instanceof Map?new Map(seed):new Map(seed?[['wesentlich_vocab_cards_v1',JSON.stringify(seed)]]:[]);
 for(const match of html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*\bid="([^"]+)"[^>]*)>/g)) {
  const [,tag,attrs,id]=match,classes=new Set((attrs.match(/class="([^"]*)"/)?.[1]||'').split(/\s+/));
  els.set(id,{tagName:tag.toUpperCase(),id,value:id.endsWith('delimiter')?'auto':'',textContent:'',disabled:false,style:{},children:[],
   classList:{contains:n=>classes.has(n),add:(...ns)=>ns.forEach(n=>classes.add(n)),remove:(...ns)=>ns.forEach(n=>classes.delete(n)),toggle(n,on){if(on===undefined)on=!classes.has(n);on?classes.add(n):classes.delete(n);}},
   attributes:{},dataset:{},setAttribute(name,value){this.attributes[name]=value;},focus(){},blur(){},append(...items){this.children.push(...items);},appendChild(item){this.children.push(item);},replaceChildren(){this.children=[];},showModal(){this.open=true;},close(){this.open=false;},click(){},remove(){}});
 }
 const bodyClasses=new Set();
 const document={getElementById(id){assert.ok(els.has(id),'Missing HTML element: '+id);return els.get(id);},activeElement:{id:'',tagName:'BODY'},querySelectorAll:()=>[],addEventListener(){},createElement(){return {attributes:{},dataset:{},children:[],style:{setProperty(){}},
  classList:{toggle(){}},setAttribute(name,value){this.attributes[name]=value;},
  append(...items){this.children.push(...items);},appendChild(item){this.children.push(item);},click(){},remove(){}};},body:{appendChild(){},classList:{add:n=>bodyClasses.add(n),remove:n=>bodyClasses.delete(n),contains:n=>bodyClasses.has(n),toggle(n,on){on?bodyClasses.add(n):bodyClasses.delete(n);}}}};
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
test('alternatives added while learning are accepted, editable, removable and survive restart',()=>{
 const h=boot(seedCards(1,2));h.run('startRound();revealAnswer()');
 h.els.get('alternative-text').value='another expression';h.els.get('alternative-note').value='A nuance';h.run('saveAlternative()');
 assert.equal(h.run('checkUserAnswer("another expression",currentCard.back,currentCard.alternatives).isMatch'),true);
 assert.equal(h.run('state.cards[0].reviews.length'),0);
 h.run('editAlternative(currentCard.alternatives[0].id)');h.els.get('alternative-text').value='a different expression';h.run('saveAlternative()');
 const re=boot(h.store);re.run('resumeRound()');assert.equal(re.run('currentCard.alternatives[0].text'),'a different expression');
 re.run('removeAlternative(currentCard.alternatives[0].id)');assert.equal(re.run('checkUserAnswer("a different expression",currentCard.back,currentCard.alternatives).isMatch'),false);
});
test('typed answer can be reused without losing the active round',()=>{
 const h=boot(seedCards(1,2));h.run('startRound()');h.els.get('user-answer').value='my expression';h.run('revealAnswer();useMyAnswer();saveAlternative()');
 assert.equal(h.run('currentCard.alternatives[0].text'),'my expression');assert.equal(h.run('roundIndex()'),0);
});
test('all 41 original cards are reviewed once with IDs and schedules preserved',()=>{
 const originals=JSON.parse(fs.readFileSync(path.join(root,'therapy-originals.json'),'utf8'));
 const h=boot(originals.map((c,i)=>({...c,id:String(i),reps:3,interval:7,ease:2.5,due:1234})));
 assert.equal(h.run('THERAPY_REVIEWED.length'),41);h.run('applyTherapyRevision()');
 assert.equal(h.run('cards.length'),41);assert.ok(h.run('cards.every(c=>c.reps===3&&c.due===1234)'));
 assert.equal(h.run('cards.find(c=>c.id==="33").back'),'to feel hurt');
 h.run('applyTherapyRevision(true)');assert.equal(h.run('cards.length'),41);
 assert.ok(h.store.get('wesentlich_vocab_before_import_v2'));
});
test('therapy review preserves personal notes and can add the full corrected collection',()=>{
 const originals=JSON.parse(fs.readFileSync(path.join(root,'therapy-originals.json'),'utf8'));
 const h=boot([{...originals[0],notes:'My own note',id:'mine',reps:2,interval:3,ease:2.5,due:500}]);
 h.run('applyTherapyRevision()');assert.equal(h.run('cards[0].notes'),'My own note');
 const clean=boot();clean.run('applyTherapyRevision(true)');assert.equal(clean.run('cards.length'),41);
 clean.run('applyTherapyRevision(true)');assert.equal(clean.run('cards.length'),41);
});

test('feelings module adds all 55 targets without altering existing cards or legacy backup',()=>{
 const h=boot(seedCards(2,3));h.run('addPack("Gefühle unterscheiden")');
 const before=h.run('JSON.stringify(state.cards)'),legacy=h.store.get('wesentlich_vocab_cards_v1');
 h.run('addPack(FEELINGS_PACK.name)');
 assert.equal(h.run('packCards(FEELINGS_PACK).length'),55);
 assert.equal(h.run('cards.length'),63);
 for(const old of JSON.parse(before))assert.deepEqual(JSON.parse(h.run('JSON.stringify(state.cards.find(c=>c.id==='+JSON.stringify(old.id)+'))')),old);
 assert.equal(JSON.stringify(JSON.parse(h.store.get('wesentlich_vocab_before_import_v2')).cards),before);
 assert.equal(h.store.get('wesentlich_vocab_cards_v1'),legacy);
 h.run('addPack(FEELINGS_PACK.name)');assert.equal(h.run('cards.length'),63);
 assert.equal(JSON.stringify(JSON.parse(h.store.get('wesentlich_vocab_before_import_v2')).cards),before);
});
test('feelings pack availability is scoped to the new module and practice excludes unrelated new cards',()=>{
 const h=boot();h.run('addPack("Gefühle unterscheiden")');
 assert.equal(h.run('packCards(FEELINGS_PACK).length'),0);
 h.run('addPack(FEELINGS_PACK.name);studyPack(FEELINGS_PACK.name)');
 assert.equal(h.run('round.ids.length'),5);
 assert.ok(h.run('round.ids.every(id=>state.cards.find(c=>c.id===id).module===FEELINGS_PACK.name)'));
 assert.ok(h.els.get('study-module').children.some(x=>x.value===h.run('FEELINGS_PACK.name')));
 h.run('pauseRound();switchView("manage")');h.els.get('manage-module').value=h.run('FEELINGS_PACK.name');h.run('renderCardList()');
 assert.equal(h.els.get('card-list').children.length,55);
});
test('all 55 feelings render, accept canonical and alternative answers, route normal/slow audio and persist ratings',()=>{
 const h=boot(seedCards(1,3));h.run('addPack(FEELINGS_PACK.name)');
 h.run('var spoken=[];function SpeechSynthesisUtterance(text){this.text=text;} window.speechSynthesis={getVoices:()=>[{lang:"en-US",localService:true}],speak:u=>spoken.push(u),cancel(){},resume(){}};');
 const ids=JSON.parse(h.run('JSON.stringify(packCards(FEELINGS_PACK).map(c=>c.id))'));
 ids.forEach((id,i)=>{
  h.run('startRound([cards.find(c=>c.id==='+JSON.stringify(id)+')])');
  assert.equal(h.els.get('front-text').textContent,h.run('currentCard.front'));
  assert.ok(h.els.get('example-english').textContent);assert.ok(h.els.get('example-german').textContent);assert.ok(h.els.get('notes-text').textContent);
  h.els.get('user-answer').value=h.run('currentCard.back');h.run('revealAnswer()');
  assert.match(h.els.get('check-feedback').textContent,/Treffer/);
  assert.ok(h.run('currentCard.alternatives.every(a=>checkUserAnswer(a.text,currentCard.back,currentCard.alternatives).isMatch)'));
  h.run('speakCurrent();spoken.at(-1).onend();speakCurrent(.7);spoken.at(-1).onend()');
  assert.equal(h.run('spoken.at(-2).text'),h.run('currentCard.back'));
  assert.equal(h.run('spoken.at(-2).rate'),.95);assert.equal(h.run('spoken.at(-1).rate'),.7);
  h.run('rateCard('+(i%4)+');finishRound()');
 });
 assert.equal(h.run('spoken.length'),110);
 const re=boot(h.store);
 assert.equal(re.run('packCards(FEELINGS_PACK).length'),55);
 assert.ok(re.run('packCards(FEELINGS_PACK).every(c=>c.reviews.length===1&&Number.isFinite(c.due))'));
 const saved=re.run('JSON.stringify(state)');re.run('addPack(FEELINGS_PACK.name)');assert.equal(re.run('JSON.stringify(state)'),saved);
});
test('contrast answers distinguish consciousness, emotional injury, insecurity, envy and word classes',()=>{
 const h=boot();h.run('addPack(FEELINGS_PACK.name)');
 for(const [number,wrong]of [[3,'powerless'],[4,'unconscious'],[7,'empathy'],[19,'unsure'],[26,'injured'],[27,'hurt'],[28,'embarrassed'],[29,'ashamed'],[30,'ashamed'],[31,'alone'],[38,'sore'],[40,'careful'],[46,'lucky'],[49,'envious'],[50,'jealous']]){
  assert.equal(h.run('(()=>{const c=state.cards.find(c=>c.id==="feelings-emotions-v1:'+String(number).padStart(2,'0')+'");return checkUserAnswer('+JSON.stringify(wrong)+',c.back,c.alternatives).isMatch;})()'),false,number+': '+wrong);
 }
 const contexts=JSON.parse(h.run('JSON.stringify(FEELINGS_PACK.entries.filter(r=>r[1]==="overwhelmed"))'));
 assert.equal(contexts.length,2);assert.match(contexts[0][2],/tasks/);assert.match(contexts[1][2],/joy/);
});
test('feelings imports on separate devices converge including alternatives and preserve both review events',()=>{
 const a=boot(),b=boot();a.run('addPack(FEELINGS_PACK.name);studyPack(FEELINGS_PACK.name);revealAnswer();rateCard(2)');
 b.run('addPack(FEELINGS_PACK.name);studyPack(FEELINGS_PACK.name);revealAnswer();rateCard(1)');
 const C=require('../core.js'),merged=C.merge(JSON.parse(a.run('JSON.stringify(state)')),JSON.parse(b.run('JSON.stringify(state)')));
 assert.equal(merged.cards.length,55);
 assert.equal(merged.cards[0].reviews.length,2);
 for(const c of merged.cards)assert.equal(new Set(c.alternatives.map(a=>a.text)).size,c.alternatives.length);
 assert.deepEqual(C.validate(JSON.parse(JSON.stringify(merged))),merged);
});
test('re-adding a deleted feelings card preserves tombstone and all other progress; personal edits survive repeat imports',()=>{
 const h=boot();h.run('addPack(FEELINGS_PACK.name);studyPack(FEELINGS_PACK.name);revealAnswer();rateCard(2);finishRound()');
 const reviews=h.run('JSON.stringify(state.cards.find(c=>c.id==="feelings-emotions-v1:01").reviews)');
 h.run('editCard("feelings-emotions-v1:02")');h.els.get('edit-notes').value='My own example';h.run('saveEdit();addPack(FEELINGS_PACK.name)');
 assert.equal(h.run('state.cards.find(c=>c.id==="feelings-emotions-v1:02").notes'),'My own example');
 h.run('deleteCard("feelings-emotions-v1:03");addPack(FEELINGS_PACK.name)');
 assert.equal(h.run('packCards(FEELINGS_PACK).length'),55);
 assert.ok(h.run('state.cards.find(c=>c.id==="feelings-emotions-v1:03").deletedAt>0'));
 assert.equal(h.run('JSON.stringify(state.cards.find(c=>c.id==="feelings-emotions-v1:01").reviews)'),reviews);
 h.run('addPack(FEELINGS_PACK.name)');assert.equal(h.run('cards.length'),55);
});

test('round-size preferences persist across restart without changing existing cards or a paused round',()=>{
 const h=boot(seedCards(10,2)),before=h.run('JSON.stringify(state)');
 h.els.get('round-size').value='3';h.els.get('show-images').checked=false;h.els.get('allow-motion').checked=true;h.run('savePreferences();startRound()');
 assert.equal(h.run('round.ids.length'),3);assert.equal(h.run('JSON.stringify(state)'),before);
 h.run('pauseRound()');const re=boot(h.store);
 assert.equal(re.run('preferences.roundSize'),3);assert.equal(re.run('preferences.images'),false);assert.equal(re.run('preferences.motion'),true);
 re.els.get('round-size').value='6';re.run('savePreferences();resumeRound()');assert.equal(re.run('round.ids.length'),3);
 for(const size of [3,5,6]){const p=boot(seedCards(10,2));p.els.get('round-size').value=String(size);p.run('savePreferences();startRound()');assert.equal(p.run('round.ids.length'),size);}
});
test('focus mode hides navigation only during active learning and restores it on pause and completion',()=>{
 const h=boot(seedCards(1,2));h.run('startRound()');assert.equal(h.run('document.body.classList.contains("learning-active")'),true);
 h.run('revealAnswer()');assert.equal(h.run('document.body.classList.contains("answer-visible")'),true);
 h.run('pauseRound()');assert.equal(h.run('document.body.classList.contains("learning-active")'),false);
 h.run('resumeRound();rateCard(2)');assert.equal(h.run('document.body.classList.contains("learning-active")'),false);
});
test('image hints stay unloaded until requested, can be disabled and distinguish both overwhelmed contexts',()=>{
 const h=boot();h.run('addPack(FEELINGS_PACK.name);startRound([cards.find(c=>c.front==="überfordert")])');
 assert.equal(h.els.get('emotion-image').style.backgroundImage,'none');
 assert.equal(h.els.get('image-hint').classList.contains('hidden'),false);
 h.els.get('image-hint').open=true;h.run('showImageHint()');assert.match(h.els.get('emotion-image').style.backgroundImage,/assets\/emotions.jpg/);
 const negative=h.els.get('emotion-image').style.backgroundPosition;
 h.run('pauseRound();finishRound();startRound([cards.find(c=>c.front==="überwältigt")])');
 h.els.get('image-hint').open=true;h.run('showImageHint()');assert.notEqual(h.els.get('emotion-image').style.backgroundPosition,negative);
 assert.match(h.els.get('image-caption').textContent,/Freude/);
 h.run('pauseRound()');h.els.get('show-images').checked=false;h.run('savePreferences();resumeRound()');
 assert.equal(h.els.get('image-hint').classList.contains('hidden'),true);assert.equal(h.els.get('emotion-image').style.backgroundImage,'none');
});
test('difficult-word filter respects due dates and daily new-card limit and does not alter the schedule',()=>{
 const h=boot(seedCards(3,2));h.run('state.cards[0].reviews.push({id:"hard",rating:1,at:Date.now()-5*86400000});state.cards[1].reviews.push({id:"easy",rating:3,at:Date.now()-9*86400000});refreshCards()');
 const before=h.run('JSON.stringify(state)');h.els.get('study-focus').value='difficult';
 assert.equal(h.run('availableCards().length'),1);assert.equal(h.run('availableCards()[0].id'),'0');
 assert.equal(h.run('JSON.stringify(state)'),before);
 h.run('state.cards[0].reviews.push({id:"later",rating:1,at:Date.now()});refreshCards();renderStudy()');
 assert.equal(h.run('availableCards().length'),0);assert.match(h.els.get('home-detail').textContent,/keine schwierigen Wörter fällig/);
});
test('a return after seven days offers a gentle due-only round and a new review clears the return prompt',()=>{
 const h=boot(seedCards(8,2));h.store.set('wesentlich_vocab_last_practice_v1',String(Date.now()-8*86400000));h.run('renderStudy()');
 assert.equal(h.els.get('welcome-back').classList.contains('hidden'),false);
 h.run('startGentleRound()');assert.equal(h.run('round.ids.length'),3);
 h.run('revealAnswer();rateCard(2);pauseRound();finishRound()');assert.equal(h.els.get('welcome-back').classList.contains('hidden'),true);
});
test('a storage error while saving preferences preserves the previous settings and vocabulary',()=>{
 const h=boot(seedCards(2,2));const before=h.run('JSON.stringify(state)');h.els.get('round-size').value='3';
 h.run('localStorage.setItem=()=>{throw new Error("quota")};savePreferences()');
 assert.equal(h.run('preferences.roundSize'),6);assert.equal(h.run('JSON.stringify(state)'),before);assert.match(h.els.get('preferences-message').textContent,/nicht gespeichert/);
});

test('an existing same-word card in another module does not block editing notes in the feelings module',()=>{
 const h=boot();h.run('addPack("Gefühle unterscheiden");addPack(FEELINGS_PACK.name);editCard("feelings-emotions-v1:31")');
 h.els.get('edit-notes').value='My personal example';h.run('saveEdit()');
 assert.equal(h.run('state.cards.find(c=>c.id==="feelings-emotions-v1:31").notes'),'My personal example');
 assert.equal(h.run('cards.length'),61);
});

test('browser-voice fallback repeats the requested example and speed and resets for the next card',()=>{
 const h=boot();h.run('addPack(FEELINGS_PACK.name);startRound([cards.find(c=>c.front==="müde"),cards.find(c=>c.front==="wach")]);revealAnswer()');
 h.run('var spoken=[];function SpeechSynthesisUtterance(text){this.text=text;}window.speechSynthesis={getVoices:()=>[{lang:"en-US",localService:true}],speak:u=>spoken.push(u),cancel(){},resume(){}};speakExample(.7);speakBrowserCurrent()');
 assert.equal(h.run('spoken.at(-1).text'),h.els.get('example-english').textContent);assert.equal(h.run('spoken.at(-1).rate'),.7);
 h.run('rateCard(2);revealAnswer();speakBrowserCurrent()');
 assert.equal(h.run('spoken.at(-1).text'),'awake');assert.equal(h.run('spoken.at(-1).rate'),.95);
});

test('emotion table uses every supplied position and category and offers complete details', () => {
  const h = boot();
  const layout = [
    'Lo@1 Fe@14',
    'Em@1 Ne@13 Dr@14',
    'Se@1 Te@2 Jo@3 Ho@4 Su@5 It@6 Ag@7 Rb@8 Sa@9 Bo@10 Sh@11 In@12 Ss@14',
    'Co@1 Sy@2 St@3 Pl@4 Ec@5 An@6 Re@7 Hs@8 Ln@9 Ab@10 Cf@11 Sp@12 Sb@14',
    'Gr@1 Ts@2 En@3 Ea@4 Op@5 Ht@6 Fr@7 Ir@8 Gf@9 No@10 Tr@11 Sm@12 Di@14',
    'Ad@1 Pr@2 Eu@3 De@4 Ha@5 Ra@6 Je@7 Ev@8 Id@9 Hp@10 Rs@11 Me@12 Ct@14',
    'Ds@9 We@10 Pe@11',
  ];
  const entries = JSON.parse(h.run('JSON.stringify(EMOTION_ELEMENTS)'));
  assert.equal(entries.length, 60);
  assert.equal(new Set(entries.map(entry => entry.noun)).size, 60);
  assert.deepEqual(layout, layout.map((_, index) => entries
    .filter(entry => entry.r === index + 1).map(entry => entry.sym + '@' + entry.c).join(' ')));
  for (const entry of entries) {
    for (const field of ['adj', 'de', 'client', 'context', 'narm']) assert.ok(entry[field]?.trim(), entry.sym + ':' + field);
  }
  h.run("switchView('emotions')");
  assert.equal(h.els.get('view-study').classList.contains('hidden'), true);
  assert.equal(h.els.get('tab-emotions').attributes['aria-current'], 'page');
  assert.equal(h.els.get('emotion-filters').children.length, 7);
  assert.equal(h.els.get('emotion-grid').children.length, 60);
  const headings = h.els.get('emotion-columns');
  assert.equal(headings.children.length, 14);
  headings.children[13].onclick();
  assert.match(h.els.get('emotion-column-status').textContent, /Bedrohung & Abwehr/);
  assert.equal(h.els.get('emotion-grid').children.length, 6);
  h.run("emotionFilters.get('all').onclick()");
  assert.equal(h.els.get('emotion-grid').children.length, 60);
  h.run("emotionFilters.get('disgust').onclick()");
  assert.equal(h.els.get('emotion-grid').children.length, 2);
  h.els.get('emotion-grid').children[0].onclick();
  assert.equal(h.els.get('emotion-dialog').open, true);
  assert.equal(h.els.get('emotion-detail-title').textContent, 'disgust');
});

test('emotion cards survive reload, use the existing scheduler and can be re-added after deletion', () => {
  const h = boot([{id:'old',front:'Enge',back:'tightness',reps:3,interval:5,ease:2.5,due:1}]);
  h.run("switchView('emotions'); openEmotionDetail(EMOTION_ELEMENTS[0]); addEmotionCard(); addEmotionCard()");
  assert.equal(h.els.get('emotion-add').disabled, true);
  assert.match(h.els.get('emotion-grid').children[0].attributes['aria-label'], /im Training/);
  const state = JSON.parse(h.store.get('wesentlich_vocab_state_v2'));
  assert.equal(state.cards.length, 2);
  const card = state.cards.find(card => card.id !== 'old');
  assert.match(card.front, /^Liebe \/ liebevoll\nIch empfinde/);
  assert.equal(card.back, 'love / loving');
  assert.match(card.notes, /what do you notice in yourself\?/);
  assert.equal(state.cards.find(card => card.id === 'old').base.reps, 3);

  const restored = boot(h.store);
  restored.run("startRound([cards.find(card => card.id !== 'old')]); revealAnswer()");
  assert.equal(restored.els.get('meaning-details').open, true);
  assert.equal(restored.els.get('notes-text').textContent, card.notes);
  restored.run('rateCard(2)');
  assert.equal(restored.run("state.cards.find(card => card.id !== 'old').reviews.length"), 1);
  restored.run("switchView('manage'); deleteCard(" + JSON.stringify(card.id) + "); switchView('emotions')");
  assert.doesNotMatch(restored.els.get('emotion-grid').children[0].attributes['aria-label'], /im Training/);
  restored.run('openEmotionDetail(EMOTION_ELEMENTS[0]); addEmotionCard()');
  assert.equal(restored.run("cards.filter(card => card.module === EMOTION_MODULE).length"), 1);
  assert.equal(restored.run("state.cards.find(card => card.id === " + JSON.stringify(card.id) + ").reviews.length"), 1);
});

test('all three modal audio actions use the existing Web Speech API and stop when the dialog closes', () => {
  const h = boot();
  const spoken = JSON.parse(h.run(`
    const utterances = [];
    let cancellations = 0;
    globalThis.SpeechSynthesisUtterance = function (text) { this.text = text; };
    window.speechSynthesis = {
      getVoices: () => [{lang: 'en-GB', localService: true}],
      speak(utterance) { utterances.push([utterance.text, utterance.lang]); },
      cancel() { cancellations++; },
    };
    openEmotionDetail(EMOTION_ELEMENTS[0]);
    speakEmotionDetail('family');
    speakEmotionDetail('client');
    speakEmotionDetail('narm');
    $('emotion-dialog').close();
    closeEmotionDetail();
    JSON.stringify({utterances, cancellations});
  `));
  assert.deepEqual(spoken.utterances, [
    ['love. loving', 'en-GB'],
    ['I feel a lot of love for my son.', 'en-GB'],
    ['As you talk about your son, what do you notice in yourself?', 'en-GB'],
  ]);
  assert.equal(spoken.cancellations, 3);
});

test('the existing therapy CSV export can still be read by the CSV importer', () => {
  const h = boot();
  const output = JSON.parse(h.run(`
    let exported;
    backupDownload = (content, filename, mime) => { exported = {content, filename, mime}; };
    exportTherapyCSV();
    const parsed = C.parseImport(exported.content);
    JSON.stringify({filename: exported.filename, mime: exported.mime, parsed});
  `));
  assert.equal(output.filename, 'therapie-vokabeln-redigiert.csv');
  assert.match(output.mime, /^text\/csv/);
  assert.equal(output.parsed.entries.length, 41);
  assert.equal(output.parsed.errors.length, 0);
});
