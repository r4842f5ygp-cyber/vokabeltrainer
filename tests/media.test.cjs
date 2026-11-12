const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio-manifest.json'),'utf8'));
test('every shipped clip exists and every new word, alternative and example has a local recording',()=>{
 const c=vm.createContext({VOCAB_PACKS:[],C:require('../core.js')});
 for(const file of ['feelings.js','audio-index.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c);
 const targets=JSON.parse(vm.runInContext('JSON.stringify(FEELINGS_ROWS.flatMap(r=>[r[1],r[2],...(r[5]||[])]))',c));
 const index=JSON.parse(vm.runInContext('JSON.stringify(VOCAB_AUDIO)',c));
 for(const text of targets)assert.ok(index[text.toLowerCase().replace(/\s+/g,' ').trim()],text);
 for(const clip of manifest.files){assert.ok(clip.file.startsWith('assets/audio/'));assert.equal(fs.statSync(path.join(root,clip.file)).size,clip.bytes);assert.ok(clip.bytes>1000);assert.ok(fs.readFileSync(path.join(root,clip.file)).includes(Buffer.from('Lavc'))||fs.readFileSync(path.join(root,clip.file)).slice(0,3).equals(Buffer.from('ID3')));}
 assert.ok(manifest.files.reduce((sum,c)=>sum+c.bytes,0)<3_000_000);
});
function localAudioHarness(){
 const players=[],status={textContent:''};let requested=0,paused=0;
 const c=vm.createContext({VOCAB_AUDIO:{tired:'assets/audio/tired.mp3'},
  Audio:function(src){this.src=src;this.play=()=>{requested++;return Promise.resolve();};this.pause=()=>paused++;players.push(this);},
  window:{},document:{getElementById:()=>status},stopSpeechRecognition(){},setTimeout:()=>1,clearTimeout(){}});
 vm.runInContext(fs.readFileSync(path.join(root,'speech.js'),'utf8'),c);
 return{players,status,c,run:s=>vm.runInContext(s,c),get requested(){return requested;},get paused(){return paused;}};
}
test('local media starts synchronously without any browser speech API and supports slow playback',()=>{
 const h=localAudioHarness();h.run('speakEnglish("tired")');assert.equal(h.requested,1);assert.equal(h.players[0].playbackRate,1);
 h.players[0].onplaying();assert.match(h.status.textContent,/läuft/);
 h.run('speakEnglish("tired",.7)');assert.equal(h.requested,2);assert.equal(h.players[1].playbackRate,.75);assert.equal(h.players[1].preservesPitch,true);assert.equal(h.paused,1);
 h.players[0].onerror();assert.match(h.status.textContent,/geladen/);h.players[1].onended();assert.equal(h.status.textContent,'');
});
test('rejected playback provides a fresh-tap fallback and stop invalidates stale callbacks',async()=>{
 const h=localAudioHarness();h.run('speakEnglish("tired")');h.players[0].onerror();assert.match(h.status.textContent,/Gerätestimme/);
 h.run('speakEnglish("tired");stopAudio()');h.players[1].onplaying();assert.equal(h.status.textContent,'');
 const rejected=localAudioHarness();rejected.run('Audio=function(){this.pause=()=>{};this.play=()=>Promise.reject(new Error("NotAllowedError"));};speakEnglish("tired")');
 await new Promise(resolve=>setImmediate(resolve));assert.match(rejected.status.textContent,/Gerätestimme/);
});
test('preview ships the same media bytes and isolated preference/review keys',()=>{
 for(const file of ['assets/emotions.jpg',...manifest.files.map(c=>c.file)])assert.deepEqual(fs.readFileSync(path.join(root,'vorschau',file)),fs.readFileSync(path.join(root,file)));
 assert.match(fs.readFileSync(path.join(root,'vorschau/preferences.js'),'utf8'),/wesentlich_preview_vocab_preferences/);
 assert.ok(!fs.readFileSync(path.join(root,'vorschau/preferences.js'),'utf8').includes("'wesentlich_vocab_"));
});
