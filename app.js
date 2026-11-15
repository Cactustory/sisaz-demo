/* Sisaz demo: header, hero motion, reveals, mobile bar, form validation. Nothing is sent anywhere. */
(function () {
  'use strict';
  var root = document.documentElement;
  // Set synchronously (script is in <head>) so JS-only hidden states never flash.
  root.classList.add('js');

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* ----- Hero animation starts once fonts are in (1.2s fallback) ----- */
  var started = false;
  function start() {
    if (started) return;
    started = true;
    root.classList.add('is-ready');
  }
  var fallback = setTimeout(start, 1200);
  if (document.fonts && document.fonts.load) {
    Promise.all([
      document.fonts.load('700 48px "Noto Nastaliq Urdu"', 'اینجا قصه'),
      document.fonts.load('900 20px Vazirmatn', 'سی‌ساز'),
      document.fonts.load('400 17px Vazirmatn', 'آموزش')
    ]).then(function () { return document.fonts.ready; })
      .then(function () { clearTimeout(fallback); start(); }, start);
  } else {
    start();
  }

  // Persian (۰-۹) and Arabic-Indic (٠-٩) digits -> Latin, for validation only.
  function toLatinDigits(s) {
    return s
      .replace(/[۰-۹]/g, function (c) { return c.charCodeAt(0) - 0x06F0; })
      .replace(/[٠-٩]/g, function (c) { return c.charCodeAt(0) - 0x0660; });
  }

  ready(function () {
    /* ----- Sticky header: paper background after 24px ----- */
    var header = document.getElementById('site-header');
    if (header) {
      var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 24); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* ----- Mobile nav ----- */
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (toggle && nav) {
      var setOpen = function (open) {
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        nav.classList.toggle('is-open', open);
      };
      toggle.addEventListener('click', function () {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
      });
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) setOpen(false);
      });
      document.addEventListener('click', function (e) {
        if (toggle.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
          setOpen(false);
          toggle.focus();
        }
      });
    }

    /* ----- Reveal on scroll (once) ----- */
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    }

    /* ----- Mobile action bar: after the hero, hidden while #register is on screen ----- */
    var dock = document.getElementById('dock');
    var hero = document.getElementById('top');
    var register = document.getElementById('register');
    if (dock && hero && register && 'IntersectionObserver' in window) {
      var heroSeen = true, regSeen = false;
      var update = function () { dock.classList.toggle('is-visible', !heroSeen && !regSeen); };
      new IntersectionObserver(function (entries) {
        heroSeen = entries[entries.length - 1].isIntersecting;
        update();
      }).observe(hero);
      new IntersectionObserver(function (entries) {
        regSeen = entries[entries.length - 1].isIntersecting;
        update();
      }, { rootMargin: '0px 0px -25% 0px' }).observe(register);
    }

    /* ----- Registration form ----- */
    var form = document.getElementById('reg-form');
    if (!form) return;
    var card = document.getElementById('form-card');
    var status = document.getElementById('reg-status');
    var reset = document.getElementById('reg-reset');

    var rules = [
      { id: 'f-name', check: function (v) {
        v = v.trim();
        if (!v) return 'نام و نام خانوادگی را وارد کنید.';
        if (v.split(/\s+/).length < 2) return 'نام و نام خانوادگی را کامل بنویسید.';
        return '';
      } },
      { id: 'f-phone', check: function (v) {
        var d = toLatinDigits(v).replace(/[\s\-‌]/g, '');
        if (!d) return 'شماره موبایل را وارد کنید.';
        if (!/^09\d{9}$/.test(d)) return 'شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود. مثال: ۰۹۱۲۳۴۵۶۷۸۹';
        return '';
      } },
      { id: 'f-instrument', check: function (v) { return v ? '' : 'ساز مورد علاقه را انتخاب کنید.'; } },
      { id: 'f-age', check: function (v) { return v ? '' : 'رده سنی را انتخاب کنید.'; } }
    ];

    function validate(rule) {
      var input = document.getElementById(rule.id);
      var err = document.getElementById(rule.id + '-err');
      var msg = rule.check(input.value);
      err.textContent = msg;
      if (msg) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
      return msg === '';
    }

    rules.forEach(function (rule) {
      var input = document.getElementById(rule.id);
      // Re-check live only once a field has been flagged, so typing isn't nagged early.
      var recheck = function () { if (input.getAttribute('aria-invalid') === 'true') validate(rule); };
      input.addEventListener('input', recheck);
      input.addEventListener('change', recheck);
      input.addEventListener('blur', function () { if (input.value) validate(rule); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      rules.forEach(function (rule) {
        if (!validate(rule) && !firstBad) firstBad = document.getElementById(rule.id);
      });
      if (firstBad) { firstBad.focus(); return; }
      // Keep the card's height so the page doesn't jump when the form is replaced.
      card.style.minHeight = card.offsetHeight + 'px';
      card.classList.add('is-done');
      form.hidden = true;
      status.textContent = 'درخواست شما ثبت شد. برای هماهنگی تماس می‌گیریم.';
      reset.hidden = false;
      status.focus();
    });

    reset.addEventListener('click', function () {
      form.reset();
      rules.forEach(function (rule) {
        document.getElementById(rule.id + '-err').textContent = '';
        document.getElementById(rule.id).removeAttribute('aria-invalid');
      });
      status.textContent = '';
      reset.hidden = true;
      card.classList.remove('is-done');
      card.style.minHeight = '';
      form.hidden = false;
      document.getElementById('f-name').focus();
    });
  });
})();
