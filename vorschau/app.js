const STORAGE_KEY = 'wesentlich_preview_vocab_cards_v1';
    const GITHUB_TOKEN_KEY = 'wesentlich_preview_gh_token';
    const GITHUB_GIST_KEY = 'wesentlich_preview_gh_gist';
    let cards = [];
    let currentCard = null;
    let isRevealed = false;
    let recognition = null;
    let isListening = false;


    function getDueCards() { const now = Date.now(); return cards.filter(c => c.due <= now).sort((a, b) => a.due - b.due); }

    function calculateSM2(card, rating) {
      const result = C.schedule(card, rating, Date.now());
      return { ...result, label: rating === 0 ? '10 Min' : result.interval + (result.interval === 1 ? ' Tag' : ' Tage') };
    }

    function normalizeText(str) { return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim(); }
    function checkUserAnswer(userRaw, targetRaw) {
      const userNorm = normalizeText(userRaw); if (!userNorm) return null;
      const variants = targetRaw.split(/\s*\/\s*/).map(v => normalizeText(v)).filter(Boolean);
      const isMatch = variants.some(v => v === userNorm || v.replace(/^to\s+/, '') === userNorm.replace(/^to\s+/, ''));
      return { isMatch, userRaw: userRaw.trim() };
    }

    function revealAnswer() {
      if (!currentCard || isRevealed) return;
      stopSpeechRecognition(); isRevealed = true;
      const inputField = document.getElementById('user-answer'), feedbackEl = document.getElementById('check-feedback');
      const checkResult = checkUserAnswer(inputField.value, currentCard.back);
      inputField.disabled = true; inputField.blur();
      if (checkResult) {
        feedbackEl.classList.remove('hidden', 'feedback-exact', 'feedback-diff');
        if (checkResult.isMatch) { feedbackEl.classList.add('feedback-exact'); feedbackEl.textContent = '✓ Treffer: "' + checkResult.userRaw + '"'; } 
        else { feedbackEl.classList.add('feedback-diff'); feedbackEl.textContent = 'Deine Eingabe: "' + checkResult.userRaw + '" – vergleiche unten.'; }
      } else { feedbackEl.classList.add('hidden'); }
      document.getElementById('answer-section').classList.remove('hidden');
      document.getElementById('show-answer-btn').classList.add('hidden');
      document.getElementById('rating-buttons').classList.remove('hidden');
      saveRoundDraft();
    }

    function speakCurrent(rate = 0.95) {
      if (!currentCard || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const cleanText = currentCard.back.replace(/\s*\/\s*/g, ', or ');
      const utter = new SpeechSynthesisUtterance(cleanText); utter.lang = 'en-US'; utter.rate = rate;
      window.speechSynthesis.speak(utter);
    }

    function initSpeechRecognition() {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRec) { document.getElementById('mic-btn').style.display = 'none'; return; }
      recognition = new SpeechRec(); recognition.lang = 'en-US'; recognition.interimResults = true; recognition.continuous = false;
      recognition.onstart = () => { isListening = true; document.getElementById('mic-btn').classList.add('listening'); };
      recognition.onresult = (e) => { let t = ''; for(let i=0; i<e.results.length; i++) t += e.results[i][0].transcript; document.getElementById('user-answer').value = t; saveRoundDraft(); };
      recognition.onerror = () => stopSpeechRecognition(); recognition.onend = () => stopSpeechRecognition();
    }
    function toggleSpeechRecognition() { if (!recognition) return; if (isListening) { recognition.stop(); } else { if (isRevealed) return; document.getElementById('user-answer').value = ''; recognition.start(); } }
    function stopSpeechRecognition() { if (recognition && isListening) { try { recognition.stop(); } catch(e){} } isListening = false; const btn = document.getElementById('mic-btn'); if (btn) btn.classList.remove('listening'); }

    function updateStats() { document.getElementById('due-count').textContent = getDueCards().length; document.getElementById('total-count').textContent = cards.length; document.getElementById('manage-count').textContent = cards.length; }

    function switchView(view) {
      if(view !== 'study' && round && !round.paused) pauseRound();
      stopSpeechRecognition();
      document.getElementById('view-study').classList.toggle('hidden', view !== 'study');
      document.getElementById('view-manage').classList.toggle('hidden', view !== 'manage');
      document.getElementById('view-sync').classList.toggle('hidden', view !== 'sync');
      document.getElementById('tab-study').classList.toggle('active', view === 'study');
      document.getElementById('tab-manage').classList.toggle('active', view === 'manage');
      document.getElementById('tab-sync').classList.toggle('active', view === 'sync');
      if (view === 'study') renderStudy(); else if (view === 'manage') renderCardList();
    }

    function addCard() {
      const front = document.getElementById('input-front').value.trim(), back = document.getElementById('input-back').value.trim(), notes = document.getElementById('input-notes').value.trim();
      if (!front || !back) return alert('Bitte Vorder- und Rückseite ausfüllen.');
      const plan=C.planImport(state,[{front,back,notes}],uuid,Date.now());
      if (!plan.added.length) return alert('Diese Karte ist bereits vorhanden.');
      if (!commit(C.merge(state,{schemaVersion:2,cards:plan.added}))) return;
      for (const id of ['input-front','input-back','input-notes']) document.getElementById(id).value='';
      renderCardList();
    }
    function deleteCard(id) {
      if (!confirm('Karte löschen?')) return;
      const next=C.merge(state), record=next.cards.find(c=>c.id===id);
      if (!record) return;
      record.deletedAt=Date.now();
      if (commit(next)) renderCardList();
    }
    function renderCardList() {
      const list = document.getElementById('card-list'); list.replaceChildren();
      updateTopics();
      const query=$('card-search').value.toLocaleLowerCase('de'), topic=$('manage-module').value;
      cards.filter(c=>(!topic || moduleOf(c)===topic) && [c.front,c.back,c.notes].join(' ').toLocaleLowerCase('de').includes(query)).forEach(c => {
        const row = document.createElement('div'); row.className = 'card-list-item';
        const textDiv = document.createElement('div'); textDiv.className = 'card-list-text';
        const strong = document.createElement('strong'); strong.textContent = c.front;
        const span = document.createElement('span'); span.textContent = c.back;
        textDiv.appendChild(strong); textDiv.appendChild(span);
        const delBtn = document.createElement('button'); delBtn.className = 'delete-btn'; delBtn.textContent = 'Löschen'; delBtn.onclick = () => deleteCard(c.id);
        const editBtn=document.createElement('button');editBtn.className='btn-secondary';editBtn.textContent='Bearbeiten';editBtn.onclick=()=>editCard(c.id);
        row.appendChild(textDiv); row.appendChild(editBtn); row.appendChild(delBtn); list.appendChild(row);
      });
    }

    window.addEventListener('keydown', (e) => {
      if (!document.getElementById('view-study').classList.contains('hidden') && round && !round.paused && currentCard && !e.repeat) {
        if (document.activeElement.tagName === 'BUTTON' || document.activeElement.tagName === 'SELECT') return;
        if (document.activeElement.id === 'user-answer') {
          if (e.key === 'Enter' && !isRevealed) { e.preventDefault(); revealAnswer(); } return;
        }
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        if ((e.code === 'Space' || e.key === 'Enter') && !isRevealed) { e.preventDefault(); revealAnswer(); }
        else if (isRevealed) {
          if (e.key === '1') rateCard(0); if (e.key === '2') rateCard(1); if (e.key === '3') rateCard(2); if (e.key === '4') rateCard(3); if (e.key.toLowerCase() === 'r') speakCurrent();
        }
      }
    });
