/* One-shot metric reveals. The underlying accessible values always stay final. */
(function () {
  'use strict';
  const root = document.documentElement;
  const elements = Array.from(document.querySelectorAll('[data-counter]'));
  if (!elements.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let formatter;
  try { formatter = new Intl.NumberFormat('en-US', {maximumFractionDigits:0}); }
  catch (_) { formatter = {format:value => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}; }
  const records = elements.map((element, index) => ({
    element,
    current: element.querySelector('.lf-counter-current'),
    finalNumber: element.dataset.counterNumber,
    target: Number(element.dataset.counter),
    duration: 1320,
    delay: (index % 4) * 60,
    visible: false,
    started: false,
    done: false,
    startAt: null,
    last: null
  })).filter(record => record.current && record.finalNumber &&
    Number.isFinite(record.target) && record.target >= 0);
  const byElement = new Map(records.map(record => [record.element, record]));
  const active = new Set();
  let frame = 0;
  const motionOn = () => root.dataset.motion === 'on' && !reduced.matches;
  function stopWhenIdle() {
    if (!active.size && frame) cancelAnimationFrame(frame);
    if (!active.size) frame = 0;
  }
  function finish(record) {
    record.current.textContent = record.finalNumber;
    record.done = true;
    record.element.dataset.counterState = 'done';
    active.delete(record);
    stopWhenIdle();
  }
  function finishAll() { records.forEach(finish); }
  function finishActive() { Array.from(active).forEach(finish); }
  function tick(now) {
    frame = 0;
    if (!motionOn()) { finishAll(); return; }
    if (document.hidden) { finishActive(); return; }
    for (const record of active) {
      if (!record.visible) { finish(record); continue; }
      if (record.startAt === null) record.startAt = now + record.delay;
      const t = Math.max(0, Math.min(1, (now - record.startAt) / record.duration));
      const value = Math.min(record.target, Math.round(record.target * (1 - Math.pow(1 - t, 3))));
      if (value !== record.last) {
        record.current.textContent = formatter.format(value);
        record.last = value;
      }
      if (t >= 1) finish(record);
    }
    if (active.size) frame = requestAnimationFrame(tick);
  }
  function start(record) {
    if (record.done || record.started || !record.visible || document.hidden) return;
    if (!motionOn()) { finish(record); return; }
    record.started = true;
    record.element.dataset.counterState = 'running';
    record.current.textContent = '0';
    record.last = 0;
    active.add(record);
    if (!frame) frame = requestAnimationFrame(tick);
  }
  function syncPreference() {
    if (!motionOn()) { finishAll(); return; }
    if (document.hidden) { finishActive(); return; }
    records.forEach(record => { if (record.visible && !record.done) start(record); });
  }
  records.forEach(record => {record.element.dataset.counterState = 'pending';});
  if (!('IntersectionObserver' in window)) { finishAll(); return; }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const record = byElement.get(entry.target);
      if (!record) return;
      record.visible = entry.isIntersecting && entry.intersectionRatio >= .6;
      if (record.visible) start(record);
      else if (record.started && !record.done) finish(record);
    });
  }, {threshold:[0,.6], rootMargin:'0px 0px -32px 0px'});
  records.forEach(record => observer.observe(record.element));
  window.addEventListener('lightfieldmotionchange', syncPreference);
  document.addEventListener('visibilitychange', syncPreference);
  window.addEventListener('beforeprint', finishAll);
  window.addEventListener('pagehide', finishActive);
  if (reduced.addEventListener) reduced.addEventListener('change', syncPreference);
  else reduced.addListener(syncPreference);
  new MutationObserver(syncPreference).observe(root, {attributes:true, attributeFilter:['data-motion']});
  syncPreference();
})();
