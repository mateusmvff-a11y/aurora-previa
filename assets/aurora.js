/* Aurora | Club Aurora  (v4)
   GSAP + ScrollTrigger + SplitText + Lenis por CDN, sem build.
   Sem GSAP, ou com "menos movimento" ligado, a pagina abre completa (showAll). */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var hasSplit = typeof window.SplitText !== 'undefined';

  var nav = $('#nav');
  var burger = $('.nav__burger');
  var menu = $('#menu');
  var lenis = null;

  try { history.scrollRestoration = 'manual'; } catch (e) {}

  /* ------------------------------------------------------------------
     Menu do celular
     ------------------------------------------------------------------ */
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  }
  burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); burger.focus(); }
  });

  /* ------------------------------------------------------------------
     Ancoras: deslizam com o Lenis (ou nativo, sem animacao)
     ------------------------------------------------------------------ */
  function goTo(id) {
    var target = id === '#topo' ? 0 : $(id);
    if (target === null) { return; }
    if (lenis) {
      lenis.scrollTo(target, { offset: 0, duration: 1.8, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    } else if (target === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) { return; }
      if (id !== '#topo' && !$(id)) { return; }
      e.preventDefault();
      var wasOpen = root.classList.contains('menu-open');
      if (wasOpen) { setMenu(false); }
      setTimeout(function () { goTo(id); }, wasOpen ? 420 : 0);
      try { history.replaceState(null, '', id); } catch (err) {}
    });
  });

  /* ------------------------------------------------------------------
     Sem GSAP ou com movimento reduzido: tudo pronto
     ------------------------------------------------------------------ */
  function showAll() { root.classList.add('no-anim'); }
  function basics() {
    showAll();
    var onScroll = function () { nav.classList.toggle('is-solid', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (!hasGsap || reduce) { basics(); return; }

  /* ==================================================================
     Versao animada
     ================================================================== */
  gsap.registerPlugin(ScrollTrigger);
  if (hasSplit) { gsap.registerPlugin(SplitText); }
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: 'power3.out' });

  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  /* linhas com mascara que sobem quando o titulo entra na tela */
  function revealLines(el) {
    var played = false;
    if (!hasSplit) {
      return gsap.fromTo(el, { y: 30, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1.1,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    }
    return SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
      onSplit: function (self) {
        if (played) { return; }
        return gsap.from(self.lines, {
          yPercent: 120, duration: 1.5, ease: 'expo.out', stagger: 0.11,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true, onEnter: function () { played = true; } }
        });
      }
    });
  }

  /* ---------- barra de navegacao: some ao descer, volta ao subir ---------- */
  function buildChrome() {
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        var y = self.scroll();
        nav.classList.toggle('is-solid', y > 40);
        if (root.classList.contains('menu-open')) { return; }
        if (y > 320 && self.direction === 1) { nav.classList.add('is-hidden'); }
        else if (self.direction === -1 || y <= 320) { nav.classList.remove('is-hidden'); }
      }
    });
  }

  /* ---------- capa: titulo sobe por palavra, a estante de edicoes entra em cascata ---------- */
  function buildHero() {
    var title = $('.hero__title');
    var lis = $$('.shelf li');
    var words = null;

    if (hasSplit) {
      words = SplitText.create(title, { type: 'words', mask: 'words', wordsClass: 'w' }).words;
      gsap.set(words, { yPercent: 122 });
    }
    gsap.set(title, { visibility: 'visible' });

    var tl = gsap.timeline({ delay: 0.05 });
    tl.fromTo('.nav', { opacity: 0 }, { opacity: 1, duration: 1, clearProps: 'opacity' }, 0)
      .fromTo('.hero__eyebrow', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1 }, 0.05);
    if (words) { tl.to(words, { yPercent: 0, duration: 1.7, ease: 'expo.out', stagger: 0.12 }, 0.12); }
    else { tl.fromTo(title, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.2 }, 0.12); }
    tl.fromTo('.hero__side', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2 }, 0.9)
      .fromTo(lis, { opacity: 0, y: 190 }, {
        opacity: 1, y: 0, duration: 1.9, ease: 'power4.out', stagger: 0.12
      }, 0.35);

    /* rolando, cada capa sobe num ritmo */
    var depth = [-30, -70, -110, -70, -30];
    tl.add(function () {
      lis.forEach(function (li, i) {
        gsap.to(li, {
          y: depth[i], ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.7 }
        });
      });
      gsap.to('.hero__top', {
        yPercent: -8, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }, 2.4);
  }

  /* ---------- feita para durar ---------- */
  function buildDurar() {
    /* as duas fotos se abrem de baixo para cima e se movem em ritmos diferentes */
    $$('[data-ph]').forEach(function (ph, i) {
      var img = $('img', ph);
      gsap.fromTo(ph, { clipPath: 'inset(100% 0% 0% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.out',
        scrollTrigger: { trigger: ph, start: 'top 85%', once: true }
      });
      gsap.fromTo(img, { scale: 1.25, yPercent: -6 }, {
        scale: 1, yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: ph, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* a frase acende palavra por palavra enquanto se le */
    var lead = $('.lead[data-words]');
    if (lead && hasSplit) {
      SplitText.create(lead, {
        type: 'words', wordsClass: 'w', autoSplit: true,
        onSplit: function (self) {
          return gsap.fromTo(self.words, { opacity: 0.16 }, {
            opacity: 1, ease: 'none', stagger: 0.12,
            scrollTrigger: { trigger: lead, start: 'top 82%', end: 'bottom 52%', scrub: 0.5 }
          });
        }
      });
    }
  }

  /* ---------- as edicoes ---------- */
  function buildEditions() {
    $$('.ed').forEach(function (ed) {
      var figs = $$('.fig', ed);
      var num = $('.ed__num', ed);

      gsap.set(num, { yPercent: 30, opacity: 0 });
      gsap.set(figs, { yPercent: 10, opacity: 0 });
      var tl = gsap.timeline({ scrollTrigger: { trigger: ed, start: 'top 62%', once: true } });
      tl.to(num, { yPercent: 0, opacity: 1, duration: 1.7, ease: 'expo.out' }, 0)
        .to(figs, { yPercent: 0, opacity: 1, duration: 1.7, ease: 'expo.out', stagger: 0.14 }, 0.1);

      var items = $$('.ed__meta span, .ed__lede, .ed__text .eyebrow, .ed__list li, .ed__quote cite', ed);
      gsap.set(items, { opacity: 0, y: 22 });
      gsap.to(items, {
        opacity: 1, y: 0, duration: 1.1, stagger: 0.07,
        scrollTrigger: { trigger: $('.ed__text', ed), start: 'top 74%', once: true }
      });
    });

    /* as fotos laterais andam mais que a capa */
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      $$('.ed').forEach(function (ed) {
        var trig = { trigger: ed, start: 'top bottom', end: 'bottom top', scrub: 0.6 };
        var cover = $('.fig--cover', ed), side = $('.collage__side', ed);
        if (cover) { gsap.fromTo(cover, { y: -10 }, { y: 14, ease: 'none', scrollTrigger: trig }); }
        if (side) { gsap.fromTo(side, { y: 46 }, { y: -46, ease: 'none', scrollTrigger: trig }); }
      });
    });
  }

  /* ---------- por que assinar: cada titulo se abre na sua vez ---------- */
  function buildWhy() {
    var items = $$('.wy');
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      var current = -1;
      var set = function (i) {
        if (i === current) { return; }
        current = i;
        items.forEach(function (it, k) { it.classList.toggle('is-on', k === i); });
      };
      set(0);
      ScrollTrigger.create({
        trigger: '.why', start: 'top top', end: 'bottom bottom',
        onUpdate: function (self) { set(Math.min(items.length - 1, Math.floor(self.progress * items.length * 0.999))); }
      });
    });
  }

  /* ---------- club ---------- */
  function buildClub() {
    var n = $('.price__n');
    var lis = $$('.checks li');
    var plan = $$('.plan .eyebrow, .plan__note, .plan .btn');
    var cvs = $$('.club__cv');

    gsap.set(lis, { opacity: 0, y: 18 });
    gsap.set($('.club__note'), { opacity: 0, y: 14 });
    gsap.set(plan, { opacity: 0, y: 16 });
    gsap.set('.price', { opacity: 0, y: 40 });
    gsap.set(cvs, { opacity: 0, xPercent: function (i) { return i ? 40 : -40; } });

    gsap.timeline({ scrollTrigger: { trigger: '.checks', start: 'top 86%', once: true } })
      .to(lis, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12 }, 0)
      .to('.club__note', { opacity: 1, y: 0, duration: 1 }, 0.5);

    var o = { v: 0 };
    gsap.timeline({ scrollTrigger: { trigger: '.plan', start: 'top 78%', once: true } })
      .to(plan[0], { opacity: 1, y: 0, duration: 1 }, 0)
      .to('.price', { opacity: 1, y: 0, duration: 1.4, ease: 'expo.out' }, 0.1)
      .to(o, { v: 44, duration: 2.2, ease: 'power3.out', onUpdate: function () { n.textContent = Math.round(o.v); } }, 0.2)
      .to(plan.slice(1), { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.9)
      .to(cvs, { opacity: 1, xPercent: 0, duration: 2, ease: 'expo.out', stagger: 0.12 }, 0.2);

    /* as capas dos lados sobem e descem um pouco, em ritmos diferentes */
    cvs.forEach(function (cv, i) {
      gsap.fromTo(cv, { y: i ? 70 : 40 }, {
        y: i ? -60 : -80, ease: 'none',
        scrollTrigger: { trigger: '.club', start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      });
    });
  }

  /* ---------- fechamento e rodape ---------- */
  function buildEnd() {
    $$('[data-reveal]').forEach(function (el) {
      gsap.fromTo(el, { y: 30, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1.2,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

    /* "Onde o feminino se encontra.": a mesma rolagem do "por que assinar", a tela fica parada e as linhas acendem */
    var lines = $$('.fl');
    var btn = $('.fim__btn');
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      var state = -2;
      var apply = function (s) {
        if (s === state) { return; }
        state = s;
        lines.forEach(function (el, i) { el.classList.toggle('is-on', s >= i); });
        btn.classList.toggle('is-on', s >= lines.length);
      };
      apply(-1);
      ScrollTrigger.create({
        trigger: '.fim', start: 'top top', end: 'bottom bottom',
        onUpdate: function (self) {
          var p = self.progress;
          apply(p < 0.1 ? -1 : p < 0.38 ? 0 : p < 0.66 ? 1 : 2);
        }
      });
    });

    var big = $('.foot__big');
    if (big && hasSplit) {
      var s = SplitText.create(big, { type: 'chars', mask: 'chars', charsClass: 'ch' });
      gsap.from(s.chars, {
        yPercent: 110, duration: 1.9, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: big, start: 'top 98%', once: true }
      });
    }
  }

  /* ------------------------------------------------------------------
     Partida: espera as fontes, senao as linhas quebram no lugar errado
     ------------------------------------------------------------------ */
  function fontsReady() {
    void document.body.offsetHeight;
    var f = document.fonts;
    if (!f || !f.load) { return Promise.resolve(); }
    return Promise.all([
      f.load('400 100px "Baskervville"'),
      f.load('italic 400 100px "Baskervville"'),
      f.load('400 18px "Hanken Grotesk"'),
      f.load('500 18px "Hanken Grotesk"')
    ]).catch(function () {});
  }

  function start() {
    root.classList.add('ready');
    buildChrome();
    buildHero();
    buildDurar();
    $$('[data-split]').forEach(function (el) { revealLines(el); });
    buildEditions();
    buildWhy();
    buildClub();
    buildEnd();
    if (lenis) { lenis.start(); }
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (location.hash && $(location.hash)) { setTimeout(function () { goTo(location.hash); }, 1600); }
  }

  /* plano B: se algo quebrar na montagem, a pagina abre pronta */
  function safeStart() {
    try { start(); }
    catch (err) {
      if (window.console) { console.error('[aurora] animacao desligada:', err); }
      gsap.killTweensOf('*');
      ScrollTrigger.getAll().forEach(function (st) { st.kill(); });
      if (lenis) { lenis.destroy(); lenis = null; }
      basics();
    }
  }

  var run = function () {
    window.scrollTo(0, 0);
    Promise.race([fontsReady(), new Promise(function (r) { setTimeout(r, 2600); })]).then(safeStart);
  };
  if (document.readyState === 'complete') { run(); } else { window.addEventListener('load', run); }
})();
