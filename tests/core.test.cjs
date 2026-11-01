const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../core.js');
const legacy=(id='1')=>({id,front:'Anspannung',back:'tension',notes:'Beispiel',reps:4,interval:12,ease:2.3,due:100000});
const state=()=>C.validate([legacy()]);
test('legacy migration preserves the existing schedule',()=>assert.deepEqual(C.project(state().cards[0]).due,100000));
test('invalid backups are rejected atomically',()=>{
  for(const raw of [{},[legacy(),{id:'2'}],[legacy(),legacy()],{schemaVersion:99,cards:[]}]) assert.throws(()=>C.validate(raw));
});
test('version two backup round trip preserves every review',()=>{
 const s=state();s.cards[0].reviews.push({id:'review',at:500000,rating:2});
 assert.deepEqual(C.validate(JSON.parse(JSON.stringify(s))),s);
});
for(const [name,delimiter] of [['semicolon',';'],['comma',','],['tab','\t']]) test('detect '+name+' and quoted fields',()=>{
  const p=C.parseImport(['Deutsch'+delimiter+'Englisch'+delimiter+'Notiz','Anspannung'+delimiter+'tension'+delimiter+'"A; B, C"'].join('\r\n'));
  assert.equal(p.delimiter,delimiter);assert.equal(p.entries.length,1);assert.equal(p.entries[0].notes,'A; B, C');
});
test('reordered headers, module, BOM, multiline and escaped quotes',()=>{
 const p=C.parseImport('\uFEFFEnglisch;Notiz;Deutsch;Modul\r\ntension;"First line\r\nA ""quote""";Anspannung;Körper');
 assert.deepEqual(p.entries,[{front:'Anspannung',back:'tension',notes:'First line\nA "quote"',module:'Körper'}]);
});
test('quotes inside unquoted notes are literal, as in existing therapy material',()=>{
 const p=C.parseImport('verlangsamen;to slow down;[Modul 3: NARM] Beispiel: "Let\'s slow down for a moment."');
 assert.equal(p.entries[0].notes,'[Modul 3: NARM] Beispiel: "Let\'s slow down for a moment."');
});
test('apostrophes are not stripped',()=>assert.equal(C.parseImport("Gefühl;I'm sad;don't rush").entries[0].back,"I'm sad"));
test('missing sides report source line numbers',()=>{
 const p=C.parseImport('Deutsch;Englisch\n;missing\nvalid;okay\nmissing;');
 assert.deepEqual(p.errors.map(e=>e.line),[2,4]);assert.equal(p.entries.length,1);
});
test('unterminated quoted fields cannot be imported',()=>assert.throws(()=>C.parseImport('de;en;"unfinished',';')));
test('ambiguous delimiters require a choice instead of creating wrong cards',()=>{
 assert.throws(()=>C.parseImport('Anspannung,tension,note; more'),/nicht eindeutig/);
 assert.equal(C.parseImport('Anspannung,tension,note; more',',').entries[0].back,'tension');
});
test('automatic detection does not silently switch delimiters to hide malformed quotes',()=>{
 assert.throws(()=>C.parseImport('Deutsch;Englisch;Notiz\nEnge;tightness;"unfinished, text'));
});
test('empty and non-tabular input rejected',()=>{assert.throws(()=>C.parseImport(''));assert.throws(()=>C.parseImport('just text'));});
test('duplicate skipping preserves existing schedule and deduplicates the batch',()=>{
 let n=0;const s=state();const p=C.planImport(s,[{front:'  ANSPANNUNG ',back:'tension'},{front:'Enge',back:'tightness'},{front:'Enge',back:'tightness'}],()=>String(++n),500);
 assert.equal(p.duplicates,2);assert.equal(p.added.length,1);assert.equal(s.cards[0].base.reps,4);
});
test('card count never decides which progress wins',()=>{
 const a=state(),b=C.validate([legacy(),legacy('2')]);
 a.cards[0].reviews.push({id:'a',at:200000,rating:2});
 const m=C.merge(a,b);assert.equal(m.cards.length,2);assert.equal(m.cards[0].reviews.length,1);
});
test('simultaneous review events converge, survive repeated merging and affect the schedule',()=>{
 const a=state(),b=state();a.cards[0].reviews.push({id:'a',at:200000,rating:0});b.cards[0].reviews.push({id:'b',at:300000,rating:2});
 const m=C.merge(a,b);assert.deepEqual(m,C.merge(b,a));assert.deepEqual(m,C.merge(m,a,b));
 assert.equal(m.cards[0].reviews.length,2);assert.equal(C.project(m.cards[0]).due,300000+86400000);
});
test('merge is associative and idempotent',()=>{
 const a=state(),b=state(),c=state();b.cards[0].notes='changed';b.cards[0].updatedAt=9;c.cards[0].notes='newest';c.cards[0].updatedAt=10;
 assert.deepEqual(C.merge(C.merge(a,b),c),C.merge(a,C.merge(b,c)));assert.deepEqual(C.merge(a,a),a);assert.equal(C.merge(b,c).cards[0].notes,'newest');
});
test('deletion cannot be resurrected by an old offline snapshot',()=>{
 const a=state(),b=state();a.cards[0].deletedAt=123456;assert.equal(C.merge(a,b).cards.filter(c=>!c.deletedAt).length,0);
});
test('deleted term may be intentionally re-added with a different ID',()=>{
 const s=state();s.cards[0].deletedAt=123;assert.equal(C.planImport(s,[legacy()],()=> 'new',500).added.length,1);
});
test('all ratings produce finite future dates',()=>{for(let r=0;r<4;r++){const s=C.schedule(legacy(),r,500);assert.ok(Number.isFinite(s.due)&&s.due>500);}});
test('concurrent alternatives merge without erasing a different device addition',()=>{
 const a=state(),b=state();a.cards[0].alternatives=[{id:'a',text:'one',note:'',updatedAt:10,deletedAt:0}];b.cards[0].alternatives=[{id:'b',text:'two',note:'',updatedAt:10,deletedAt:0}];
 const m=C.merge(a,b);assert.equal(m.cards[0].alternatives.length,2);assert.deepEqual(m,C.merge(b,a));
 assert.deepEqual(C.validate(JSON.parse(JSON.stringify(m))),m);
 const d=structuredClone(m);d.cards[0].alternatives[0].deletedAt=20;assert.equal(C.merge(d,m).cards[0].alternatives[0].deletedAt,20);
});
test('CSV alternative column imports pipe-separated phrases',()=>{
 const p=C.parseImport('Deutsch;Englisch;Alternativen\nSehnsucht;longing;yearning|a strong desire');
 let i=0;const plan=C.planImport(C.empty(),p.entries,()=>String(++i),100);
 assert.equal(plan.added[0].alternatives.length,2);assert.equal(plan.added[0].alternatives[1].text,'a strong desire');
});
