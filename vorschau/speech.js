/* All synthesis starts synchronously inside a user tap, including on iOS. */
let activeSpeech=null,speechAttempt=0,speechTimer=null,englishVoices=[],activeLocalAudio=null,lastAudioRequest=null;
const SPEECH_VOICE_KEY = 'wesentlich_preview_vocab_english_voice_v1';
const noveltyVoices = new Set([
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'deranged',
  'fred', 'good news', 'hysterical', 'jester', 'junior', 'kathy', 'organ', 'ralph',
  'superstar', 'trinoids', 'whisper', 'wobble', 'zarvox',
]);
let preferredVoiceId = '';
try { preferredVoiceId = localStorage.getItem(SPEECH_VOICE_KEY) || ''; } catch {}

function stopAudio(){
  speechAttempt++;clearTimeout(speechTimer);
  if(activeLocalAudio){activeLocalAudio.pause();activeLocalAudio=null;}
  const synth=window.speechSynthesis;
  if(synth&&(synth.speaking||synth.pending||activeSpeech))synth.cancel();
  activeSpeech=null;speechStatus('');
}
function speakEnglish(text,rate=.95){
  if(!text||!text.trim())return;
  lastAudioRequest={text,rate};
  const key=(text||'').toLowerCase().replace(/\s+/g,' ').trim();
  if (preferredVoiceId) {
    refreshSpeechVoices();
    if (englishVoices.some(voice => voiceId(voice) === preferredVoiceId)) {
      return speakBrowserEnglish(text, rate);
    }
  }
  const file=typeof VOCAB_AUDIO==='object'?VOCAB_AUDIO[key]:null;
  if(!file||typeof Audio!=='function')return speakBrowserEnglish(text,rate);
  stopAudio();stopSpeechRecognition();
  const attempt=++speechAttempt;
  try{
    const player=new Audio(file);activeLocalAudio=player;
    player.preload='auto';player.volume=1;player.playbackRate=rate<.9?.75:1;player.preservesPitch=true;
    const current=()=>attempt===speechAttempt&&activeLocalAudio===player;
    const failed=()=>{if(!current())return;clearTimeout(speechTimer);player.pause();activeLocalAudio=null;speechStatus('Audio konnte nicht abgespielt werden. Tippe auf „Gerätestimme“ oder versuche es online erneut.');};
    player.onplaying=()=>{if(current()){clearTimeout(speechTimer);speechStatus('Wiedergabe läuft.');}};
    player.onended=()=>{if(current()){clearTimeout(speechTimer);activeLocalAudio=null;speechStatus('');}};
    player.onerror=failed;
    speechStatus('Audio wird geladen …');
    speechTimer=setTimeout(()=>{if(current())speechStatus('Audio braucht länger. Du kannst erneut auf „Anhören“ oder auf „Gerätestimme“ tippen.');},7000);
    // Keep play inside the user gesture; no preceding fetch or voice-loading await.
    const started=player.play();if(started?.catch)started.catch(failed);
  }catch{if(attempt===speechAttempt){clearTimeout(speechTimer);activeLocalAudio=null;speechStatus('Audio konnte nicht gestartet werden. Bitte auf „Gerätestimme“ tippen.');}}
}
function speechStatus(message) {
  const id = document.getElementById('emotion-dialog')?.open ? 'emotion-speech-status' : 'speech-status';
  const status = document.getElementById(id);
  if (status) status.textContent = message;
}
function voiceId(voice) {
  return voice.voiceURI || voice.lang + ':' + (voice.name || '');
}

function voiceQuality(voice) {
  const descriptor = (voice.name || '') + ' ' + (voice.voiceURI || '');
  if (/premium|natural|neural/i.test(descriptor)) return 3;
  if (/enhanced/i.test(descriptor)) return 2;
  if (/\b(alex|daniel|karen|moira|samantha|serena|tessa)\b/i.test(descriptor)) return 1;
  return 0;
}

