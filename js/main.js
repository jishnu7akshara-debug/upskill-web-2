/* Aster School of Technology — interactions */
(function () {
  'use strict';
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement, body = document.body;
  if (hasGSAP && !reduce) root.classList.add('anim');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- prepare line masks + manifesto words + odometers ---------- */
  $$('.lines .line').forEach(function (l) { l.innerHTML = '<span>' + l.innerHTML + '</span>'; });

  var reel = $('.reel__track');
  if (reel) Array.prototype.slice.call(reel.children).forEach(function (f) { var c = f.cloneNode(true); c.setAttribute('aria-hidden', 'true'); reel.appendChild(c); });

  var man = $('#manifesto');
  if (man) man.innerHTML = man.textContent.trim().split(/\s+/).map(function (w) { return '<span class="mw">' + w + '</span>'; }).join(' ');

  $$('[data-roll]').forEach(function (el) {
    var txt = Number(el.dataset.roll).toLocaleString('en-IN') + (el.dataset.suffix || '');
    el.innerHTML = txt.split('').map(function (ch) {
      if (ch === ' ') return '<span class="odo-sep">&nbsp;</span>';
      if (!/\d/.test(ch)) return '<span class="odo-sep">' + ch + '</span>';
      var col = ''; for (var i = 0; i <= 9; i++) col += '<i>' + i + '</i>';
      return '<span class="odo" data-d="' + ch + '"><span class="odo__col">' + col + '</span></span>';
    }).join('');
    el.setAttribute('aria-label', txt);
  });
  function rollIn(el) {
    $$('.odo', el).forEach(function (o, i) {
      var col = o.firstChild;
      col.style.transitionDelay = (i * 0.08) + 's';
      col.style.transform = 'translateY(-' + (Number(o.dataset.d) * 10) + '%)';
    });
  }

  /* ---------- loader ---------- */
  var loader = $('#loader'), arc = $('#loaderArc'), num = $('#loaderNum'), words = $$('.loader__words span');
  var C = 565.5, start = performance.now(), MIN = 2200, last = start, shown = 0, done = false;
  var imgs = $$('img:not([loading="lazy"])'), total = imgs.length + 1, loaded = 0;
  function bump() { loaded = Math.min(total, loaded + 1); }
  imgs.forEach(function (im) { if (im.complete) bump(); else { im.addEventListener('load', bump, { once: true }); im.addEventListener('error', bump, { once: true }); } });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(bump); else bump();
  function paint(v) {
    num.textContent = v;
    arc.style.strokeDashoffset = C - (C * v / 100);
    words.forEach(function (w, i) { w.classList.toggle('on', v >= (i + 1) * 30); });
  }
  (function tick(now) {
    now = now || performance.now();
    var dt = now - last; last = now;
    var target = Math.min(loaded / total, (now - start) / MIN) * 100;
    shown += (target - shown) * Math.min(1, dt / 140);
    if (target >= 100 && shown > 99.4) shown = 100;
    paint(Math.round(shown));
    if (shown >= 100) return finish();
    requestAnimationFrame(tick);
  })();
  setTimeout(function () { loaded = total; }, 6000);
  setTimeout(function () { if (!done) { paint(100); finish(); } }, 8000);

  function finish() {
    if (done) return; done = true;
    setTimeout(function () {
      loader.classList.add('is-out');
      body.classList.remove('is-loading');
      init();
      setTimeout(function () { loader.classList.add('is-gone'); }, 1300);
    }, 300);
  }

  /* ---------- init ---------- */
  var booted = false, lenis = null;
  function init() {
    if (booted) return; booted = true;
    if (window.Lenis && !reduce) {
      lenis = new Lenis({ duration: 1.25, smoothWheel: true });
      if (hasGSAP) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0); }
      else { (function r(t) { lenis.raf(t); requestAnimationFrame(r); })(); }
    }
    header(); programs(); lazyVideo(); form(); timelineDots();
    if (hasGSAP && !reduce) motion();
    else {
      $$('[data-roll]').forEach(rollIn);
      $$('.mw').forEach(function (w) { w.style.opacity = 1; });
      var ff = $('#filmFrame'); if (ff) ff.style.clipPath = 'none';
    }
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  }

  function go(target) { if (lenis) lenis.scrollTo(target, { offset: -80 }); else target.scrollIntoView({ behavior: 'smooth' }); }

  /* ---------- header + drawer ---------- */
  function header() {
    var h = $('#header'), burger = $('#burger'), drawer = $('#drawer'), lastY = 0;
    function onScroll() {
      var y = window.scrollY;
      h.classList.toggle('is-solid', y > 60);
      h.classList.toggle('is-hidden', y > lastY && y > 600 && !drawer.classList.contains('is-open'));
      lastY = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    burger.addEventListener('click', function () {
      var open = !drawer.classList.contains('is-open');
      drawer.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open);
      if (lenis) open ? lenis.stop() : lenis.start();
    });
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var t = $(id); if (!t) return;
        e.preventDefault();
        if (drawer.classList.contains('is-open')) { drawer.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); if (lenis) lenis.start(); }
        go(id === '#top' ? body : t);
      });
    });
  }

  /* ---------- program list: cursor preview + accordion ---------- */
  function programs() {
    var prev = $('#hoverPreview'), pimg = prev.querySelector('img'), rows = $$('.prow');
    var mx = 0, my = 0, x = 0, y = 0, active = false;
    if (finePointer) {
      rows.forEach(function (r) {
        r.addEventListener('mouseenter', function () { pimg.src = r.dataset.img; prev.classList.add('is-on'); active = true; });
        r.addEventListener('mouseleave', function () { prev.classList.remove('is-on'); active = false; });
      });
      window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
      (function follow() {
        x += (mx - x) * 0.14; y += (my - y) * 0.14;
        prev.style.left = (x + 170) + 'px'; prev.style.top = y + 'px';
        prev.style.rotate = ((mx - x) * 0.05) + 'deg';
        requestAnimationFrame(follow);
      })();
    }
    rows.forEach(function (r) {
      r.setAttribute('tabindex', '0'); r.setAttribute('role', 'button');
      function toggle() {
        var open = !r.classList.contains('is-open');
        rows.forEach(function (o) { o.classList.remove('is-open'); o.setAttribute('aria-expanded', 'false'); });
        r.classList.toggle('is-open', open); r.setAttribute('aria-expanded', open);
        if (hasGSAP) setTimeout(function () { ScrollTrigger.refresh(); }, 750);
      }
      r.addEventListener('click', toggle);
      r.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
  }

  /* ---------- lazy video ---------- */
  function lazyVideo() {
    $$('video[data-lazy]').forEach(function (v) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (e.isIntersecting) {
            $$('source[data-src]', v).forEach(function (s) { s.src = s.dataset.src; s.removeAttribute('data-src'); });
            if (!v.dataset.loaded) { v.load(); v.dataset.loaded = 1; }
            var p = v.play(); if (p && p.catch) p.catch(function () {});
          } else if (v.dataset.loaded) v.pause();
        });
      }, { rootMargin: '300px 0px' });
      io.observe(v);
    });
  }

  /* ---------- timeline dots (works without GSAP too) ---------- */
  function timelineDots() {
    var items = $$('.timeline li');
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('is-on'); }); }, { rootMargin: '0px 0px -40% 0px' });
    items.forEach(function (li) { io.observe(li); });
    if (!hasGSAP || reduce) $('#timelineFill').style.transform = 'scaleY(1)';
  }

  /* ---------- form ---------- */
  function form() {
    var f = $('#applyForm'), msg = $('#applyMsg');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var name = $('#aName'), phone = $('#aPhone'), email = $('#aEmail'), prog = $('#aProg');
      [[name, name.value.trim().length > 1], [phone, /^[6-9]\d{9}$/.test(phone.value.replace(/\D/g, '').slice(-10))], [prog, !!prog.value], [email, !email.value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)]].forEach(function (p) {
        p[0].closest('.afield').classList.toggle('is-bad', !p[1]); if (!p[1]) ok = false;
      });
      msg.className = 'aform__msg afield--full';
      if (!ok) { msg.textContent = 'Please check the highlighted fields.'; msg.classList.add('err'); return; }
      // TODO: send to your CRM / admissions endpoint.
      msg.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. Our admissions team will call you within one working day.';
      msg.classList.add('ok'); f.reset();
    });
    $$('input, select', f).forEach(function (el) { el.addEventListener('input', function () { el.closest('.afield').classList.remove('is-bad'); }); });
  }

  /* ---------- GSAP motion ---------- */
  function motion() {
    gsap.registerPlugin(ScrollTrigger);
    gsap.ticker.lagSmoothing(0);

    // Hero
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.hero .lines .line > span', { y: 0, filter: 'blur(0px)', duration: 1.5, stagger: .12 })
      .to('.hero .reveal-fade', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, stagger: .08 }, '-=1.1')
      .to('.hero .mask-up', { clipPath: 'inset(0% 0 0 0 round 30px)', duration: 1.6, stagger: .15, ease: 'expo.inOut' }, '-=1.3')
      .add(function () { $$('.hero [data-roll]').forEach(rollIn); }, '-=.8');
    gsap.to('.arch--hero img', { scale: 1.15, yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.hero__media', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.hero__film', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.hero__media', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Headings: masked lines with blur
    $$('.lines').forEach(function (el) {
      if (el.closest('.hero')) return;
      gsap.to(el.querySelectorAll('.line > span'), { y: 0, filter: 'blur(0px)', duration: 1.3, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
    });
    ScrollTrigger.batch('.reveal-rise', { start: 'top 90%', once: true, onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: 1.1, stagger: .1, ease: 'expo.out' }); } });
    $$('.mask-up').forEach(function (el) {
      if (el.closest('.hero')) return;
      gsap.to(el, { clipPath: 'inset(0% 0 0 0 round 30px)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 85%' } });
    });

    // Manifesto words fill on scroll
    var mws = $$('.mw');
    ScrollTrigger.create({
      trigger: '.manifesto', start: 'top 70%', end: 'bottom 60%', scrub: true,
      onUpdate: function (self) {
        var n = Math.round(self.progress * mws.length);
        mws.forEach(function (w, i) { w.style.opacity = i < n ? 1 : .16; });
      }
    });

    // Film: pill mask opens to full frame
    gsap.fromTo('#filmFrame', { clipPath: 'inset(10% 14% 10% 14% round 400px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 32px)', ease: 'none',
      scrollTrigger: { trigger: '#film', start: 'top 85%', end: 'top 10%', scrub: true }
    });
    gsap.from('#filmFrame video', { scale: 1.25, ease: 'none', scrollTrigger: { trigger: '#film', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Stacked cards: earlier cards recede as later ones arrive
    var cards = $$('.scard');
    cards.forEach(function (card, i) {
      if (i === cards.length - 1) return;
      gsap.to(card, {
        scale: .94 - (cards.length - i) * .01, filter: 'brightness(.82)', ease: 'none',
        scrollTrigger: { trigger: cards[i + 1], start: 'top 70%', end: 'top 20%', scrub: true }
      });
    });

    // Timeline line draw
    gsap.to('#timelineFill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#timeline', start: 'top 70%', end: 'bottom 60%', scrub: true } });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }
})();
