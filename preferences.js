/* Device-local presentation preferences; vocabulary and review data stay untouched. */
const PREFERENCES_KEY='wesentlich_vocab_preferences_v1';
const LAST_PRACTICE_KEY='wesentlich_vocab_last_practice_v1';
const defaultPreferences={roundSize:6,images:true,motion:false};
let preferences={...defaultPreferences};
function loadPreferences(){
  try{
    const saved=JSON.parse(localStorage.getItem(PREFERENCES_KEY)||'null');
    if(saved&&typeof saved==='object')preferences={
      roundSize:[3,5,6].includes(saved.roundSize)?saved.roundSize:6,
      images:typeof saved.images==='boolean'?saved.images:true,
      motion:typeof saved.motion==='boolean'?saved.motion:false
    };
  }catch{preferences={...defaultPreferences};}
  applyPreferences();
}
function applyPreferences(){
  document.getElementById('round-size').value=String(preferences.roundSize);
  document.getElementById('show-images').checked=preferences.images;
  document.getElementById('allow-motion').checked=preferences.motion;
  document.body.classList.toggle('allow-motion',preferences.motion);
}
function savePreferences(){
  const size=Number(document.getElementById('round-size').value);
  const next={roundSize:[3,5,6].includes(size)?size:6,
    images:document.getElementById('show-images').checked,
    motion:document.getElementById('allow-motion').checked};
  try{
    localStorage.setItem(PREFERENCES_KEY,JSON.stringify(next));preferences=next;
    document.getElementById('preferences-message').textContent='Für dieses Gerät gespeichert.';
    applyPreferences();renderStudy();
  }catch{document.getElementById('preferences-message').textContent='Einstellungen konnten nicht gespeichert werden. Deine Lernstände bleiben erhalten.';applyPreferences();}
}
function isDifficultCard(c){
  const last=c.reviews.at(-1);
  return last?last.rating<=1:c.base.reps>0&&c.ease<2;
}
function lastPractice(){
  let saved=0;try{saved=Number(localStorage.getItem(LAST_PRACTICE_KEY))||0;}catch{}
  return state.cards.reduce((latest,c)=>c.reviews.reduce((time,r)=>Math.max(time,r.at),latest),saved);
}
function recordPractice(){
  try{localStorage.setItem(LAST_PRACTICE_KEY,String(Date.now()));}catch{/* The review log remains authoritative. */}
}
function startGentleRound(){startRound(availableCards().slice(0,3));}
