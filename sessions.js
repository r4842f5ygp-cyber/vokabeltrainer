/* Short, resumable rounds. The review log is authoritative after a crash. */
const ROUND_KEY = 'wesentlich_vocab_round_v1';
let round = null;
const $ = id => document.getElementById(id);
const moduleOf = c => c.module || c.notes.match(/^\[([^\]]+)\]/)?.[1] || 'Ohne Thema';
function roundIndex() {
  if (!round) return -1;
  return round.ids.findIndex((id,i)=>{
    const c=state.cards.find(c=>c.id===id);
    return c && !c.deletedAt && !c.reviews.some(r=>r.id===round.id+':'+i);
  });
}
function roundReviews() {
  return round ? round.ids.flatMap((id,i)=>state.cards.find(c=>c.id===id)?.reviews.filter(r=>r.id===round.id+':'+i)||[]) : [];
}
function storeRound(next) {
  try { localStorage.setItem(ROUND_KEY,JSON.stringify(next)); round=next; return true; }
  catch { $('round-message').textContent='Runde nicht gespeichert. Bitte Gerätespeicher prüfen.'; return false; }
}
function loadRound() {
  try {
    const r=JSON.parse(localStorage.getItem(ROUND_KEY)||'null');
    if (r && typeof r.id==='string' && Array.isArray(r.ids) && r.ids.length<=6 && r.ids.every(x=>typeof x==='string') && new Set(r.ids).size===r.ids.length) {
      round={id:r.id,ids:r.ids,paused:true,slot:Number.isInteger(r.slot)?r.slot:-1,answer:typeof r.answer==='string'?r.answer:'',revealed:!!r.revealed};
    }
  } catch { $('round-message').textContent='Die letzte Runde konnte nicht wiederhergestellt werden. Deine Karten sind erhalten.'; }
}
function availableCards() {
  const topic=$('study-module').value;
  const today=new Date();today.setHours(0,0,0,0);
  const introduced=cards.filter(c=>c.base.reps===0 && c.reviews.length && c.reviews[0].at>=today.getTime()).length;
  const due=getDueCards().filter(c=>!topic || moduleOf(c)===topic);
  const reviews=due.filter(c=>c.base.reps>0 || c.reviews.length);
  const fresh=due.filter(c=>!c.base.reps && !c.reviews.length).slice(0,Math.max(0,5-introduced));
  return [...reviews,...fresh];
}
function updateTopics() {
  for (const id of ['study-module','manage-module']) {
    const select=$(id), value=select.value;
    select.replaceChildren();
    const all=document.createElement('option');all.value='';all.textContent='Alle Themen';select.append(all);
    for (const topic of [...new Set(cards.map(moduleOf))].sort()) { const option=document.createElement('option');option.value=topic;option.textContent=topic;select.append(option); }
    select.value=[...new Set(cards.map(moduleOf))].includes(value)?value:'';
  }
}
function startRound() {
  if (storageBlocked) return;
  const selected=availableCards().slice(0,6);
  if (!selected.length) return renderStudy();
  if (storeRound({id:uuid(),ids:selected.map(c=>c.id),paused:false,slot:0,answer:'',revealed:false})) renderStudy();
}
function saveRoundDraft() {
  if (!round || round.paused || !currentCard) return;
  storeRound({...round,slot:roundIndex(),answer:$('user-answer').value,revealed:isRevealed});
}
function pauseRound() {
  saveRoundDraft();
  if (round && storeRound({...round,paused:true})) { stopSpeechRecognition(); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); renderStudy(); }
}
function resumeRound() { if (round && storeRound({...round,paused:false})) renderStudy(); }
function finishRound() { if(storeRound(null)) renderStudy(); }
function renderStudy() {
  stopSpeechRecognition();updateStats();updateTopics();
  const active=!!round && !round.paused && roundIndex()>=0;
  const complete=!!round && roundIndex()<0;
  $('round-home').classList.toggle('hidden',active || complete);
  $('study-card').classList.toggle('hidden',!active);
  $('action-bar').classList.toggle('hidden',!active);
  $('round-top').classList.toggle('hidden',!active);
  $('round-complete').classList.toggle('hidden',!complete);
  $('resume-round').classList.toggle('hidden',!round || complete);
  $('start-round').classList.toggle('hidden',!!round);
  if (complete) {
    currentCard=null;
    const rs=roundReviews(), secure=rs.filter(r=>r.rating>=2).length;
    $('completion-detail').textContent=rs.length+' Aufgaben abgeschlossen · '+secure+' als gut oder einfach bewertet.';
    $('completion-next').textContent=rs.some(r=>r.rating===0)?'Unsichere Ausdrücke kommen frühestens in zehn Minuten wieder.':'Deine Wiederholungen sind eingeplant.';
    return;
  }
  if (!active) {
    currentCard=null;
    const available=availableCards();
    $('start-round').disabled=storageBlocked || !available.length;
    $('home-title').textContent=!cards.length?'Dein Englisch. Für echte Begegnungen.':round?'Deine Runde wartet auf Dich.':'Ein kleiner Schritt für Dein Englisch.';
    $('home-detail').textContent=round?'Du kannst genau dort weitermachen, wo Du aufgehört hast.':available.length?Math.min(6,available.length)+' Aufgaben · in Deinem Tempo':'Gerade ist keine Aufgabe verfügbar. Pro Tag kommen höchstens fünf neue Karten hinzu.';
    $('empty-study').classList.toggle('hidden',!!cards.length);
    return;
  }
  const index=roundIndex();currentCard=cards.find(c=>c.id===round.ids[index]);isRevealed=false;
  $('round-position').textContent='Aufgabe '+(index+1)+' von '+round.ids.length;
  $('round-progress').max=round.ids.length;$('round-progress').value=index;
  $('card-topic').textContent=moduleOf(currentCard);
  $('front-text').textContent=currentCard.front;$('back-text').textContent=currentCard.back;
  $('card-content').classList.remove('hidden');
  $('user-answer').value=round.slot===index?round.answer:'';$('user-answer').disabled=false;
  resetAlternativeForm();
  $('check-feedback').classList.add('hidden');$('answer-section').classList.add('hidden');
  $('notes-text').textContent=currentCard.notes;$('notes-text').classList.toggle('hidden',!currentCard.notes);
  $('show-answer-btn').classList.remove('hidden');$('rating-buttons').classList.add('hidden');
  for(let r=0;r<4;r++) $('int-'+r).textContent=calculateSM2(currentCard,r).label;
  if(round.slot===index && round.revealed) revealAnswer();
}
function rateCard(rating) {
  if (!round || round.paused || !currentCard || !isRevealed) return;
  const index=roundIndex(), next=C.merge(state), record=next.cards.find(c=>c.id===currentCard.id);
  if (!record || record.deletedAt) return renderStudy();
  const eventId=round.id+':'+index;
  if(!record.reviews.some(r=>r.id===eventId)) record.reviews.push({id:eventId,at:Date.now(),rating});
  if(commit(next)) { storeRound({...round,slot:-1,answer:'',revealed:false});renderStudy(); }
}
let editingId=null;
function editCard(id) {
  const c=cards.find(c=>c.id===id);if(!c)return;
  editingId=id;for(const name of ['front','back','notes','module']) $('edit-'+name).value=c[name]||'';
  $('edit-message').textContent='';$('edit-dialog').showModal();
}
function saveEdit() {
  const next=C.merge(state),c=next.cards.find(c=>c.id===editingId);
  if(!c || c.deletedAt) { $('edit-message').textContent='Diese Karte wurde inzwischen gelöscht.';return; }
  const front=$('edit-front').value.trim(),back=$('edit-back').value.trim();
  if(!front || !back){$('edit-message').textContent='Bitte beide Seiten ausfüllen.';return;}
  if(cards.some(other=>other.id!==c.id && C.key(other)===C.key({front,back}))){$('edit-message').textContent='Diese Karte ist bereits vorhanden.';return;}
  Object.assign(c,{front,back,notes:$('edit-notes').value.trim(),module:$('edit-module').value.trim(),updatedAt:Math.max(Date.now(),c.updatedAt+1)});
  if(commit(next)){$('edit-dialog').close();renderCardList();updateTopics();}
}
function addPack(name) {
  const pack=VOCAB_PACKS.find(p=>p.name===name);if(!pack)return;
  const entries=pack.entries.map(([front,back,notes,alternatives])=>({front,back,notes,alternatives:alternatives||[],module:name}));
  const plan=C.planImport(state,entries,uuid,Date.now());
  if(!plan.added.length){$('pack-message').textContent='Dieses Paket ist bereits vorhanden.';return;}
  if(commit(C.merge(state,{schemaVersion:2,cards:plan.added}),{backup:true})){$('pack-message').textContent=plan.added.length+' Karten hinzugefügt.';renderStudy();}
}
function renderPacks() {
  const list=$('pack-list');list.replaceChildren();
  for(const pack of VOCAB_PACKS){const button=document.createElement('button');button.className='pack-card';button.disabled=storageBlocked;button.textContent=pack.name+' · '+pack.entries.length+' Karten';button.onclick=()=>addPack(pack.name);list.append(button);}
}
loadData();if(!storageBlocked)loadRound();initSpeechRecognition();renderPacks();renderStudy();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden' && round && !round.paused)pauseRound();});
