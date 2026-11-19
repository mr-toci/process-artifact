/* Scroll story. Content is fully readable without this file; it only adds motion and small interactions. */
(function () {
  'use strict';
  const html = document.documentElement;
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Always-on bits (no GSAP needed) ---------- */

  // Scroll progress bar
  const bar = q('.progress span');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
      ticking = false;
    });
  }, { passive: true });

  // 100 dots: 99 Process, 1 Utility
  const dots = q('.dots');
  dots.innerHTML = '<i></i>'.repeat(99) + '<i class="u"></i>';

  // Purpose-flip cards
  qa('.flip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      q('.flip-ctx', btn).textContent = on ? btn.dataset.b : btn.dataset.a;
      if (window.gsap && html.classList.contains('motion')) {
        gsap.fromTo(btn, { rotationY: -90 }, { rotationY: 0, duration: .5, ease: 'back.out(1.6)', transformPerspective: 800 });
      }
    });
  });

  q('#print-poster').addEventListener('click', () => window.print());

  /* ---------- Motion ---------- */
  if (!window.gsap || !window.ScrollTrigger) { html.classList.remove('motion'); return; }
  if (!html.classList.contains('motion')) return;
  gsap.registerPlugin(ScrollTrigger);

  // Stars
  const starLayer = q('.stars');
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 90; i++) {
    const s = document.createElement('i');
    const size = Math.random() < .15 ? 3 : Math.random() < .5 ? 2 : 1.2;
    s.className = 'star';
    s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${size}px;height:${size}px;opacity:${.3 + Math.random() * .6}`;
    frag.appendChild(s);
  }
  starLayer.appendChild(frag);
  qa('.star').forEach((s) => gsap.to(s, { opacity: .1, duration: 1 + Math.random() * 3, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: Math.random() * 3 }));

  /* ---------- 0 Hook ---------- */
  const hookPhoto = q('.hook-photo');
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from(hookPhoto, { scale: .5, rotation: -25, autoAlpha: 0, duration: 1.2, ease: 'back.out(1.4)' })
    .from('.hook .kicker, .hook h1, .hook .lede, .scroll-cue', { y: 30, autoAlpha: 0, stagger: .12, duration: .8 }, '-=.6')
    .add(() => gsap.to(hookPhoto, { y: -14, rotation: -2, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
  gsap.to('.hook-inner', { yPercent: -18, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hook', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- 1 Summit (pinned) — created first so later triggers account for its pin spacing ---------- */
  (function summit() {
    const stage = q('.summit-stage');
    const real = q('.real-selfie'), ai = q('.ai-selfie'), trail = q('.trail');
    const grid = q('.pixel-grid', real);
    const badgeP = q('.badge-process', real);
    const badgeAI = q('.badge-ai', ai), stamp = q('.stamp', ai), aiCap = q('figcaption', ai);
    const steps = qa('.summit .step');

    // Shatterable copy of the AI selfie: 4×3 grid of tiles, each showing its slice of the same artwork.
    const shardBox = q('.shards', ai);
    let tiles = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      tiles += `<svg viewBox="${c * 100} ${r * 100} 100 100" preserveAspectRatio="none" aria-hidden="true"><use href="#selfie-art" width="400" height="300"/></svg>`;
    }
    shardBox.innerHTML = `<div class="shard-grid" role="img" aria-label="An identical AI-generated selfie">${tiles}</div>`;
    const shards = qa('svg', shardBox);
    const fly = shards.map((_, k) => ({
      x: ((k % 4) - 1.5) * gsap.utils.random(70, 160),
      y: (Math.floor(k / 4) - 1) * gsap.utils.random(60, 140) + gsap.utils.random(120, 260),
      rotation: gsap.utils.random(-120, 120),
    }));

    // Trail: hikers walk the path; checkpoints light up as they pass.
    const path = q('.trail-line', trail), len = path.getTotalLength();
    const hikers = q('.hikers', trail), marksG = q('.trail-marks', trail);
    const stops = [0, .4, .7, 1];
    const marks = stops.map((t) => {
      const pt = path.getPointAtLength(t * len);
      const m = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      m.setAttribute('cx', pt.x); m.setAttribute('cy', pt.y); m.setAttribute('r', 9);
      marksG.appendChild(m);
      return m;
    });
    path.style.strokeDasharray = len;
    const prog = { p: 0 };
    const place = () => {
      const pt = path.getPointAtLength(prog.p * len);
      hikers.setAttribute('transform', `translate(${pt.x} ${pt.y - 10})`);
      path.style.strokeDashoffset = len * (1 - prog.p);
      marks.forEach((m, i) => m.setAttribute('fill', prog.p >= stops[i] - .001 ? '#ffb238' : '#5a4fb0'));
    };
    place();

    const narrow = () => innerWidth < 700;
    const sideScale = () => (narrow() ? .5 : .74);
    const sideOff = () => (real.offsetWidth * sideScale()) / 2 + Math.min(20, innerWidth * .03);

    gsap.set([real, ai, trail], { xPercent: -50, yPercent: -50 });
    gsap.set([trail, ai, badgeP, stamp], { autoAlpha: 0 });
    gsap.set(stamp, { rotation: -12 });
    gsap.set(steps, { autoAlpha: 0, y: 24 });
    gsap.set(steps[0], { autoAlpha: 1, y: 0 });

    const tl = gsap.timeline({
      defaults: { duration: .5, ease: 'power2.inOut' },
      scrollTrigger: { trigger: stage, start: 'top top', end: '+=800%', scrub: .6, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
    });

    steps.forEach((s, i) => {
      if (i > 0) tl.to(s, { autoAlpha: 1, y: 0, duration: .15 }, i + .02);
      if (i < steps.length - 1) tl.to(s, { autoAlpha: 0, y: -24, duration: .15 }, i + .85);
    });

    tl
      // 1: just pixels
      .to(real, { scale: 1.2 }, 1)
      .to(grid, { opacity: 1 }, 1)
      // 2: rewind to the trail
      .to(grid, { opacity: 0, duration: .2 }, 2)
      .to(real, { scale: .3, rotation: -25, autoAlpha: 0 }, 2)
      .fromTo(trail, { autoAlpha: 0, scale: .9 }, { autoAlpha: 1, scale: 1 }, 2.1)
      .to(prog, { p: stops[1], duration: .8, ease: 'none', onUpdate: place }, 2.2)
      // 3: rain, dawn
      .to('.trail .rain', { opacity: 1, duration: .3 }, 3)
      .to('.trail .moon', { opacity: 0, duration: .4 }, 3)
      .to('.trail .sun', { opacity: 1, duration: .6 }, 3.2)
      .to(prog, { p: stops[2], duration: .8, ease: 'none', onUpdate: place }, 3.2)
      .to('.trail .rain', { opacity: 0, duration: .3 }, 4)
      // 4–5: blister, then the top
      .to(prog, { p: stops[3], duration: .8, ease: 'none', onUpdate: place }, 4.2)
      // 6: the photo returns as a receipt
      .to(trail, { autoAlpha: 0, scale: 1.08 }, 6)
      .to(real, { autoAlpha: 1, scale: 1, rotation: 0, boxShadow: '0 0 90px 12px rgba(255,178,56,.55)' }, 6)
      .fromTo(badgeP, { autoAlpha: 0, scale: .4 }, { autoAlpha: 1, scale: 1, ease: 'back.out(2.2)', duration: .35 }, 6.3)
      // 7: the AI twin
      .to(real, { x: () => -sideOff(), scale: () => sideScale() }, 7)
      .fromTo(ai, { autoAlpha: 0, x: () => innerWidth * .6, scale: () => sideScale() }, { autoAlpha: 1, x: () => sideOff(), scale: () => sideScale(), immediateRender: false }, 7)
      // 8: shatter
      .to(ai, { backgroundColor: 'rgba(253,251,246,0)', boxShadow: '0 0 0 0 rgba(0,0,0,0)', duration: .4 }, 8)
      .to([aiCap, badgeAI], { autoAlpha: 0, duration: .2 }, 8)
      .fromTo(stamp, { autoAlpha: 0, scale: 2.4 }, { autoAlpha: 1, scale: 1, ease: 'back.out(2)', duration: .3 }, 8.45)
      .to({}, { duration: .6 });
    shards.forEach((s, k) => tl.to(s, { ...fly[k], autoAlpha: 0, duration: .6, ease: 'power2.in' }, 8 + k * .015));
  })();

  /* ---------- Sky colour per chapter ---------- */
  const sky = q('.sky');
  const SKIES = {
    night: ['#0b1033', '#1f1a5c'],
    process: ['#1a1040', '#4a1f55'],
    utility: ['#05263a', '#0d4a5e'],
    dawn: ['#14174a', '#4b2f78'],
  };
  gsap.set(sky, { '--sky-top': SKIES.night[0], '--sky-bot': SKIES.night[1] });
  qa('[data-sky]').forEach((sec) => {
    const [top, bot] = SKIES[sec.dataset.sky] || SKIES.night;
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => self.isActive && gsap.to(sky, { '--sky-top': top, '--sky-bot': bot, duration: 1.2, overwrite: true }),
    });
  });
  gsap.to(starLayer, { yPercent: -8, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });

  /* ---------- Generic reveals ---------- */
  const reveal = (targets, vars = {}) => qa(targets).forEach((el) => gsap.from(el, {
    y: 50, autoAlpha: 0, duration: .9, ease: 'power3.out', ...vars,
    scrollTrigger: { trigger: el, start: 'top 86%', once: true },
  }));
  reveal('.chapter:not(.hook):not(.summit):not(.takeaway-ch) h2, .chapter:not(.hook) .lede, .big-line, .judged, .gym, .where-ai, .poster, .split-text, .map-card');
  reveal('.chapter:not(.hook) .kicker', { y: 20 });

  /* ---------- 2 Process cards + receipts ---------- */
  gsap.set('.art-card', { autoAlpha: 0, y: 80 });
  gsap.set('.receipt', { clipPath: 'inset(0 0 100% 0)' });
  gsap.set('.twist', { autoAlpha: 0 });
  ScrollTrigger.batch('.art-card', {
    start: 'top 85%', once: true,
    onEnter: (batch) => {
      gsap.to(batch, { autoAlpha: 1, y: 0, stagger: .15, duration: .8, ease: 'power3.out' });
      batch.forEach((card, i) => {
        gsap.to(q('.receipt', card), { clipPath: 'inset(0 0 0% 0)', duration: 1.1, delay: .5 + i * .15, ease: 'steps(12)' });
        const tw = q('.twist', card);
        if (tw) gsap.to(tw, { autoAlpha: 1, duration: .6, delay: 1.8 });
      });
    },
  });
  gsap.utils.toArray('.art-card .art').forEach((a, i) => gsap.to(a, { y: -8, rotation: i % 2 ? 3 : -3, duration: 2.4 + i * .3, yoyo: true, repeat: -1, ease: 'sine.inOut' }));

  /* ---------- 3 Utility: route + sum ---------- */
  const route = q('.route');
  const rl = route.getTotalLength();
  gsap.set(route, { strokeDasharray: rl, strokeDashoffset: rl });
  gsap.to(route, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.map-card', start: 'top 75%', end: 'center 40%', scrub: .5 } });
  gsap.from('.directions li', { x: -30, autoAlpha: 0, stagger: .12, duration: .5, scrollTrigger: { trigger: '.directions', start: 'top 85%', once: true } });
  gsap.timeline({ scrollTrigger: { trigger: '.sum-card', start: 'top 85%', once: true } })
    .from('.sum-card > span:not(.sum-line):not(.sum-ans)', { y: 16, autoAlpha: 0, stagger: .15, duration: .4 })
    .from('.sum-line', { scaleX: 0, transformOrigin: 'right', duration: .4 })
    .from('.sum-ans', { scale: 0, duration: .5, ease: 'back.out(2.5)' });
  gsap.from('.chips li', { scale: 0, stagger: .12, duration: .5, ease: 'back.out(2)', scrollTrigger: { trigger: '.chips', start: 'top 88%', once: true } });

  /* ---------- 4 Test ---------- */
  gsap.from('.flow-branch', { y: 60, autoAlpha: 0, stagger: .2, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.flow', start: 'top 82%', once: true } });

  /* ---------- 6 Dots ---------- */
  const dotEls = qa('.dots i');
  gsap.set(dotEls, { scale: 0 });
  gsap.timeline({ scrollTrigger: { trigger: '.dots-wrap', start: 'top 75%', once: true } })
    .to(dotEls.slice(0, 99), { scale: 1, duration: .3, ease: 'back.out(3)', stagger: { each: .012, from: 'start' } })
    .to(dotEls[99], { scale: 1.6, duration: .4, ease: 'back.out(3)' }, '+=.2')
    .to(dotEls[99], { scale: 1, duration: .3 })
    .from('.dots-caption', { autoAlpha: 0, x: 30, duration: .7 }, '-=.6');

  /* ---------- 7 Teachers + 8 Flips ---------- */
  gsap.from('.col', { y: 60, autoAlpha: 0, stagger: .2, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.two-col', start: 'top 82%', once: true } });
  gsap.from('.col li', { x: -20, autoAlpha: 0, stagger: .06, duration: .4, scrollTrigger: { trigger: '.two-col', start: 'top 70%', once: true } });
  gsap.from('.flip', { y: 60, rotation: (i) => [-4, 2, 5][i % 3], autoAlpha: 0, stagger: .15, duration: .8, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.flips', start: 'top 82%', once: true } });

  // Fonts/images can shift layout after load; recompute trigger positions once everything is in.
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
