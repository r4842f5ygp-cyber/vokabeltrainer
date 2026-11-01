/* Shared, dependency-free data and import logic. Browser + Node test runner. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VocabCore = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const DAY = 86400000;
  const empty = () => ({ schemaVersion: 2, cards: [] });
  const text = (v) => typeof v === 'string' ? v.trim() : '';
  const key = (c) => [c.front, c.back].map(s => s.normalize('NFKC').toLocaleLowerCase('de').replace(/\s+/g, ' ').trim()).join('\u0000');
  const number = (v, fallback, min = 0) => typeof v === 'number' && Number.isFinite(v) && v >= min ? v : fallback;
  const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
  function schedule(card, rating, at) {
    let reps = card.reps, interval = card.interval, ease = card.ease;
    if (rating === 0) return { reps: 0, interval: 0, ease: Math.max(1.3, ease - .2), due: at + 600000 };
    if (rating === 1) { interval = reps === 0 ? 1 : Math.max(1, Math.round(interval * 1.2)); ease = Math.max(1.3, ease - .15); }
    if (rating === 2) interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ease);
    if (rating === 3) { interval = reps === 0 ? 4 : reps === 1 ? 7 : Math.round(interval * ease * 1.3); ease += .15; }
    return { reps: reps + 1, interval, ease, due: at + interval * DAY };
  }
  function validate(raw) {
    const legacy = Array.isArray(raw);
    if (!legacy && (!raw || raw.schemaVersion !== 2 || !Array.isArray(raw.cards))) throw new Error('Unbekanntes Datenformat. Erwartet wird ein Vokabel-Backup.');
    const input = legacy ? raw : raw.cards;
    const ids = new Set();
    const cards = input.map((c, i) => {
      if (!c || !text(c.front) || !text(c.back) || (typeof c.id !== 'string' && typeof c.id !== 'number')) throw new Error('Karte ' + (i + 1) + ': ID, Vorder- oder Rückseite fehlt.');
      const id = String(c.id);
      if (!id || ids.has(id)) throw new Error('Doppelte oder leere Karten-ID in Karte ' + (i + 1) + '.');
      ids.add(id);
      const b = legacy ? c : c.base;
      if (!b || (!legacy && (!Number.isFinite(b.due) || b.due < 0))) throw new Error('Ungültiger Lernstand in Karte ' + (i + 1) + '.');
      const base = { reps: number(b.reps, 0), interval: number(b.interval, 0), ease: number(b.ease, 2.5, 1.3), due: number(b.due, 0) };
      const reviews = legacy ? [] : c.reviews;
      if (!Array.isArray(reviews)) throw new Error('Ungültiger Lernverlauf.');
      const seen = new Set();
      const cleanReviews = reviews.map(r => {
        if (!r || !text(r.id) || !Number.isFinite(r.at) || r.at < 0 || !Number.isInteger(r.rating) || r.rating < 0 || r.rating > 3 || seen.has(r.id)) throw new Error('Ungültiger oder doppelter Lerneintrag.');
        seen.add(r.id); return { id: r.id, at: r.at, rating: r.rating };
      }).sort((a,b) => a.at - b.at || compare(a.id,b.id));
      return { id, front: text(c.front), back: text(c.back), notes: text(c.notes), module: text(c.module),
        createdAt: number(c.createdAt, 0), updatedAt: number(c.updatedAt, 0), deletedAt: number(c.deletedAt, 0),
        baseAt: number(c.baseAt, 0), base, reviews: cleanReviews };
    });
    return { schemaVersion: 2, cards: cards.sort((a,b) => compare(a.id,b.id)) };
  }
  // Separate merges for content, initial schedule, review events and deletion tombstones.
  // A deletion wins permanently for its ID; re-adding a card creates a new ID.
  function merge(...states) {
    const byId = new Map();
    for (const state of states) for (const c of state.cards) {
      const old = byId.get(c.id);
      if (!old) { byId.set(c.id, structuredClone(c)); continue; }
      const contentOrder = old.updatedAt - c.updatedAt || compare(JSON.stringify([old.front,old.back,old.notes,old.module]), JSON.stringify([c.front,c.back,c.notes,c.module]));
      const winner = contentOrder >= 0 ? old : c;
      const baseWinner = old.baseAt !== c.baseAt ? (old.baseAt > c.baseAt ? old : c) :
        (old.base.due !== c.base.due ? (old.base.due > c.base.due ? old : c) : (JSON.stringify(old.base) > JSON.stringify(c.base) ? old : c));
      const events = new Map();
      for (const r of [...old.reviews, ...c.reviews]) {
        const prev = events.get(r.id);
        if (!prev || JSON.stringify(r) > JSON.stringify(prev)) events.set(r.id, r);
      }
      byId.set(c.id, { ...winner, createdAt: Math.min(old.createdAt,c.createdAt), deletedAt: Math.max(old.deletedAt,c.deletedAt),
        base: { ...baseWinner.base }, baseAt: baseWinner.baseAt,
        reviews: [...events.values()].sort((a,b) => a.at - b.at || compare(a.id,b.id)) });
    }
    return { schemaVersion: 2, cards: [...byId.values()].sort((a,b) => compare(a.id,b.id)) };
  }
  function project(c) {
    let progress = c.base;
    for (const r of c.reviews) progress = schedule(progress, r.rating, r.at);
    return { ...c, ...progress };
  }
  function parseRows(input, delimiter, lenient = false) {
    const rows = []; let cells = [], field = '', quoted = false, closed = false, line = 1, rowLine = 1;
    const endField = () => { cells.push(field.trim()); field = ''; closed = false; };
    const endRow = () => { endField(); if (cells.some(Boolean)) rows.push({ cells, line: rowLine }); cells = []; rowLine = line + 1; };
    const s = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (quoted) {
        if (ch === '"' && s[i+1] === '"') { field += '"'; i++; }
        else if (ch === '"') { quoted = false; closed = true; }
        else { field += ch; if (ch === '\n') line++; }
      } else if (ch === delimiter) endField();
      else if (ch === '\n') { endRow(); line++; }
      else if (ch === '"' && !field.trim() && !closed) { field = ''; quoted = true; }
      else if (closed && !/\s/.test(ch)) {
        if (!lenient) throw new Error('Zeile ' + line + ': unerwarteter Text nach einem Anführungszeichen.');
        field += ch;
      }
      else if (!closed) field += ch;
    }
    if (quoted && !lenient) throw new Error('Zeile ' + rowLine + ': schließendes Anführungszeichen fehlt.');
    if (field || cells.length) endRow();
    return rows;
  }
  const alias = {
    front: ['front','de','deutsch','german','vorderseite','begriff','deutsch / impuls'],
    back: ['back','en','englisch','english','rückseite','rueckseite','übersetzung','translation'],
    notes: ['notes','note','notiz','notizen','beispielsatz','beispielsatz & nuance'],
    module: ['module','modul','thema','kategorie']
  };
  function headerMap(cells) {
    const map = {};
    for (const [name, names] of Object.entries(alias)) map[name] = cells.findIndex(c => names.includes(c.toLocaleLowerCase('de').trim()));
    return map.front >= 0 && map.back >= 0 ? map : null;
  }
  function parseImport(input, delimiter = 'auto') {
    if (!input.trim()) throw new Error('Bitte zuerst Vokabeln auswählen oder einfügen.');
    let rows;
    if (delimiter === 'auto') {
      const candidates = [';', '\t', ','].map(d => {
        try {
          const rs = parseRows(input,d,true), sample = rs.slice(0,100), counts = new Map();
          for (const r of sample) if (r.cells.length >= 2) counts.set(r.cells.length,(counts.get(r.cells.length)||0)+1);
          const consistent = Math.max(0,...counts.values());
          return { d, rs, score: consistent / Math.max(1,sample.length) + (headerMap(sample[0]?.cells || []) ? 2 : 0) };
        } catch { return { d, score: -1 }; }
      }).sort((a,b) => b.score - a.score);
      if (candidates[0].score <= 0) throw new Error('Keine zwei Spalten erkannt. Bitte Trennzeichen prüfen.');
      // Tabs from a copied table are unambiguous even if its text has commas.
      const tab = candidates.find(c=>c.d==='\t' && c.score >= 1);
      const best = tab || candidates[0];
      const rival = candidates.find(c=>c.d!==best.d && c.score===best.score);
      if (!tab && rival && best.score < 2) throw new Error('Trennzeichen nicht eindeutig. Bitte Semikolon oder Komma ausdrücklich auswählen.');
      delimiter = best.d; rows = parseRows(input,delimiter);
    } else rows = parseRows(input,delimiter);
    if (rows.length > 10000) throw new Error('Bitte höchstens 10.000 Zeilen auf einmal importieren.');
    const mapping = headerMap(rows[0]?.cells || []), entries = [], errors = [];
    for (const r of rows.slice(mapping ? 1 : 0)) {
      const at = (name, fallback) => r.cells[mapping ? mapping[name] : fallback] || '';
      const c = { front: at('front',0), back: at('back',1), notes: mapping ? at('notes',2) : r.cells.slice(2).join(delimiter), module: mapping ? at('module',-1) : '' };
      if (!c.front || !c.back) { errors.push({line:r.line,message:'Vorder- oder Rückseite fehlt.'}); continue; }
      entries.push(c);
    }
    return { entries, errors, delimiter, hasHeader: !!mapping };
  }
  function planImport(state, entries, id, now) {
    const known = new Set(state.cards.filter(c=>!c.deletedAt).map(key));
    const added = []; let duplicates = 0;
    for (const e of entries) {
      const k = key(e);
      if (known.has(k)) { duplicates++; continue; }
      known.add(k);
      added.push({ id:id(), front:e.front, back:e.back, notes:e.notes || '', module:e.module || '', createdAt:now, updatedAt:now, deletedAt:0,
        baseAt:now, base:{reps:0,interval:0,ease:2.5,due:now}, reviews:[] });
    }
    return { added, duplicates };
  }
  return { empty, validate, merge, project, schedule, parseRows, parseImport, planImport, key };
});
