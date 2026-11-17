/* Sisaz demo · variant 2 («شب اجرا»): header, menu, reveals, bill accordion, dock, form. Nothing is sent anywhere. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.add('js');

  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hasIO = 'IntersectionObserver' in window;
  function one(s, c) { return (c || d).querySelector(s); }
  function all(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  // Persian (۰-۹) and Arabic-Indic (٠-٩) digits -> Latin, for validation only.
  function digits(s) {
    return s.replace(/[۰-۹]/g, function (c) { return c.charCodeAt(0) - 1776; })
      .replace(/[٠-٩]/g, function (c) { return c.charCodeAt(0) - 1632; });
  }

  /* ----- Header: glass background after 24px of scroll ----- */
  var hdr = one('#hdr');
  function onScroll() { hdr.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----- Mobile menu (full-screen overlay below 900px) ----- */
  var burger = one('.burger'), nav = one('#nav');
  function isOpen() { return burger.getAttribute('aria-expanded') === 'true'; }
  function setNav(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('is-open', open);
    root.classList.toggle('nav-open', open);
    // Keep Tab inside the overlay while it is open.
    all('main, footer, #dock').forEach(function (el) { el.inert = open; });
  }
  burger.addEventListener('click', function () { setNav(!isOpen()); });
  d.addEventListener('click', function (e) {
    // A link click, or a click on the empty overlay area / outside, closes the menu.
    if (isOpen() && !e.target.closest('.burger') && (e.target.closest('.nav a') || !e.target.closest('.nav li'))) setNav(false);
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) { setNav(false); burger.focus(); }
  });
  if (window.matchMedia) {
    matchMedia('(min-width: 900px)').addEventListener('change', function (e) { if (e.matches) setNav(false); });
  }

  /* ----- Scroll reveal: the hidden state is added here, so nothing is lost without JS ----- */
  var steps = one('.steps');
  if (hasIO && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    all('.sec-head, .facts li, .row, .ticket, .stage__h, .reel, .follow, .faq details, .card, .contact').forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      var i = Array.prototype.indexOf.call(el.parentNode.children, el) % 4;
      el.style.setProperty('--d', (i * 0.08) + 's');
      el.classList.add('rv');
      io.observe(el);
    });
    // Path: the line draws and the nodes fill once the section is reached.
    if (steps && steps.getBoundingClientRect().top > window.innerHeight * 0.6) {
      steps.classList.add('pre');
      new IntersectionObserver(function (es, ob) {
        if (es[0].isIntersecting) { steps.classList.remove('pre'); ob.disconnect(); }
      }, { threshold: 0.35 }).observe(steps);
    }
  }

  /* ----- Lineup: single-open accordion, first row open ----- */
  var rows = all('.bill .row:not(.row--ask)');
  var btns = rows.map(function (r) { return one('.row__b', r); });
  function setRow(r, open) {
    r.classList.toggle('is-open', open);
    one('.row__b', r).setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  rows.forEach(function (r, i) {
    btns[i].addEventListener('click', function () {
      var was = r.classList.contains('is-open');
      rows.forEach(function (x) { setRow(x, false); });
      setRow(r, !was);
    });
    btns[i].addEventListener('keydown', function (e) {
      var n = btns.length, to = -1;
      if (e.key === 'ArrowDown') to = (i + 1) % n;
      else if (e.key === 'ArrowUp') to = (i + n - 1) % n;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = n - 1;
      if (to > -1) { e.preventDefault(); btns[to].focus(); }
    });
  });

  /* ----- "Book for <instrument>": preselect, scroll to the form, focus the name ----- */
  var reg = one('#register'), sel = one('#f-instrument'), nameEl = one('#f-name');
  all('[data-ins]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      sel.value = a.getAttribute('data-ins');
      if (sel.value) { sel.removeAttribute('aria-invalid'); one('#f-instrument-err').textContent = ''; }
      reg.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      nameEl.focus({ preventScroll: true });
    });
  });

  /* ----- Mobile dock: after the hero, hidden while #register is on screen ----- */
  var dock = one('#dock'), hero = one('#top');
  if (dock && hero && reg && hasIO) {
    var heroSeen = true, regSeen = false;
    var upd = function () { dock.classList.toggle('is-visible', !heroSeen && !regSeen); };
    new IntersectionObserver(function (es) { heroSeen = es[es.length - 1].isIntersecting; upd(); }).observe(hero);
    new IntersectionObserver(function (es) { regSeen = es[es.length - 1].isIntersecting; upd(); }, { rootMargin: '0px 0px -25% 0px' }).observe(reg);
  }

  /* ----- Current section in the nav ----- */
  if (hasIO) {
    var links = all('.nav a');
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'lineup', 'path', 'stage', 'faq', 'register', 'foot'].forEach(function (id) {
      var el = d.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ----- Registration form (demo only: nothing leaves the page) ----- */
  var form = one('#reg-form'), card = one('#form-card'), done = one('#reg-done'), again = one('#reg-reset');
  if (!form) return;
  var rules = [
    { id: 'f-name', check: function (v) {
      v = v.trim();
      if (!v) return 'نام و نام خانوادگی را وارد کنید.';
      if (v.length < 2) return 'نام باید حداقل ۲ حرف باشد.';
      return '';
    } },
    { id: 'f-phone', check: function (v) {
      var s = digits(v).replace(/[\s\-\u200c]/g, '');
      if (!s) return 'شماره موبایل را وارد کنید.';
      if (!/^09\d{9}$/.test(s)) return 'شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود. مثال: ۰۹۱۲۳۴۵۶۷۸۹';
      return '';
    } },
    { id: 'f-instrument', check: function (v) { return v ? '' : 'ساز مورد علاقه را انتخاب کنید.'; } },
    { id: 'f-age', check: function (v) { return v ? '' : 'رده سنی را انتخاب کنید.'; } }
  ];

  function validate(rule) {
    var input = d.getElementById(rule.id), err = d.getElementById(rule.id + '-err');
    var msg = rule.check(input.value);
    err.textContent = msg;
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    return msg === '';
  }

  rules.forEach(function (rule) {
    var input = d.getElementById(rule.id);
    // Re-check live only once a field has been flagged, so typing is not nagged early.
    var recheck = function () { if (input.getAttribute('aria-invalid') === 'true') validate(rule); };
    input.addEventListener('input', recheck);
    input.addEventListener('change', recheck);
    input.addEventListener('blur', function () { if (input.value) validate(rule); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    rules.forEach(function (rule) {
      if (!validate(rule) && !firstBad) firstBad = d.getElementById(rule.id);
    });
    if (firstBad) { firstBad.focus(); return; }
    card.style.minHeight = card.offsetHeight + 'px'; // keep the card height so the page does not jump
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });

  again.addEventListener('click', function () {
    form.reset();
    rules.forEach(function (rule) {
      d.getElementById(rule.id + '-err').textContent = '';
      d.getElementById(rule.id).removeAttribute('aria-invalid');
    });
    done.hidden = true;
    card.style.minHeight = '';
    form.hidden = false;
    nameEl.focus();
  });
})();
