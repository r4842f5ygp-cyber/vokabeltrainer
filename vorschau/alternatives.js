let alternativeEditId=null;
function resetAlternativeForm() {
  alternativeEditId=null;$('alternative-text').value='';$('alternative-note').value='';$('alternative-message').textContent='';$('alternative-form').open=false;
}
function speakAlternative(text) {
  if(!('speechSynthesis' in window))return;
  window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.9;window.speechSynthesis.speak(u);
}
function renderAlternatives() {
  const list=$('alternatives-list');list.replaceChildren();
  const entries=(currentCard?.alternatives||[]).filter(a=>!a.deletedAt);
  $('alternatives-section').classList.toggle('hidden',!entries.length);
  $('use-answer').classList.toggle('hidden',!$('user-answer').value.trim());
  for(const a of entries){
    const row=document.createElement('div');row.className='alternative-row';
    const content=document.createElement('div'),term=document.createElement('strong'),note=document.createElement('p');
    term.textContent=a.text;note.textContent=a.note;note.className='help';content.append(term,note);row.append(content);
    for(const [label,action] of [['Anhören',()=>speakAlternative(a.text)],['Bearbeiten',()=>editAlternative(a.id)],['Entfernen',()=>removeAlternative(a.id)]]){
      const b=document.createElement('button');b.className='text-btn';b.textContent=label;b.onclick=action;row.append(b);
    }list.append(row);
  }
}
function useMyAnswer(){if(!currentCard || !isRevealed)return;$('alternative-text').value=$('user-answer').value.trim();$('alternative-form').open=true;$('alternative-text').focus();}
function editAlternative(id){const a=currentCard?.alternatives?.find(a=>a.id===id&&!a.deletedAt);if(!a)return;alternativeEditId=id;$('alternative-text').value=a.text;$('alternative-note').value=a.note;$('alternative-form').open=true;}
function saveAlternative(){
  if(!currentCard || !isRevealed)return;
  const text=$('alternative-text').value.trim(),note=$('alternative-note').value.trim();
  if(!text){$('alternative-message').textContent='Bitte eine englische Formulierung eingeben.';return;}
  const next=C.merge(state),c=next.cards.find(c=>c.id===currentCard.id);
  if(!c || c.deletedAt){$('alternative-message').textContent='Diese Karte wurde inzwischen gelöscht.';return;}
  c.alternatives=c.alternatives||[];
  if(normalizeText(c.back)===normalizeText(text)||c.alternatives.some(a=>!a.deletedAt&&a.id!==alternativeEditId&&normalizeText(a.text)===normalizeText(text))){$('alternative-message').textContent='Diese Formulierung ist bereits vorhanden.';return;}
  const old=c.alternatives.find(a=>a.id===alternativeEditId);
  if(alternativeEditId&&(!old||old.deletedAt)){$('alternative-message').textContent='Diese Alternative wurde inzwischen entfernt.';return;}
  const a={id:old?.id||uuid(),text,note,updatedAt:Math.max(Date.now(),(old?.updatedAt||0)+1),deletedAt:0};
  c.alternatives=old?c.alternatives.map(v=>v.id===a.id?a:v):[...c.alternatives,a];
  if(commit(next)){currentCard=cards.find(v=>v.id===c.id);resetAlternativeForm();renderAlternatives();$('alternative-message').textContent='Gespeichert. Diese Formulierung gilt künftig ebenfalls als passende Antwort.';}
}
function removeAlternative(id){
  if(!currentCard || !confirm('Diese Alternative entfernen?'))return;
  const next=C.merge(state),c=next.cards.find(c=>c.id===currentCard.id),a=c?.alternatives?.find(a=>a.id===id);
  if(!a)return;a.deletedAt=Date.now();
  if(commit(next)){currentCard=cards.find(v=>v.id===c.id);renderAlternatives();}
}
