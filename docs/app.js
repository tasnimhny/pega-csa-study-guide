(() => {
  'use strict';

  const DATA = window.CSA_DATA || { domains: [] };
  const DOMAINS = DATA.domains;
  const app = document.getElementById('app');
  const EXAM = { questions: 60, minutes: 90, pass: 65 };
  const MISSION = { questions: 40, minutes: 60, pass: 80 };
  const LETTERS = 'ABCDEFGH';

  // ---------- storage (per-viewer convenience only) ----------
  const STORE_KEY = 'csa25-guide';
  const store = (() => {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch (e) { s = {}; }
    s.scores = s.scores || {};
    s.missed = s.missed || [];
    return {
      get: () => s,
      save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ } },
    };
  })();

  // ---------- helpers ----------
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (t) => esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Mission Test layout: scenario first, then the question on its own line.
  const stemHTML = (stem) => {
    const m = /^([\s\S]*?[.!])\s+((?:Which|What|Where|When|Who|How|Why|In which|Changes to)[^]*\?[^]*)$/.exec(stem);
    return m
      ? `<p class="stem scenario">${fmt(m[1])}</p><p class="stem">${fmt(m[2])}</p>`
      : `<p class="stem">${fmt(stem)}</p>`;
  };
  const allQuestions = () => DOMAINS.flatMap((d) => d.questions.map((q) => ({ ...q, domain: d.id, domainTitle: d.title, objectiveText: d.objectives[q.objective]?.objective })));
  const byId = Object.fromEntries(allQuestions().map((q) => [q.id, q]));

  function rng(seed) {
    let a = seed >>> 0;
    return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function shuffle(arr, rand = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  // Allocate n questions across domains by exam weight (largest remainder).
  function weightedPick(n, rand) {
    const total = DOMAINS.reduce((s, d) => s + d.weight, 0);
    const raw = DOMAINS.map((d) => ({ d, exact: (d.weight / total) * n }));
    raw.forEach((r) => { r.k = Math.min(Math.floor(r.exact), r.d.questions.length); });
    let left = n - raw.reduce((s, r) => s + r.k, 0);
    raw.slice().sort((a, b) => (b.exact - Math.floor(b.exact)) - (a.exact - Math.floor(a.exact)))
      .forEach((r) => { if (left > 0 && r.k < r.d.questions.length) { r.k++; left--; } });
    const picked = raw.flatMap((r) => shuffle(r.d.questions, rand).slice(0, r.k).map((q) => q.id));
    return shuffle(picked, rand);
  }

  // ---------- problem sets ----------
  function practiceSets() {
    const sets = DOMAINS.map((d) => ({
      id: `domain-${d.id}`, title: d.title, kind: 'Domain set', weight: d.weight,
      desc: `All ${d.questions.length} questions for this ${d.weight}% domain, with an explanation after each answer.`,
      ids: () => d.questions.map((q) => q.id),
    }));
    ['A', 'B', 'C'].forEach((L, i) => sets.push({
      id: `mixed-${L}`, title: `Mixed Set ${L}`, kind: 'Mixed', desc: '25 questions drawn across every domain, weighted like the real exam.',
      ids: () => weightedPick(25, rng(1000 + i * 77)),
    }));
    sets.push({
      id: 'hard', title: 'Hard Questions Only', kind: 'Challenge', desc: 'Every question tagged hard, shuffled. Good for the final week of review.',
      ids: () => shuffle(allQuestions().filter((q) => q.difficulty === 'hard').map((q) => q.id)),
    });
    sets.push({
      id: 'multi', title: 'Select-All-That-Apply Drill', kind: 'Challenge', desc: 'Only multi-select questions. You need every correct option to get credit.',
      ids: () => shuffle(allQuestions().filter((q) => q.type === 'multi').map((q) => q.id)),
    });
    sets.push({
      id: 'missed', title: 'Your Missed Questions', kind: 'Review', desc: 'Questions you got wrong in practice or mock exams. A correct answer removes the question from this list.',
      ids: () => shuffle(store.get().missed.filter((id) => byId[id])),
    });
    return sets;
  }
  const examDefs = [1, 2, 3].map((n) => ({ id: `exam-${n}`, title: `Mock Exam ${n}`, seed: 4242 + n * 131 }));

  // ---------- nav ----------
  function setTab(name) {
    document.querySelectorAll('.tabs a').forEach((a) => a.classList.toggle('active', a.dataset.tab === name));
  }

  // ---------- views ----------
  function viewHome() {
    setTab('home');
    const totalQ = allQuestions().length;
    const totalObj = DOMAINS.reduce((s, d) => s + d.objectives.length, 0);
    app.innerHTML = `
      <section class="hero">
        <span class="pill">Exam code PEGACPSA25V1 · Pega Platform '25</span>
        <h1 style="margin-top:12px">Certified Pega System Architect '25 study guide</h1>
        <p>Organized by the official exam topic list. Each domain has a dense study sheet written from the text and video-transcript topics of the Pega Academy <em>System Architect</em> mission. The sandbox Challenges are left out. Practice problems and timed mock exams follow the study sheet.</p>
        <div class="btn-row"><a class="btn primary" href="#/study">Start the study sheet →</a><a class="btn" href="#/practice">Practice problems</a><a class="btn" href="#/exam">Take a mock exam</a></div>
      </section>
      <div class="stats">
        <div class="stat"><b>${EXAM.questions}</b><span>exam questions</span></div>
        <div class="stat"><b>${EXAM.minutes} min</b><span>time limit</span></div>
        <div class="stat"><b>${EXAM.pass}%</b><span>passing score</span></div>
        <div class="stat"><b>${totalObj}</b><span>exam objectives covered</span></div>
        <div class="stat"><b>${totalQ}</b><span>practice questions</span></div>
      </div>
      <div class="section-title"><h2>Exam topics by weight</h2><span class="muted">Click a domain to open its study sheet</span></div>
      <div class="card weights">
        ${DOMAINS.map((d) => `<a class="weight-row" href="#/study/${d.id}"><span>${esc(d.title)}</span><span class="bar"><i style="width:${d.weight * 4}%"></i></span><span class="pct">${d.weight}%</span></a>`).join('')}
      </div>
      <div class="section-title"><h2>How to use this guide</h2></div>
      <div class="grid grid-3">
        <div class="card"><h3>1 · Read the study sheet</h3><p class="muted">Work through the domains in weight order. Case Management and Data &amp; Integration together make up almost half the exam. Read the "Exam traps" boxes closely, because that's where the distractors come from.</p></div>
        <div class="card"><h3>2 · Drill by domain</h3><p class="muted">Each domain set explains every answer right away. Missed questions go to your review list automatically.</p></div>
        <div class="card"><h3>3 · Simulate the exam</h3><p class="muted">Mock exams use 60 questions weighted like the real blueprint, with a 90-minute timer and the 65% pass line. Aim for 80%+ before booking.</p></div>
      </div>`;
  }

  function viewStudy(domainId) {
    setTab('study');
    const d = DOMAINS.find((x) => x.id === domainId) || DOMAINS[0];
    const idx = DOMAINS.indexOf(d);
    const next = DOMAINS[idx + 1];
    const prev = DOMAINS[idx - 1];
    app.innerHTML = `
      <div class="study">
        <nav class="toc" aria-label="Domains">
          ${DOMAINS.map((x) => `<a href="#/study/${x.id}" class="${x === d ? 'active' : ''}">${esc(x.title)}<span class="pct">${x.weight}%</span></a>`).join('')}
        </nav>
        <article>
          <div class="domain-head"><h1 style="margin:0">${esc(d.title)}</h1><span class="pill">${d.weight}% of exam</span></div>
          ${d.intro ? `<p class="muted">${fmt(d.intro)}</p>` : ''}
          <div class="callout" style="margin:14px 0 6px">${d.objectives.length} objectives · ${d.questions.length} practice questions · <a href="#/practice/domain-${d.id}">Practice this domain →</a></div>
          ${d.objectives.map((o, i) => objectiveHTML(o, i)).join('')}
          <div class="domain-foot">
            ${prev ? `<a class="btn" href="#/study/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}
            <a class="btn primary" href="#/practice/domain-${d.id}">Practice ${esc(d.title)} (${d.questions.length} Qs)</a>
            ${next ? `<a class="btn" href="#/study/${next.id}">${esc(next.title)} →</a>` : `<a class="btn" href="#/practice">All practice problems →</a>`}
          </div>
        </article>
      </div>`;
    window.scrollTo(0, 0);
  }

  function objectiveHTML(o, i) {
    const table = o.table && o.table.headers ? `
      <div class="table-wrap"><table><thead><tr>${o.table.headers.map((h) => `<th>${fmt(h)}</th>`).join('')}</tr></thead>
      <tbody>${o.table.rows.map((r) => `<tr>${r.map((c) => `<td>${fmt(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
    return `
      <section class="card objective" id="obj-${i}">
        <h3><span class="num">${i + 1}.</span><span>${fmt(o.objective)}</span></h3>
        ${o.modules && o.modules.length ? `<div class="modules">Mission modules: ${o.modules.map(esc).join(' · ')}</div>` : ''}
        ${(o.summary || []).map((p) => `<p>${fmt(p)}</p>`).join('')}
        ${o.keyFacts && o.keyFacts.length ? `<div class="block-label">Key facts</div><ul class="facts">${o.keyFacts.map((f) => `<li>${fmt(f)}</li>`).join('')}</ul>` : ''}
        ${table}
        ${o.examTraps && o.examTraps.length ? `<div class="block-label traps-label">Exam traps</div><ul class="traps">${o.examTraps.map((f) => `<li>${fmt(f)}</li>`).join('')}</ul>` : ''}
      </section>`;
  }

  function viewPractice() {
    setTab('practice');
    const scores = store.get().scores;
    const sets = practiceSets();
    const card = (s) => {
      const n = s.ids().length;
      const best = scores[s.id];
      return `<div class="card set-card">
        <span class="pill ${s.kind === 'Challenge' ? 'hard' : ''}" style="align-self:flex-start">${s.kind}${s.weight ? ` · ${s.weight}%` : ''}</span>
        <h3>${esc(s.title)}</h3>
        <div class="meta">${esc(s.desc)}</div>
        <div class="meta">${n} question${n === 1 ? '' : 's'}${best ? ` · <span class="score-badge">Best ${best.best}%</span>` : ''}</div>
        <div class="btn-row"><a class="btn ${n ? 'primary' : ''}" href="#/practice/${s.id}" ${n ? '' : 'aria-disabled="true" onclick="return false"'}>Start</a></div>
      </div>`;
    };
    app.innerHTML = `
      <section class="hero"><h1>Practice problems</h1><p>Scenario-based questions written to match or exceed the difficulty of the real exam. Each one explains why the right answer is right and why each distractor is wrong.</p></section>
      <div class="section-title"><h2>By exam domain</h2></div>
      <div class="grid grid-3">${sets.filter((s) => s.kind === 'Domain set').map(card).join('')}</div>
      <div class="section-title"><h2>Mixed &amp; challenge sets</h2></div>
      <div class="grid grid-3">${sets.filter((s) => s.kind !== 'Domain set').map(card).join('')}</div>
      <div class="section-title"><h2>Ready for the real thing?</h2></div>
      <div class="card btn-row" style="justify-content:space-between"><span>Take a timed 60-question mock exam, weighted by the blueprint.</span><a class="btn primary" href="#/exam">Mock exams →</a></div>`;
  }

  function viewExamList() {
    setTab('exam');
    const scores = store.get().scores;
    app.innerHTML = `
      <section class="hero"><h1>Mock exams</h1><p>${EXAM.questions} questions · ${EXAM.minutes} minutes · ${EXAM.pass}% to pass. Questions are spread across domains in the same proportions as the PEGACPSA25V1 blueprint. Answers stay hidden until you submit, then you get a domain-by-domain breakdown and a full review.</p></section>
      <div class="grid grid-3">
        ${examDefs.map((e) => `<div class="card set-card"><span class="pill" style="align-self:flex-start">Fixed form</span><h3>${e.title}</h3><div class="meta">Same questions every attempt, so you can measure progress.${scores[e.id] ? ` <span class="score-badge">Best ${scores[e.id].best}%</span>` : ''}</div><div class="btn-row"><a class="btn primary" href="#/exam/${e.id}">Start</a></div></div>`).join('')}
        <div class="card set-card"><span class="pill" style="align-self:flex-start">Mission Test format</span><h3>Mission Test Simulation</h3><div class="meta">${MISSION.questions} questions · ${MISSION.minutes} minutes · ${MISSION.pass}% to pass, the same format as the Pega Academy Mission Test. Weighted random draw.${scores['mission-sim'] ? ` <span class="score-badge">Best ${scores['mission-sim'].best}%</span>` : ''}</div><div class="btn-row"><a class="btn primary" href="#/exam/mission-sim">Start</a></div></div>
        <div class="card set-card"><span class="pill hard" style="align-self:flex-start">Random</span><h3>Random Mock Exam</h3><div class="meta">A newly shuffled weighted draw every time.${scores['exam-random'] ? ` <span class="score-badge">Best ${scores['exam-random'].best}%</span>` : ''}</div><div class="btn-row"><a class="btn primary" href="#/exam/exam-random">Start</a></div></div>
      </div>
      <div class="section-title"><h2>Exam-day reminders</h2></div>
      <div class="card"><ul style="margin:0;padding-left:20px">
        <li>About 90 seconds per question. Flag hard ones and come back.</li>
        <li>Multi-select questions say how many to choose. Partial answers score zero.</li>
        <li>Look for "best practice" and "only in Dev Studio" qualifiers. They often decide between two plausible answers.</li>
        <li>The exam is proctored by Pearson VUE, online or at a test center.</li>
      </ul></div>`;
  }

  // ---------- quiz engine ----------
  let session = null;
  let timerHandle = null;

  function startQuiz({ id, title, ids, mode, cfg = EXAM }) {
    clearInterval(timerHandle);
    session = {
      id, title, mode, ids, cfg,
      i: 0,
      answers: {},     // qid -> [indices]
      checked: {},     // practice: qid -> true
      flagged: {},
      perm: Object.fromEntries(ids.map((qid) => [qid, shuffle(byId[qid].options.map((_, k) => k))])),
      done: false,
      endsAt: mode === 'exam' ? Date.now() + cfg.minutes * 60 * 1000 : null,
    };
    if (mode === 'exam') timerHandle = setInterval(tick, 1000);
    renderQuiz();
  }

  function tick() {
    if (!session || session.done) { clearInterval(timerHandle); return; }
    const el = document.getElementById('timer');
    const left = Math.max(0, session.endsAt - Date.now());
    if (el) { el.textContent = clock(left); el.classList.toggle('low', left < 5 * 60 * 1000); }
    if (left <= 0) finishQuiz();
  }
  const clock = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const isCorrect = (q, sel) => sel && sel.length === q.answer.length && q.answer.every((a) => sel.includes(a));

  function renderQuiz() {
    const s = session;
    if (!s.ids.length) {
      app.innerHTML = `<div class="card empty"><h2>No questions here yet</h2><p>${s.id === 'missed' ? 'You have no missed questions. Nice work.' : 'This set is empty.'}</p><a class="btn" href="#/practice">Back to practice</a></div>`;
      return;
    }
    const q = byId[s.ids[s.i]];
    const sel = s.answers[q.id] || [];
    const revealed = s.mode === 'practice' ? !!s.checked[q.id] : s.done;
    const answeredCount = Object.keys(s.answers).filter((k) => (s.answers[k] || []).length).length;
    const need = q.answer.length;

    const perm = s.perm[q.id];
    const letterOf = (k) => LETTERS[perm.indexOf(k)];
    const optHTML = perm.map((k, pos) => {
      const opt = q.options[k];
      const chosen = sel.includes(k);
      let cls = 'option';
      if (revealed) {
        cls += ' locked';
        if (q.answer.includes(k)) cls += ' correct';
        else if (chosen) cls += ' wrong';
      } else if (chosen) cls += ' selected';
      const type = q.type === 'multi' ? 'checkbox' : 'radio';
      return `<li><label class="${cls}"><input type="${type}" name="opt" value="${k}" ${chosen ? 'checked' : ''} ${revealed ? 'disabled' : ''}><span class="letter">${LETTERS[pos]}</span><span>${fmt(opt)}</span></label></li>`;
    }).join('');

    const correct = isCorrect(q, sel);
    const explain = revealed ? `<div class="explain ${correct ? '' : 'wrong'}"><h4>${correct ? '✓ Correct' : `✗ Incorrect · Answer: ${q.answer.map(letterOf).sort().join(', ')}`}</h4><div>${fmt(q.explanation)}</div></div>` : '';

    const palette = s.ids.map((qid, k) => {
      const qq = byId[qid];
      let cls = '';
      if (s.mode === 'practice' && s.checked[qid]) cls = isCorrect(qq, s.answers[qid]) ? 'ok' : 'no';
      else if ((s.answers[qid] || []).length) cls = 'answered';
      if (s.flagged[qid]) cls += ' flagged';
      if (k === s.i) cls += ' current';
      return `<button type="button" class="${cls}" data-jump="${k}" aria-label="Question ${k + 1}">${k + 1}</button>`;
    }).join('');

    const isLast = s.i === s.ids.length - 1;
    let primary = '';
    if (s.mode === 'practice') {
      primary = !revealed
        ? `<button class="btn primary" id="check" ${sel.length ? '' : 'disabled'}>Check answer</button>`
        : (isLast ? `<button class="btn primary" id="finish">See results</button>` : `<button class="btn primary" id="next">Next →</button>`);
    } else {
      primary = isLast ? `<button class="btn primary" id="finish">Submit exam</button>` : `<button class="btn primary" id="next">Next →</button>`;
    }

    app.innerHTML = `
      <div class="quiz-head">
        <div><a href="#/${s.mode === 'exam' ? 'exam' : 'practice'}" class="muted">← ${s.mode === 'exam' ? 'Mock exams' : 'Practice'}</a><h2 style="margin:4px 0 0">${esc(s.title)}</h2></div>
        <div class="btn-row">
          <span class="muted">Question ${s.i + 1} of ${s.ids.length} · ${answeredCount} answered</span>
          ${s.mode === 'exam' ? `<span class="timer" id="timer">${clock(s.endsAt - Date.now())}</span>` : ''}
        </div>
      </div>
      <div class="progress"><i style="width:${((s.i + 1) / s.ids.length) * 100}%"></i></div>
      <div class="question card">
        <div class="q-meta">
          <span class="pill">${esc(q.domainTitle)}</span>
          ${q.type === 'multi' ? `<span class="pill multi">Choose ${need}</span>` : ''}
          ${q.difficulty === 'hard' ? '<span class="pill hard">Hard</span>' : ''}
          ${revealed ? `<span>Objective: ${esc(q.objectiveText || '')}</span>` : ''}
        </div>
        ${stemHTML(q.stem)}
        <ul class="options">${optHTML}</ul>
        ${explain}
        <div class="quiz-nav">
          <div class="btn-row">
            <button class="btn" id="prev" ${s.i === 0 ? 'disabled' : ''}>← Back</button>
            ${s.mode === 'exam' ? `<button class="btn" id="flag">${s.flagged[q.id] ? '★ Flagged' : '☆ Flag'}</button>` : ''}
          </div>
          <div class="btn-row">
            ${s.mode === 'exam' && !isLast ? '<button class="btn" id="finish">Submit exam</button>' : ''}
            ${primary}
          </div>
        </div>
      </div>
      <div class="palette" aria-label="Question navigator">${palette}</div>`;

    app.querySelectorAll('input[name="opt"]').forEach((inp) => inp.addEventListener('change', () => {
      const k = Number(inp.value);
      let cur = (s.answers[q.id] || []).slice();
      if (q.type === 'multi') cur = inp.checked ? [...cur, k] : cur.filter((x) => x !== k);
      else cur = [k];
      s.answers[q.id] = cur.sort((a, b) => a - b);
      renderQuiz();
    }));
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    on('prev', () => { s.i--; renderQuiz(); });
    on('next', () => { s.i++; renderQuiz(); });
    on('flag', () => { s.flagged[q.id] = !s.flagged[q.id]; renderQuiz(); });
    on('check', () => { s.checked[q.id] = true; trackMissed(q, s.answers[q.id]); renderQuiz(); });
    on('finish', () => {
      if (s.mode === 'exam') {
        const unanswered = s.ids.length - answeredCount;
        if (unanswered > 0) {
          const btn = document.getElementById('finish');
          if (btn.dataset.confirm !== '1') { btn.dataset.confirm = '1'; btn.textContent = `${unanswered} unanswered. Submit anyway?`; return; }
        }
      }
      finishQuiz();
    });
    app.querySelectorAll('[data-jump]').forEach((b) => b.addEventListener('click', () => { s.i = Number(b.dataset.jump); renderQuiz(); }));
  }

  function trackMissed(q, sel) {
    const st = store.get();
    const ok = isCorrect(q, sel);
    st.missed = st.missed.filter((id) => id !== q.id);
    if (!ok) st.missed.push(q.id);
    store.save();
  }

  function finishQuiz() {
    const s = session;
    clearInterval(timerHandle);
    s.done = true;
    const qs = s.ids.map((id) => byId[id]);
    if (s.mode === 'exam') qs.forEach((q) => trackMissed(q, s.answers[q.id]));
    const results = qs.map((q) => ({ q, ok: isCorrect(q, s.answers[q.id]) }));
    const right = results.filter((r) => r.ok).length;
    const pct = Math.round((right / qs.length) * 100);
    const st = store.get();
    const prev = st.scores[s.id];
    st.scores[s.id] = { best: Math.max(pct, prev ? prev.best : 0), last: pct };
    store.save();

    const byDomain = DOMAINS.map((d) => {
      const rs = results.filter((r) => r.q.domain === d.id);
      return { d, n: rs.length, ok: rs.filter((r) => r.ok).length };
    }).filter((x) => x.n);

    const pass = pct >= s.cfg.pass;
    app.innerHTML = `
      <div class="card result-hero">
        <div class="muted">${esc(s.title)}</div>
        <div class="big">${pct}%</div>
        <div>${right} of ${qs.length} correct</div>
        ${s.mode === 'exam' ? `<div class="verdict ${pass ? 'pass' : 'fail'}">${pass ? 'PASS' : 'BELOW PASSING'} · passing score ${s.cfg.pass}%</div>` : ''}
        <div class="btn-row" style="justify-content:center;margin-top:16px">
          <a class="btn" href="#/${s.mode === 'exam' ? 'exam' : 'practice'}">Back</a>
          <button class="btn primary" id="retry">Retry</button>
          ${st.missed.length ? '<a class="btn" href="#/practice/missed">Review missed questions</a>' : ''}
        </div>
      </div>
      <div class="section-title"><h2>By domain</h2><span class="muted">Study sheet links open the domain</span></div>
      <div class="card weights breakdown">
        ${byDomain.map(({ d, n, ok }) => { const p = Math.round((ok / n) * 100); const c = p >= 80 ? 'good' : p >= s.cfg.pass ? 'mid' : 'bad'; return `<a class="weight-row" href="#/study/${d.id}"><span>${esc(d.title)}</span><span class="bar ${c}"><i style="width:${p}%"></i></span><span class="pct">${ok}/${n}</span></a>`; }).join('')}
      </div>
      <div class="section-title"><h2>Review</h2></div>
      ${results.map(({ q, ok }, k) => {
        const sel = s.answers[q.id] || [];
        return `<details class="card review-item" ${ok ? '' : 'open'}>
          <summary><span class="${ok ? 'tag-ok' : 'tag-no'}">${ok ? '✓' : '✗'}</span> ${k + 1}. ${fmt(q.stem)}</summary>
          <ul class="options" style="margin-top:12px">${s.perm[q.id].map((i, pos) => `<li><div class="option locked ${q.answer.includes(i) ? 'correct' : sel.includes(i) ? 'wrong' : ''}"><span class="letter">${LETTERS[pos]}</span><span>${fmt(q.options[i])}</span></div></li>`).join('')}</ul>
          <div class="explain ${ok ? '' : 'wrong'}"><div>${fmt(q.explanation)}</div><div class="muted" style="margin-top:8px;font-size:.85rem">${esc(q.domainTitle)} · ${esc(q.objectiveText || '')}</div></div>
        </details>`;
      }).join('')}`;
    document.getElementById('retry').addEventListener('click', () => route(true));
    window.scrollTo(0, 0);
  }

  // ---------- router ----------
  function route(force) {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const [section, sub] = parts;
    if (section !== 'exam' || !sub) clearInterval(timerHandle);
    if (!section) return viewHome();
    if (section === 'study') return viewStudy(sub);
    if (section === 'practice') {
      if (!sub) return viewPractice();
      const set = practiceSets().find((x) => x.id === sub);
      if (!set) return viewPractice();
      setTab('practice');
      return startQuiz({ id: set.id, title: set.title, ids: set.ids(), mode: 'practice' });
    }
    if (section === 'exam') {
      if (!sub) return viewExamList();
      setTab('exam');
      if (sub === 'mission-sim') return startQuiz({ id: 'mission-sim', title: 'Mission Test Simulation', ids: weightedPick(MISSION.questions, Math.random), mode: 'exam', cfg: MISSION });
      const def = examDefs.find((e) => e.id === sub);
      const ids = def ? weightedPick(EXAM.questions, rng(def.seed)) : weightedPick(EXAM.questions, Math.random);
      return startQuiz({ id: def ? def.id : 'exam-random', title: def ? def.title : 'Random Mock Exam', ids, mode: 'exam' });
    }
    viewHome();
  }
  window.addEventListener('hashchange', () => route());
  window.addEventListener('beforeunload', (e) => { if (session && session.mode === 'exam' && !session.done && location.hash.startsWith('#/exam/')) { e.preventDefault(); e.returnValue = ''; } });

  // ---------- theme ----------
  const root = document.documentElement;
  try { const t = localStorage.getItem('csa25-theme'); if (t) root.dataset.theme = t; } catch (e) { /* ignore */ }
  document.getElementById('themeToggle').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('csa25-theme', root.dataset.theme); } catch (e) { /* ignore */ }
  });

  route();
})();
