/* Local persistence and per-device GitHub Gist snapshots. No secrets in backups. */
const C = VocabCore;
const STATE_KEY = 'wesentlich_preview_vocab_state_v2';
const DEVICE_KEY = 'wesentlich_preview_vocab_device_v2';
const RECOVERY_KEY = 'wesentlich_preview_vocab_before_import_v2';
const SNAPSHOT_PREFIX = 'wesentlich_preview_vocab_v2_';
let state = C.empty(), storageBlocked = false, syncPromise = null, syncTimer = null;
let pendingImport = null, importGeneration = 0;
let syncEpoch = 0;
let pasteTimer = null, lastPasteIds = [];
const uuid = () => crypto.randomUUID();
const visibleCards = () => state.cards.filter(c => !c.deletedAt).map(C.project);

function refreshCards() { cards = visibleCards(); updateStats(); }
function setSyncStatus(kind, message) {
  const brief=document.getElementById('connection-summary');
  if(brief)brief.textContent=kind==='error'?'Speicher / Sync prüfen':kind==='ok'?'Synchronisiert':message.includes('offline')?'Offline':message.includes('nicht verbunden')?'Lokal':'Speichert …';
  if(kind==='error')document.getElementById('status-details').open=true;
  for (const id of ['sync-status-badge','global-sync-status']) {
    const el = document.getElementById(id);
    el.className = 'sync-status ' + kind;
    el.textContent = message;
    el.classList.remove('hidden');
  }
}
function persist(next, {backup = false} = {}) {
  if (storageBlocked) throw new Error('Lokale Daten konnten nicht gelesen werden. Bitte zuerst eine Sicherung herunterladen.');
  // Always merge the latest browser copy, including changes from another tab.
  const raw = localStorage.getItem(STATE_KEY);
  const merged = C.merge(raw ? C.validate(JSON.parse(raw)) : C.empty(), next);
  if (backup) localStorage.setItem(RECOVERY_KEY, JSON.stringify(state));
  localStorage.setItem(STATE_KEY, JSON.stringify(merged));
  state = merged; refreshCards(); return merged;
}
function commit(next, options) {
  try { persist(next, options); queueSync(); return true; }
  catch { setSyncStatus('error','Nicht gespeichert: Gerätespeicher prüfen. Eingabe bleibt erhalten.'); return false; }
}
function loadData() {
  try {
    const raw = localStorage.getItem(STATE_KEY), old = localStorage.getItem(STORAGE_KEY);
    state = C.validate(JSON.parse(raw || old || '[]'));
    // The old storage key is deliberately retained as the migration backup.
    localStorage.setItem(STATE_KEY,JSON.stringify(state));
    if (!localStorage.getItem(DEVICE_KEY)) localStorage.setItem(DEVICE_KEY,uuid());
    document.getElementById('github-token').value = localStorage.getItem(GITHUB_TOKEN_KEY) || '';
    document.getElementById('github-gist-id').value = localStorage.getItem(GITHUB_GIST_KEY) || '';
    refreshCards();
    setSyncStatus('pending',localStorage.getItem(GITHUB_GIST_KEY) ? 'Lokal gespeichert · Sync wird geprüft' : 'Lokal gespeichert · Cloud nicht verbunden');
    if (localStorage.getItem(GITHUB_TOKEN_KEY) && localStorage.getItem(GITHUB_GIST_KEY)) queueSync(0);
  } catch {
    storageBlocked = true; cards = []; updateStats();
    setSyncStatus('error','Lokale Daten nicht lesbar. Original bleibt erhalten. Bitte Rohdaten sichern.');
    document.getElementById('storage-recovery').classList.remove('hidden');
    document.querySelectorAll('[data-write]').forEach(el=>el.disabled=true);
  }
}
function queueSync(delay = 800) {
  clearTimeout(syncTimer);
  setSyncStatus('pending',navigator.onLine === false ? 'Lokal gespeichert · offline' : 'Lokal gespeichert · Änderungen ausstehend');
  if (storageBlocked || !localStorage.getItem(GITHUB_TOKEN_KEY) || !localStorage.getItem(GITHUB_GIST_KEY)) {
    if (!storageBlocked) setSyncStatus('pending','Lokal gespeichert · Cloud nicht verbunden');
    return;
  }
  syncTimer = setTimeout(()=>syncNow().catch(()=>{}),delay);
}
async function api(token, url, options = {}) { throw new Error("Cloud-Sync ist in dieser Vorschau ausgeschaltet.");
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(),20000);
  try {
    const res = await fetch(url, { ...options, signal:controller.signal, cache:'no-store',
      headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json', 'Content-Type':'application/json', ...options.headers } });
    if (!res.ok) throw new Error(res.status === 401 ? 'GitHub-Zugang abgelaufen oder ungültig.' : res.status === 403 || res.status === 429 ? 'GitHub lehnt den Zugriff ab oder begrenzt Anfragen. Später erneut versuchen.' : 'GitHub-Anfrage fehlgeschlagen (HTTP ' + res.status + ').');
    return await res.json();
  } finally { clearTimeout(timer); }
}
async function readRemote(token, gistId) {
  const data = await api(token,`https://api.github.com/gists/${gistId}`);
  if (!data.files || data.truncated) throw new Error('Cloud-Dateiliste ist unvollständig. Sync gestoppt.');
  const relevant = Object.entries(data.files).filter(([name])=>name === 'wesentlich_preview_vocab.json' || (name.startsWith(SNAPSHOT_PREFIX) && name.endsWith('.json')));
  if (!relevant.length) throw new Error('Dieses Gist enthält keine Vokabeltrainer-Daten. Bitte Gist-ID prüfen.');
  const states = [];
  for (const [name,file] of relevant) {
    if (file.truncated || typeof file.content !== 'string') throw new Error('Cloud-Datei ist unvollständig: ' + name + '. Sync gestoppt.');
    try { states.push(C.validate(JSON.parse(file.content))); }
    catch { throw new Error('Cloud-Datei nicht lesbar: ' + name + '. Lokale Daten bleiben erhalten.'); }
  }
  return C.merge(...states);
}
async function syncPass(token, gistId, deviceId, epoch) {
  // Each device only writes its own filename. Concurrent devices cannot replace
  // one another's snapshots. Every read merges every snapshot and review event.
  const remote = await readRemote(token,gistId);
  if (epoch !== syncEpoch) throw new Error('Sync-Verbindung wurde inzwischen geändert.');
  persist(C.merge(state,remote));
  const content = JSON.stringify(state);
  await api(token,`https://api.github.com/gists/${gistId}`,{ method:'PATCH',body:JSON.stringify({files:{[SNAPSHOT_PREFIX + deviceId + '.json']:{content}}}) });
  if (epoch !== syncEpoch) throw new Error('Sync-Verbindung wurde inzwischen geändert.');
  // Changes made while the request was in flight remain queued.
  if (JSON.stringify(state) !== content) queueSync();
  else setSyncStatus('ok','Synchronisiert · ' + new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}));
  // Never replace an answer which the user is currently composing.
  if (!document.getElementById('view-manage').classList.contains('hidden')) renderCardList();
  if (!document.getElementById('view-study').classList.contains('hidden') && !currentCard) renderStudy();
}
async function syncNow() {
  if (storageBlocked) return;
  if (syncPromise) { await syncPromise; return; }
  const token = localStorage.getItem(GITHUB_TOKEN_KEY), gistId = localStorage.getItem(GITHUB_GIST_KEY), deviceId = localStorage.getItem(DEVICE_KEY), epoch = syncEpoch;
  if (!token || !gistId || !deviceId) return;
  const work = async () => {
    setSyncStatus('pending','Synchronisiere …');
    try { await syncPass(token,gistId,deviceId,epoch); }
    catch (err) { setSyncStatus('error',(err.name === 'AbortError' ? 'Zeitüberschreitung.' : err.message) + ' Änderungen bleiben lokal; erneut synchronisieren.'); }
  };
  syncPromise = navigator.locks ? navigator.locks.request('wesentlich-vocab-sync',work) : work();
  document.getElementById('btn-force-sync').disabled = true;
  try { await syncPromise; } finally { syncPromise = null; document.getElementById('btn-force-sync').disabled = false; }
}
async function forceSync() {
  if (storageBlocked || syncPromise) return;
  const token = document.getElementById('github-token').value.trim();
  let gistId = document.getElementById('github-gist-id').value.trim();
  if (!token) return alert('Bitte zuerst Deinen GitHub Token eingeben.');
  if (gistId && !/^[a-f0-9]+$/i.test(gistId)) return alert('Bitte nur die Gist-ID eingeben, nicht die gesamte URL.');
  if (!gistId) {
    document.getElementById('btn-force-sync').disabled = true;
    try {
      const deviceId = localStorage.getItem(DEVICE_KEY);
      const data = await api(token,'https://api.github.com/gists',{method:'POST',body:JSON.stringify({description:'Vokabeltrainer · Geräte-Sync v2',public:false,
        files:{[SNAPSHOT_PREFIX+deviceId+'.json']:{content:JSON.stringify(state)}}})});
      gistId = data.id;
      if (!/^[a-f0-9]+$/i.test(gistId)) throw new Error('GitHub hat keine gültige Gist-ID zurückgegeben.');
      document.getElementById('github-gist-id').value = gistId;
    } catch(err) { setSyncStatus('error',err.message); return; }
    finally { document.getElementById('btn-force-sync').disabled = false; }
  }
  try {
    localStorage.setItem(GITHUB_TOKEN_KEY,token); localStorage.setItem(GITHUB_GIST_KEY,gistId); syncEpoch++;
    await syncNow();
  } catch { setSyncStatus('error','Verbindung konnte lokal nicht gespeichert werden.'); }
}
function backupDownload(content, filename, mime='application/json') {
  const blob = new Blob([content],{type:mime}), url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportJSON() { backupDownload(JSON.stringify(state,null,2),'vokabeln-backup-v2-' + new Date().toISOString().slice(0,10) + '.json'); }
function exportRecovery() {
  backupDownload(localStorage.getItem(STATE_KEY) || localStorage.getItem(STORAGE_KEY) || 'null','vokabeln-rohdaten.json');
}
function exportBeforeImport() {
  const raw = localStorage.getItem(RECOVERY_KEY);
  if (!raw) return alert('Es gibt noch keine Sicherung vor einem Import.');
  backupDownload(raw,'vokabeln-vor-import.json');
}
function cancelImport() {
  pendingImport = null; importGeneration++;
  document.getElementById('import-preview').classList.add('hidden');
}
function previewText(text, source) {
  cancelImport();
  try {
    const delimiter = document.getElementById('import-delimiter').value;
    const parsed = C.parseImport(text,delimiter);
    pendingImport = {type:'csv',parsed,source}; renderImportPreview();
  } catch(err) { document.getElementById('import-message').textContent = err.message; }
}
function importBulkText() { previewText(document.getElementById('bulk-text-input').value,'Textfeld'); }
async function readImportFile(event, type) {
  const file = event.target.files[0]; if (!file) return;
  cancelImport(); const generation = importGeneration;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('Bitte eine Datei unter 5 MB auswählen.');
    const buffer = await file.arrayBuffer();
    if (generation !== importGeneration) return;
    const bytes = new Uint8Array(buffer);
    const encoding = bytes[0] === 255 && bytes[1] === 254 ? 'utf-16le' : bytes[0] === 254 && bytes[1] === 255 ? 'utf-16be' : 'utf-8';
    const text = new TextDecoder(encoding,{fatal:true}).decode(bytes).replace(/^\uFEFF/,'');
    if (type === 'json') { pendingImport = {type:'json',data:C.validate(JSON.parse(text)),source:file.name}; renderImportPreview(); }
    else { document.getElementById('bulk-text-input').value = text; previewText(text,file.name); }
  } catch(err) { document.getElementById('import-message').textContent = 'Import nicht möglich: ' + err.message; }
  finally { event.target.value = ''; }
}
function renderImportPreview() {
  const p = pendingImport; if (!p) return;
  const preview = document.getElementById('import-preview'), list = document.getElementById('preview-rows'); list.replaceChildren();
  const entries = p.type === 'csv' ? p.parsed.entries : p.data.cards.filter(c=>!c.deletedAt);
  let description;
  if (p.type === 'csv') {
    const plan = C.planImport(state,entries,uuid,Date.now());
    description = plan.added.length + ' neue Karten · ' + plan.duplicates + ' Dubletten · ' + p.parsed.errors.length + ' fehlerhafte Zeilen';
    document.getElementById('confirm-import').disabled = storageBlocked || !plan.added.length;
  } else {
    description = entries.length + ' Karten im Backup. Karten und Lernverläufe werden anhand ihrer IDs zusammengeführt; Löschungen im Backup werden ebenfalls übernommen.';
    document.getElementById('confirm-import').disabled = storageBlocked;
  }
  document.getElementById('preview-summary').textContent = description;
  document.getElementById('import-message').textContent = p.source;
  for (const c of entries.slice(0,5)) {
    const item = document.createElement('li'), strong = document.createElement('strong'), span = document.createElement('span');
    strong.textContent=c.front; span.textContent=c.back; item.append(strong,document.createElement('br'),span); list.append(item);
  }
  document.getElementById('preview-errors').textContent = p.type === 'csv' ? p.parsed.errors.map(e=>'Zeile '+e.line+': '+e.message).join('\n') : '';
  preview.classList.remove('hidden');
}
function confirmImport() {
  const p = pendingImport; if (!p) return;
  let next;
  if (p.type === 'csv') {
    if (p.parsed.errors.length && !confirm('Die '+p.parsed.errors.length+' fehlerhaften Zeilen überspringen und die gültigen Karten importieren?')) return;
    next = C.merge(state,{schemaVersion:2,cards:C.planImport(state,p.parsed.entries,uuid,Date.now()).added});
  } else next = C.merge(state,p.data);
  if (commit(next,{backup:true})) {
    cancelImport(); document.getElementById('bulk-text-input').value=''; renderCardList();
    document.getElementById('import-message').textContent='Import gespeichert. Vorhandene Lernverläufe bleiben erhalten.';
  }
}
function openPasteDialog() {
  if (storageBlocked) return;
  document.getElementById('paste-input').value='';
  document.getElementById('paste-result').textContent='';
  document.getElementById('undo-paste').classList.toggle('hidden',!lastPasteIds.length);
  document.getElementById('paste-dialog').showModal();
}
function schedulePasteImport() {
  clearTimeout(pasteTimer);
  // Let the native paste finish; do not read or request clipboard permissions.
  pasteTimer=setTimeout(autoPasteImport,100);
}
function autoPasteImport() {
  clearTimeout(pasteTimer);
  const result=document.getElementById('paste-result');
  try {
    const input=document.getElementById('paste-input').value;
    if (input.length > 5 * 1024 * 1024) throw new Error('Bitte weniger als 5 MB Text auf einmal einfügen.');
    const parsed=C.parseImport(input,document.getElementById('paste-delimiter').value || 'auto');
    if (parsed.errors.length) throw new Error('Noch nichts hinzugefügt. Bitte korrigieren:\n'+parsed.errors.map(e=>'Zeile '+e.line+': '+e.message).join('\n'));
    const plan=C.planImport(state,parsed.entries,uuid,Date.now());
    if (!plan.added.length) { result.textContent=plan.duplicates+' Dubletten übersprungen. Keine neuen Karten.'; return; }
    if (!commit(C.merge(state,{schemaVersion:2,cards:plan.added}),{backup:true})) {
      result.textContent='Nicht gespeichert. Bitte Gerätespeicher prüfen; Dein Text bleibt erhalten.'; return;
    }
    lastPasteIds=plan.added.map(c=>c.id);
    document.getElementById('undo-paste').classList.remove('hidden');
    result.textContent=plan.added.length+' neue Karten gespeichert · '+plan.duplicates+' Dubletten übersprungen.\n'+plan.added.slice(0,3).map(c=>c.front+' → '+c.back).join('\n');
    renderCardList();
  } catch(err) { result.textContent=err.message; }
}
function undoPasteImport() {
  const next=C.merge(state), ids=new Set(lastPasteIds);
  // Remove only cards created by the last successful paste, never older cards.
  for (const c of next.cards) if (ids.has(c.id)) c.deletedAt=Date.now();
  if (commit(next)) {
    lastPasteIds=[]; document.getElementById('undo-paste').classList.add('hidden');
    document.getElementById('paste-result').textContent='Letztes Einfügen rückgängig gemacht. Vorhandene Karten bleiben erhalten.';
    renderCardList();
  }
}
window.addEventListener('online',()=>queueSync(0));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible') queueSync(0);});
window.addEventListener('storage',event=>{
  if (event.key === STATE_KEY && !storageBlocked) {
    try { state=C.merge(state,C.validate(JSON.parse(event.newValue))); refreshCards();
      if (!document.getElementById('view-manage').classList.contains('hidden')) renderCardList(); queueSync(); }
    catch { setSyncStatus('error','Änderungen aus anderem Fenster nicht lesbar.'); }
  }
});

function exportLegacy(){
  const raw=localStorage.getItem(STORAGE_KEY);
  if(!raw)return alert('Es gibt auf diesem Gerät keine Sicherung aus der alten Version.');
  backupDownload(raw,'vokabeln-vor-umstieg.json');
}
