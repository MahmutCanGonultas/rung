/* Rung · tema anahtarı — iki sayfa da bunu kullanır.
   Üç durum: "auto" (işletim sistemi ne diyorsa), "light", "dark".
   Seçim localStorage'da tutulur; sayfa yenilenince kaybolmaz. */
(function () {
  'use strict';

  var KEY = 'rung-theme';
  var order = ['auto', 'light', 'dark'];
  var glyph = { auto: '◐', light: '☀', dark: '☾' };
  var name  = { auto: 'sistem', light: 'açık', dark: 'koyu' };

  function read() {
    try { var v = localStorage.getItem(KEY); return order.indexOf(v) > -1 ? v : 'auto'; }
    catch (e) { return 'auto'; }
  }

  function apply(mode) {
    if (mode === 'auto') { document.documentElement.removeAttribute('data-theme'); }
    else { document.documentElement.setAttribute('data-theme', mode); }
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    var btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.querySelector('.glyph').textContent = glyph[mode];
      btn.querySelector('.name').textContent = name[mode];
      btn.setAttribute('aria-label', 'Tema: ' + name[mode] + '. Değiştirmek için tıkla.');
    }
    document.dispatchEvent(new CustomEvent('rung:theme', { detail: { mode: mode } }));
  }

  /* Yanıp sönmeyi önlemek için attribute'u DOM hazır olmadan koy. */
  var current = read();
  if (current !== 'auto') { document.documentElement.setAttribute('data-theme', current); }

  function init() {
    var btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        current = order[(order.indexOf(current) + 1) % order.length];
        apply(current);
      });
    }
    apply(current);

    /* Sistem teması değişirse ve kullanıcı "auto"daysa grafikleri tazele. */
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () { if (current === 'auto') { apply('auto'); } };
      if (mq.addEventListener) { mq.addEventListener('change', onChange); }
      else if (mq.addListener) { mq.addListener(onChange); }
    }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
}());
