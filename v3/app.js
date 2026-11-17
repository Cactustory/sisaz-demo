/* Sisaz v3 «پوستر»: header, menu, age tabs, prefill, dock, forms, reveal. Nothing is sent anywhere. */
(() => {
  'use strict';
  const d = document;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const latin = s => s.replace(/[۰-۹]/g, c => c.charCodeAt(0) - 1776).replace(/[٠-٩]/g, c => c.charCodeAt(0) - 1632);

  /* ----- Header: ink underline bar after 24px of scroll ----- */
  const hd = $('#hd');
  const onScroll = () => hd.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----- Mobile menu ----- */
  const bg = $('.bg'), nav = $('#nav');
  const isOpen = () => bg.getAttribute('aria-expanded') === 'true';
  const setMenu = on => { bg.setAttribute('aria-expanded', String(on)); nav.classList.toggle('is-open', on); };
  bg.addEventListener('click', () => setMenu(!isOpen()));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  d.addEventListener('click', e => { if (isOpen() && !hd.contains(e.target)) setMenu(false); });
  d.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) { setMenu(false); bg.focus(); } });
  matchMedia('(min-width:900px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* ----- Age tabs (WAI-ARIA tabs, RTL-aware arrows) ----- */
  const tabs = $$('[role=tab]');
  const panels = tabs.map(t => d.getElementById(t.getAttribute('aria-controls')));
  const pick = (i, focus) => {
    tabs.forEach((t, j) => {
      t.setAttribute('aria-selected', String(i === j));
      t.tabIndex = i === j ? 0 : -1;
      panels[j].hidden = i !== j;
      if (i === j) panels[j].classList.add('is-new'); // pop-in only after a real switch
    });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(i));
    t.addEventListener('keydown', e => {
      const rtl = getComputedStyle(t.parentNode).direction === 'rtl';
      let n;
      if (e.key === 'ArrowRight') n = i + (rtl ? -1 : 1);
      else if (e.key === 'ArrowLeft') n = i + (rtl ? 1 : -1);
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      else return;
      e.preventDefault();
      pick((n + tabs.length) % tabs.length, true);
    });
  });

  /* ----- Pre-fill the register form from a card / chip ----- */
  const reg = $('#register'), fName = $('#f-name'), fInst = $('#f-instrument'), fAge = $('#f-age');
  const setSel = (sel, text) => {
    const o = [...sel.options].find(x => x.text === text);
    sel.value = o ? o.value : '';
    sel.dispatchEvent(new Event('change'));
  };
  d.addEventListener('click', e => {
    const a = e.target.closest('a.pf');
    if (!a) return;
    e.preventDefault();
    const card = a.closest('.ic'), panel = a.closest('[role=tabpanel]');
    setSel(fInst, (card ? $('h3', card) : a).textContent.trim());
    if (panel) setSel(fAge, panel.dataset.age);
    reg.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    fName.focus({ preventScroll: true });
  });

  /* ----- Mobile dock: after the hero, hidden while #register is on screen ----- */
  const dock = $('#dock'), hero = $('#top');
  if (dock && 'IntersectionObserver' in window) {
    let heroSeen = true, regSeen = false;
    const up = () => dock.classList.toggle('is-on', !heroSeen && !regSeen);
    new IntersectionObserver(es => { heroSeen = es[es.length - 1].isIntersecting; up(); }).observe(hero);
    new IntersectionObserver(es => { regSeen = es[es.length - 1].isIntersecting; up(); }, { rootMargin: '0px 0px -25% 0px' }).observe(reg);
  }

  /* ----- Reels strip: a tab stop only while it actually scrolls ----- */
  const rs = $('.reels');
  const fit = () => { rs.tabIndex = rs.scrollWidth > rs.clientWidth + 1 ? 0 : -1; };
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(rs);
  fit();
  // the strip scrolls sideways, where native lazy-loading would only fire on swipe: start the images when the strip is near
  if ('IntersectionObserver' in window) {
    const pre = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      $$('img', rs).forEach(i => { i.loading = 'eager'; });
      pre.disconnect();
    }, { rootMargin: '700px 0px' });
    pre.observe(rs);
  }

  /* ----- Forms: Persian validation, demo-only success state ----- */
  const rules = {
    name: v => { v = v.trim(); return !v ? 'نام را وارد کنید.' : v.length < 2 ? 'نام باید دست‌کم ۲ حرف باشد.' : ''; },
    phone: v => {
      const n = latin(v).replace(/[\s‌-]/g, '');
      return !n ? 'شماره‌ی موبایل را وارد کنید.'
        : /^09\d{9}$/.test(n) ? '' : 'شماره‌ی موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود. مثال: ۰۹۱۲۳۴۵۶۷۸۹';
    },
    need: msg => v => (v ? '' : msg)
  };
  const show = (id, msg) => {
    const el = d.getElementById(id), out = d.getElementById(id + '-err');
    out.textContent = msg;
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    return !msg;
  };
  const bind = (form, fields, ok) => {
    const run = f => show(f[0], f[1](d.getElementById(f[0]).value));
    fields.forEach(f => {
      const el = d.getElementById(f[0]);
      // re-check live only once a field has been flagged, so typing is not nagged early
      const again = () => { if (el.getAttribute('aria-invalid') === 'true') run(f); };
      el.addEventListener('input', again);
      el.addEventListener('change', again);
      el.addEventListener('blur', () => { if (el.value) run(f); });
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      let bad = null;
      fields.forEach(f => { if (!run(f) && !bad) bad = d.getElementById(f[0]); });
      if (bad) bad.focus(); else ok();
    });
    return () => fields.forEach(f => show(f[0], ''));
  };

  // hero form: phone only
  const hf = $('#hero-form'), hDone = $('#h-done');
  bind(hf, [['h-phone', rules.phone]], () => { hf.hidden = true; hDone.hidden = false; hDone.focus(); });
  $('#h-reset').addEventListener('click', () => { hf.reset(); hf.hidden = false; hDone.hidden = true; $('#h-phone').focus(); });

  // main form
  const rf = $('#reg-form'), card = $('#fc'), rDone = $('#reg-done');
  const clear = bind(rf, [
    ['f-name', rules.name],
    ['f-phone', rules.phone],
    ['f-instrument', rules.need('ساز مورد علاقه را انتخاب کنید.')],
    ['f-age', rules.need('رده‌ی سنی را انتخاب کنید.')]
  ], () => {
    card.style.minHeight = card.offsetHeight + 'px'; // keep the card height so the page does not jump
    rf.hidden = true; rDone.hidden = false; rDone.focus();
  });
  $('#reg-reset').addEventListener('click', () => {
    rf.reset(); clear();
    card.style.minHeight = '';
    rDone.hidden = true; rf.hidden = false; fName.focus();
  });

  /* ----- Scroll reveal: classes are added by JS only, and only below the fold ----- */
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      io.unobserve(el);
      el.classList.add('rv-in');
      setTimeout(() => el.classList.remove('rv', 'rv-in'), 1200);
    }), { rootMargin: '0px 0px -8% 0px' });
    const seen = new Map();
    $$('.band:not(.hero) h2, .nc, .sp, .qa, .tk, .reel, .fol, .fc, .cc, .why .pol').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) return;
      const n = seen.get(el.parentNode) || 0;
      seen.set(el.parentNode, n + 1);
      el.style.setProperty('--i', Math.min(n, 4));
      el.classList.add('rv');
      io.observe(el);
    });
    // keyboard focus must never land on a half-faded element
    d.addEventListener('focusin', e => { const el = e.target.closest('.rv'); if (el) el.classList.add('rv-now'); });
  }
})();
