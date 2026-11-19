/* Classifier widget. Mount on any <div class="classifier" data-round="r1|teacher|r2" data-count="N">.
   Client-side only: nothing is stored or sent. */
(function () {
  'use strict';

  const ITEMS = window.PA_ITEMS || [];
  const LABEL = { process: 'Process Artifact', utility: 'Utility Asset' };
  const ICON = { process: '#ic-process', utility: '#ic-utility' };
  const animated = () => document.documentElement.classList.contains('motion') && window.gsap;

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  function pickDeck(round, count) {
    const pool = ITEMS.filter((it) => it.round === round);
    if (round === 'r2') {
      // Keep pairs side by side so the contrast lands; shuffle pair order and order within a pair.
      const pairs = {};
      pool.forEach((it) => (pairs[it.pair] = pairs[it.pair] || []).push(it));
      return shuffle(Object.values(pairs)).flatMap((p) => shuffle(p)).slice(0, count);
    }
    if (round === 'r1') {
      // Balanced: half of each answer.
      const half = Math.ceil(count / 2);
      const p = shuffle(pool.filter((i) => i.answer === 'process')).slice(0, half);
      const u = shuffle(pool.filter((i) => i.answer === 'utility')).slice(0, count - half);
      return shuffle(p.concat(u));
    }
    return shuffle(pool).slice(0, count);
  }

  const icon = (kind) => `<svg aria-hidden="true"><use href="${ICON[kind]}"/></svg>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function Classifier(root) {
    const round = root.dataset.round;
    const count = parseInt(root.dataset.count, 10) || 10;
    let deck, idx, score, tally;

    root.innerHTML = `
      <div class="clf-play">
        <div class="clf-top"><span class="clf-pos"></span><span class="clf-sc"></span></div>
        <div class="clf-bar"><span></span></div>
        <div class="clf-arena">
          <div class="clf-bin process" aria-hidden="true">${icon('process')}<span>Process<br>Artifact</span><b>0</b></div>
          <article class="clf-card" aria-live="polite"></article>
          <div class="clf-bin utility" aria-hidden="true">${icon('utility')}<span>Utility<br>Asset</span><b>0</b></div>
        </div>
        <div class="clf-buttons">
          <button type="button" class="btn btn-process" data-pick="process">${icon('process')}Process Artifact</button>
          <button type="button" class="btn btn-utility" data-pick="utility">${icon('utility')}Utility Asset</button>
        </div>
        <div class="clf-feedback" aria-live="polite"></div>
        <button type="button" class="btn btn-ghost clf-next" hidden>Next card →</button>
      </div>
      <div class="clf-end" hidden aria-live="polite"></div>`;

    const $ = (s) => root.querySelector(s);
    const play = $('.clf-play'), end = $('.clf-end'), card = $('.clf-card');
    const fb = $('.clf-feedback'), next = $('.clf-next'), bar = $('.clf-bar span');
    const pickBtns = root.querySelectorAll('[data-pick]');
    const bins = { process: $('.clf-bin.process'), utility: $('.clf-bin.utility') };

    function start() {
      deck = pickDeck(round, count);
      idx = 0; score = 0; tally = { process: 0, utility: 0 };
      bins.process.querySelector('b').textContent = '0';
      bins.utility.querySelector('b').textContent = '0';
      play.hidden = false; end.hidden = true;
      show();
    }

    function show() {
      const it = deck[idx];
      card.className = 'clf-card';
      card.innerHTML = `<div class="clf-emoji" aria-hidden="true">${it.emoji}</div><h3>${esc(it.title)}</h3><p>${esc(it.context)}</p>`;
      $('.clf-pos').textContent = `Card ${idx + 1} of ${deck.length}`;
      $('.clf-sc').textContent = `Score ${score}`;
      bar.style.width = `${(idx / deck.length) * 100}%`;
      fb.innerHTML = '';
      next.hidden = true;
      pickBtns.forEach((b) => (b.disabled = false));
      if (animated()) gsap.fromTo(card, { y: 40, opacity: 0, rotation: -3, scale: .94 }, { y: 0, opacity: 1, rotation: 0, scale: 1, duration: .45, ease: 'back.out(1.6)' });
    }

    function pick(choice) {
      const it = deck[idx];
      const right = choice === it.answer;
      if (right) score++;
      pickBtns.forEach((b) => (b.disabled = true));
      card.classList.add(`is-${it.answer}`);
      fb.innerHTML = right
        ? `<span class="ok">✓ Yes, it's a ${LABEL[it.answer]}.</span> ${esc(it.why)}`
        : `<span class="no">Not quite. It's a ${LABEL[it.answer]}.</span> ${esc(it.why)}`;
      $('.clf-sc').textContent = `Score ${score}`;
      next.hidden = false;
      next.textContent = idx === deck.length - 1 ? 'See your score →' : 'Next card →';
      next.focus({ preventScroll: true });
      if (animated() && !right) gsap.fromTo(card, { x: -8 }, { x: 0, duration: .5, ease: 'elastic.out(1, .3)' });
    }

    function advance() {
      const it = deck[idx];
      tally[it.answer]++;
      const bin = bins[it.answer];
      const finish = () => {
        bin.querySelector('b').textContent = tally[it.answer];
        bin.classList.add('pulse');
        setTimeout(() => bin.classList.remove('pulse'), 300);
        idx++;
        if (idx < deck.length) show(); else done();
      };
      const binVisible = bin.offsetParent !== null;
      if (animated() && binVisible) {
        const c = card.getBoundingClientRect(), b = bin.getBoundingClientRect();
        gsap.to(card, {
          x: b.left + b.width / 2 - (c.left + c.width / 2), y: b.top + b.height / 2 - (c.top + c.height / 2),
          scale: .25, rotation: it.answer === 'process' ? -18 : 18, opacity: 0, duration: .45, ease: 'power2.in',
          onComplete: () => { gsap.set(card, { clearProps: 'all' }); finish(); },
        });
      } else {
        finish();
      }
    }

    function done() {
      bar.style.width = '100%';
      play.hidden = true; end.hidden = false;
      const pct = score / deck.length;
      const msg = pct === 1 ? 'Perfect. You’ve got it.'
        : pct >= .7 ? 'Nicely done. Look back at any you missed. The test question settles them.'
        : 'Worth another go. Ask each time: if AI made it, would it lose its value?';
      end.innerHTML = `<p class="clf-score">${score} / ${deck.length}</p><p>${msg}</p>
        <button type="button" class="btn btn-ghost clf-again">↻ Play again with new cards</button>`;
      end.querySelector('.clf-again').addEventListener('click', () => { start(); pickBtns[0].focus({ preventScroll: true }); });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }

    pickBtns.forEach((b) => b.addEventListener('click', () => pick(b.dataset.pick)));
    next.addEventListener('click', advance);
    start();
  }

  document.querySelectorAll('.classifier').forEach(Classifier);
})();
