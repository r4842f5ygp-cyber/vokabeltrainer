const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){let spoken,canceled=0,resumed=0,stopped=0;const label={textContent:''};const voice={lang:'en-GB',localService:true};const synth={paused:true,pending:false,speaking:false,getVoices:()=>[voice],resume:()=>resumed++,cancel:()=>canceled++,speak:u=>spoken=u,addEventListener(){}};
 const c=vm.createContext({window:{speechSynthesis:synth},SpeechSynthesisUtterance:function(text){this.text=text;},document:{getElementById:()=>label},stopSpeechRecognition:()=>stopped++,setTimeout:()=>1,clearTimeout(){}});
 vm.runInContext(fs.readFileSync(require.resolve('../speech.js'),'utf8'),c);return{run:s=>vm.runInContext(s,c),label,synth,get spoken(){return spoken;},get canceled(){return canceled;},get resumed(){return resumed;},get stopped(){return stopped;}};}
test('tap starts speech synchronously with English voice and retained utterance',()=>{const h=setup();h.run('speakEnglish("a lump in the throat",.7)');assert.equal(h.spoken.text,'a lump in the throat');assert.equal(h.spoken.lang,'en-GB');assert.equal(h.spoken.rate,.7);assert.equal(h.spoken.volume,1);assert.equal(h.resumed,1);assert.equal(h.stopped,1);assert.equal(h.canceled,0);assert.equal(h.run('activeSpeech.text'),'a lump in the throat');});
test('speech errors and missing voices give feedback rather than failing silently',()=>{const h=setup();h.run('speakEnglish("hello")');h.spoken.onerror({error:'voice-unavailable'});assert.match(h.label.textContent,/Stimme nicht verfügbar/);});
test('old canceled callbacks cannot overwrite the new speech status',()=>{const h=setup();h.run('speakEnglish("one")');const old=h.spoken;h.synth.speaking=true;h.run('speakEnglish("two")');const status=h.label.textContent;old.onerror({error:'canceled'});assert.equal(h.label.textContent,status);assert.equal(h.canceled,1);});

test('English voice selection excludes effects and prefers higher quality device voices', () => {
  const h = setup();
  h.run(`
    window.speechSynthesis.getVoices = () => [
      {name:'Albert', lang:'en-US', localService:true, default:true},
      {name:'Bells', lang:'en-US', localService:true},
      {name:'Anna', lang:'de-DE', localService:true},
      {name:'Daniel', voiceURI:'daniel', lang:'en-GB', localService:true},
      {name:'Samantha (Enhanced)', voiceURI:'samantha-enhanced', lang:'en-US', localService:true},
    ];
    speakBrowserEnglish('Hello');
  `);
  assert.equal(h.spoken.voice.name, 'Samantha (Enhanced)');
  h.run(`
    const voiceStorage = new Map();
    globalThis.localStorage = {setItem:(key,value) => voiceStorage.set(key,value)};
    chooseSpeechVoice('daniel');
    previewSpeechVoice();
  `);
  assert.equal(h.spoken.voice.name, 'Daniel');
  assert.equal(h.run('voiceStorage.get(SPEECH_VOICE_KEY)'), 'daniel');
  h.run(`
    globalThis.VOCAB_AUDIO = {hello:'test.mp3'};
    globalThis.Audio = function() { throw new Error('Chosen voice should take precedence'); };
    speakEnglish('Hello');
  `);
  assert.equal(h.spoken.text, 'Hello');
  assert.equal(h.spoken.voice.name, 'Daniel');
});
