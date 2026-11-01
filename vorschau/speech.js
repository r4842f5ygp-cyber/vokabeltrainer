/* All synthesis starts synchronously inside a user tap, including on iOS. */
let activeSpeech=null,speechAttempt=0,speechTimer=null,englishVoices=[];
function speechStatus(message){const el=document.getElementById('speech-status');if(el)el.textContent=message;}
function refreshSpeechVoices(){
  try{englishVoices=window.speechSynthesis.getVoices().filter(v=>/^en[-_]/i.test(v.lang)).sort((a,b)=>Number(b.localService)-Number(a.localService)||Number(b.default)-Number(a.default));}catch{englishVoices=[];}
}
function speakEnglish(text,rate=.95){
  const synth=window.speechSynthesis;
  if(!synth || typeof SpeechSynthesisUtterance==='undefined'){speechStatus('Dieser Browser bietet keine Sprachausgabe. Bitte in Safari versuchen.');return;}
  if(!text || !text.trim())return;
  stopSpeechRecognition();
  const attempt=++speechAttempt;clearTimeout(speechTimer);
  refreshSpeechVoices();
  try{
    if(synth.speaking || synth.pending)synth.cancel();
    if(synth.paused)synth.resume();
    const utter=new SpeechSynthesisUtterance(text);
    activeSpeech=utter;utter.lang='en-US';utter.rate=rate;utter.volume=1;
    if(englishVoices.length){utter.voice=englishVoices[0];utter.lang=utter.voice.lang;}
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
if('speechSynthesis' in window){refreshSpeechVoices();window.speechSynthesis.addEventListener?.('voiceschanged',refreshSpeechVoices);}