function refreshSpeechVoices() {
  try {
    englishVoices = window.speechSynthesis.getVoices()
      .filter(voice => /^en(?:[-_]|$)/i.test(voice.lang)
        && !noveltyVoices.has((voice.name || '').trim().toLowerCase())
        && !/\b(novelty|espeak)\b/i.test(voice.voiceURI || ''))
      .sort((a, b) => Number(Boolean(b.localService)) - Number(Boolean(a.localService))
        || voiceQuality(b) - voiceQuality(a)
        || Number(Boolean(b.default)) - Number(Boolean(a.default)));
  } catch { englishVoices = []; }
}

function renderSpeechVoiceChoices() {
  const select = document.getElementById('emotion-voice');
  if (!select) return;
  refreshSpeechVoices();
  const automatic = document.createElement('option');
  automatic.value = '';
  automatic.textContent = 'Automatisch';
  select.replaceChildren(automatic);
  const seen = new Set();
  for (const voice of englishVoices) {
    const id = voiceId(voice);
    if (seen.has(id)) continue;
    seen.add(id);
    const option = document.createElement('option');
    option.value = id;
    option.textContent = voice.name + ' (' + voice.lang + ')';
    select.append(option);
  }
  select.value = seen.has(preferredVoiceId) ? preferredVoiceId : '';
  select.disabled = !seen.size;
}

function chooseSpeechVoice(id) {
  stopAudio();
  preferredVoiceId = id;
  try { localStorage.setItem(SPEECH_VOICE_KEY, id); } catch {}
}

function previewSpeechVoice() {
  speakBrowserEnglish('Take your time. What do you notice right now?', .9);
}

function speakBrowserEnglish(text,rate=.95){
  const synth=window.speechSynthesis;
  if(!synth || typeof SpeechSynthesisUtterance==='undefined'){speechStatus('Dieser Browser bietet keine Sprachausgabe. Bitte in Safari versuchen.');return;}
  if(!text || !text.trim())return;
  stopAudio();
  stopSpeechRecognition();
  const attempt=++speechAttempt;clearTimeout(speechTimer);
  refreshSpeechVoices();
  try{
    if(synth.paused)synth.resume();
    const utter=new SpeechSynthesisUtterance(text);
    activeSpeech=utter;utter.lang='en-US';utter.rate=rate;utter.volume=1;
    const voice = englishVoices.find(candidate => voiceId(candidate) === preferredVoiceId) || englishVoices[0];
    if (voice) { utter.voice = voice; utter.lang = voice.lang; }
    utter.onstart=()=>{if(attempt!==speechAttempt)return;clearTimeout(speechTimer);speechStatus('Wiedergabe läuft. Kein Ton? Lautlosmodus, Medienlautstärke und Bluetooth prüfen.');};
    utter.onend=()=>{if(attempt!==speechAttempt)return;clearTimeout(speechTimer);activeSpeech=null;speechStatus('');};
    utter.onerror=event=>{
      if(attempt!==speechAttempt)return;clearTimeout(speechTimer);activeSpeech=null;
      if(['canceled','interrupted'].includes(event.error)){speechStatus('Wiedergabe unterbrochen. Zum Wiederholen erneut auf den Lautsprecher tippen.');return;}
      const message=['voice-unavailable','language-unavailable','synthesis-unavailable'].includes(event.error)?'Englische Stimme nicht verfügbar. Bitte online in Safari erneut versuchen.':'Sprachausgabe nicht gestartet. Bitte erneut auf den Lautsprecher tippen.';
      speechStatus(message+' ('+(event.error||'unbekannter Fehler')+')');
    };
    speechStatus('Sprachausgabe wird gestartet …');
    speechTimer=setTimeout(()=>{if(attempt===speechAttempt)speechStatus('Kein Wiedergabestart gemeldet. Bitte Lautlosmodus ausschalten, Medienlautstärke erhöhen und erneut tippen. Falls nötig, direkt in Safari testen.');},7000);
    synth.speak(utter);
  }catch{clearTimeout(speechTimer);activeSpeech=null;speechStatus('Sprachausgabe konnte nicht gestartet werden. Bitte direkt in Safari erneut versuchen.');}
}
if ('speechSynthesis' in window) {
  refreshSpeechVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    if (document.getElementById('emotion-dialog')?.open) renderSpeechVoiceChoices();
  });
}
