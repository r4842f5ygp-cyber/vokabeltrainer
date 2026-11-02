/* One atlas, loaded only on request. Associations are hints, not diagnoses. */
const EMOTION_IMAGES={
  tired:[0,'Eine Person sitzt müde am Bettrand.'],sleepy:[0,'Eine schläfrige Person ruht am Bettrand.'],exhausted:[0,'Eine Person sitzt mit erschöpfter Haltung.'],
  awake:[1,'Eine wache Person streckt sich im Morgenlicht.'],'wide awake':[1,'Eine aufmerksame Person im hellen Morgenlicht.'],
  angry:[2,'Eine Person mit verschränkten Armen und angespanntem Gesicht.'],'to be angry with someone':[2,'Eine Person zeigt ihren Ärger.'],
  sad:[3,'Eine traurig wirkende Person sitzt mit angezogenen Knien.'],
  compassion:[4,'Eine Person bietet einer anderen behutsam Unterstützung an.'],caring:[4,'Eine Person kümmert sich zugewandt um eine andere.'],empathetic:[4,'Eine Person hört einer anderen aufmerksam zu.'],
  relaxed:[5,'Eine Person ruht entspannt in einem Sessel.'],calm:[5,'Eine Person sitzt ruhig in einem Sessel.'],content:[5,'Eine Person genießt einen ruhigen Moment.'],
  anxious:[6,'Eine Person grübelt; über ihr ist ein Gedankenknäuel.'],tense:[6,'Eine Person sitzt mit angespannten Händen.'],restless:[6,'Ein Gedankenknäuel begleitet die innere Unruhe.'],
  lonely:[8,'Eine Person sitzt auf einer Bank, neben ihr bleibt viel Platz.'],
  connected:[9,'Zwei Personen umarmen sich zugewandt.'],'safe and secure':[9,'Zwei Personen finden Halt in einer behutsamen Umarmung.'],loving:[9,'Zwei Personen begegnen einander liebevoll.'],affection:[9,'Eine warme Umarmung steht für Zuneigung.'],tender:[9,'Zwei Personen halten einander zärtlich.'],
  grateful:[10,'Eine Person legt dankbar die Hände an ihr Herz.'],happy:[11,'Zwei Personen freuen sich über ein Wiedersehen.'],excited:[11,'Eine Person begrüßt eine andere voller Vorfreude.'],
  curious:[12,'Eine Person betrachtet interessiert einen kleinen Sämling.'],hopeful:[12,'Ein kleiner Sämling steht als Bild für Hoffnung.'],optimistic:[12,'Eine Person wendet sich einem wachsenden Sämling zu.'],
  relieved:[13,'Eine Person atmet aus, nachdem sie eine schwere Tasche abgestellt hat.'],
  longing:[14,'Zwei Personen strecken einander über einen Abstand die Hände entgegen.'],'to miss':[14,'Zwei Personen möchten den Abstand zueinander überbrücken.'],
  moved:[15,'Eine Person legt emotional berührt eine Hand an ihr Herz.']
};
function emotionImage(card){
  if(!card)return null;
  if(card.back==='overwhelmed')return /^überfordert$/i.test(card.front)?[7,'Eine Person hat zu viele Aufgaben und Papierstapel vor sich.']:
    /^überwältigt$/i.test(card.front)?[11,'Eine Person ist beim Wiedersehen vor Freude überwältigt.']:null;
  return EMOTION_IMAGES[card.back.toLowerCase().trim()]||null;
}
function renderImageHint(){
  const hint=preferences.images?emotionImage(currentCard):null;
  document.getElementById('image-hint').classList.toggle('hidden',!hint);
  document.getElementById('image-hint').open=false;
  document.getElementById('emotion-image').style.backgroundImage='none';
  document.getElementById('image-caption').textContent=hint?hint[1]:'';
}
function showImageHint(){
  const details=document.getElementById('image-hint'),hint=emotionImage(currentCard);
  if(!details.open||!hint||!preferences.images)return;
  const figure=document.getElementById('emotion-image');
  figure.style.backgroundImage='url("assets/emotions.jpg")';
  figure.style.backgroundPosition=(hint[0]%4*100/3)+'% '+(Math.floor(hint[0]/4)*100/3)+'%';
}
function cardExample(card){
  const match=card?.notes.match(/^Beispiel: (.+)\nDeutsch: (.+)\nBedeutung: ([\s\S]+)$/);
  return match?{english:match[1],german:match[2],meaning:match[3]}:null;
}
function renderCardExample(){
  const example=cardExample(currentCard);
  document.getElementById('example-section').classList.toggle('hidden',!example);
  document.getElementById('example-english').textContent=example?.english||'';
  document.getElementById('example-german').textContent=example?.german||'';
  document.getElementById('notes-text').textContent=example?.meaning||currentCard.notes;
  document.getElementById('meaning-details').classList.toggle('hidden',!currentCard.notes);
  document.getElementById('meaning-details').open=false;
  document.getElementById('alternatives-details').open=false;
}
function speakExample(rate=.95){const example=cardExample(currentCard);if(example)speakEnglish(example.english,rate);}
