const EMOTION_MODULE = 'Periodensystem der Emotionen';
const emotionTiles = new Map();
const emotionFilters = new Map();
let emotionFilter = 'all';
let selectedEmotion = null;

function emotionCard(emotion) {
  return {
    front: emotion.de + '\n' + emotion.context,
    back: emotion.noun + ' / ' + emotion.adj,
    notes: 'NARM-inspirierte Intervention: ' + emotion.narm,
    module: EMOTION_MODULE,
  };
}

function emotionIdPrefix(emotion) {
  return 'emotion-table-' + emotion.sym + '-';
}

function emotionInTraining(emotion) {
  const prefix = emotionIdPrefix(emotion);
  const key = C.key(emotionCard(emotion));
  return cards.some(card => card.id.startsWith(prefix) || C.key(card) === key);
}

function refreshEmotionTraining() {
  for (const [emotion, tile] of emotionTiles) {
    const added = emotionInTraining(emotion);
    tile.classList.toggle('in-training', added);
    tile.setAttribute('aria-label', emotion.noun + ', ' + emotion.de +
      ', Stufe ' + emotion.r + (added ? ', im Training' : ''));
  }
  if (selectedEmotion) {
    const added = emotionInTraining(selectedEmotion);
    const button = $('emotion-add');
    button.disabled = added || storageBlocked;
    button.textContent = added ? 'Bereits im Training' : 'In meinen Vokabeltrainer übernehmen';
  }
}

function showEmotionTable() {
  if (!emotionFilters.size) {
    for (const [filter, label] of Object.entries({all: 'Alle (Periodensystem)', ...EMOTION_CATEGORIES})) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn-secondary';
      button.dataset.emotionCategory = filter;
      button.textContent = label;
      button.onclick = () => renderEmotionGrid(filter);
      emotionFilters.set(filter, button);
      $('emotion-filters').append(button);
    }
    renderEmotionGrid(emotionFilter);
  } else {
    refreshEmotionTraining();
  }
}

function renderEmotionGrid(filter) {
  emotionFilter = filter;
  for (const [category, button] of emotionFilters) {
    button.setAttribute('aria-pressed', String(category === filter));
  }
  const grid = $('emotion-grid');
  grid.classList.toggle('emotion-grid-filtered', filter !== 'all');
  $('emotion-scroll').scrollLeft = 0;
  grid.replaceChildren();
  emotionTiles.clear();

  for (const emotion of EMOTION_ELEMENTS) {
    if (filter !== 'all' && emotion.cat !== filter) continue;
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'emotion-tile';
    tile.dataset.emotionCategory = emotion.cat;
    tile.style.setProperty('--emotion-row', emotion.r);
    tile.style.setProperty('--emotion-column', emotion.c);
    tile.classList.toggle('emotion-last-row', emotion.r === 7);
    tile.onclick = () => openEmotionDetail(emotion);
    for (const [part, value, lang] of [
      ['level', emotion.r], ['symbol', emotion.sym],
      ['noun', emotion.noun, 'en'], ['translation', emotion.de],
    ]) {
      const span = document.createElement('span');
      span.className = 'emotion-tile-' + part;
      span.textContent = value;
      if (lang) span.lang = lang;
      tile.append(span);
    }
    emotionTiles.set(emotion, tile);
    grid.append(tile);
  }
  refreshEmotionTraining();
}

function openEmotionDetail(emotion) {
  selectedEmotion = emotion;
  const dialog = $('emotion-dialog');
  dialog.dataset.emotionCategory = emotion.cat;
  $('emotion-detail-category').textContent = EMOTION_CATEGORIES[emotion.cat] + ' · Stufe ' + emotion.r;
  $('emotion-detail-title').textContent = emotion.noun;
  $('emotion-detail-adj').textContent = emotion.adj;
  $('emotion-detail-de').textContent = emotion.de;
  $('emotion-detail-client').textContent = emotion.client;
  $('emotion-detail-context').textContent = emotion.context;
  $('emotion-detail-narm').textContent = emotion.narm;
  $('emotion-add-status').textContent = '';
  $('emotion-speech-status').textContent = '';
  refreshEmotionTraining();
  renderSpeechVoiceChoices();
  dialog.showModal();
}

function closeEmotionDetail() {
  stopAudio();
  $('emotion-speech-status').textContent = '';
  selectedEmotion = null;
}

function speakEmotionDetail(part) {
  if (!selectedEmotion) return;
  const {noun, adj, client, narm} = selectedEmotion;
  const words = {family: noun + '. ' + adj.replace(/\s*\/\s*/g, ', or '), client, narm};
  speakBrowserEnglish(words[part], .9);
}

function addEmotionCard() {
  if (!selectedEmotion || storageBlocked || emotionInTraining(selectedEmotion)) return;
  const prefix = emotionIdPrefix(selectedEmotion);
  // The first import uses the same ID on every device. A deleted card needs a new ID.
  let generation = 1;
  const ids = new Set(state.cards.map(card => card.id));
  while (ids.has(prefix + generation)) generation++;
  const plan = C.planImport(state, [emotionCard(selectedEmotion)], () => prefix + generation, Date.now());
  if (!plan.added.length) return;
  const saved = commit(C.merge(state, {schemaVersion: 2, cards: plan.added}));
  $('emotion-add-status').textContent = saved
    ? 'Hinzugefügt. Du findest die Karte unter „Karten“ im Thema „Periodensystem der Emotionen“.'
    : 'Die Karte konnte nicht gespeichert werden. Prüfe den Gerätespeicher und versuche es erneut.';
}
