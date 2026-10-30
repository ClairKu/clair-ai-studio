(function (global) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const COLORS = ['#087f8c', '#193b64', '#d48835', '#6a62a6', '#589275', '#b35e71'];
  const activeCharts = new WeakMap();
  let nextId = 0;

  function node(tag, attributes, text) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes || {})) el.setAttribute(key, String(value));
    if (text !== undefined) el.textContent = String(text);
    return el;
  }

  function svgNode(tag, attributes, text) {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attributes || {})) el.setAttribute(key, String(value));
    if (text !== undefined) el.textContent = String(text);
    return el;
  }

  function target(el) {
    const found = typeof el === 'string' ? document.querySelector(el) : el;
    if (!found || found.nodeType !== 1) throw new TypeError('A chart container element is required.');
    return found;
  }

  function number(value) {
    if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function color(value, fallback) {
    return typeof value === 'string' && /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\))$/i.test(value) ? value : fallback;
  }

  function format(value, formatter) {
    if (value === null) return '暂无数据';
    if (typeof formatter === 'function') {
      try { return String(formatter(value)); } catch (_) { /* Use a readable fallback. */ }
    }
    return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(value);
  }

  function label(row, key) {
    const value = row && row[key];
    return value === null || value === undefined ? '—' : String(value);
  }

  function axisLabel(value, formatter) {
    if (typeof formatter === 'function') {
      try { return String(formatter(value)); } catch (_) { /* Preserve the original label. */ }
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(5, 10).replace('-', '/');
    return value.length > 12 ? value.slice(0, 11) + '…' : value;
  }

  function scaleRange(values) {
    let min = values.reduce((lowest, value) => Math.min(lowest, value), 0);
    let max = values.reduce((highest, value) => Math.max(highest, value), 0);
    if (min === max) max = min + 1;
    const raw = (max - min) / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    const fraction = raw / magnitude;
    const step = (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10) * magnitude;
    min = Math.floor(min / step) * step;
    max = Math.ceil(max / step) * step;
    return { min, max, step };
  }

  function setup(el, opts) {
    const host = target(el);
    const previous = activeCharts.get(host);
    if (previous) previous.destroy();
    host.replaceChildren();
    host.classList.add('sg-chart');
    const wrapper = node('div', { class: 'sg-chart-inner' });
    const heading = node('div', { class: 'sg-chart-heading' });
    if (opts.title) heading.append(node('h3', { class: 'sg-chart-title' }, opts.title));
    if (opts.subtitle) heading.append(node('p', { class: 'sg-chart-subtitle' }, opts.subtitle));
    const controls = node('div', { class: 'sg-chart-controls' });
    const canvas = node('div', { class: 'sg-chart-canvas' });
    const tooltip = node('div', { class: 'sg-chart-tooltip', role: 'status', 'aria-live': 'polite' });
    tooltip.hidden = true;
    wrapper.append(heading, controls, canvas, tooltip);
    host.append(wrapper);
    return { host, wrapper, controls, canvas, tooltip };
  }

  function empty(canvas, message) {
    canvas.replaceChildren(node('div', { class: 'sg-chart-empty', role: 'status' }, message || '当前范围暂无可绘制数据'));
  }

  function tooltipContent(tooltip, title, items) {
    tooltip.replaceChildren(node('strong', {}, title));
    for (const item of items) {
      const line = node('div', { class: 'sg-chart-tooltip-row' });
      const swatch = node('span', { class: 'sg-chart-dot' });
      swatch.style.backgroundColor = item.color;
      line.append(swatch, node('span', {}, item.label), node('b', {}, item.value));
      tooltip.append(line);
    }
    tooltip.hidden = false;
  }

  function positionTooltip(state, clientX, clientY) {
    const bounds = state.wrapper.getBoundingClientRect();
    const width = state.tooltip.offsetWidth || 200;
    const height = state.tooltip.offsetHeight || 90;
    const x = Math.max(8, Math.min(bounds.width - width - 8, clientX - bounds.left + 14));
    const y = Math.max(8, Math.min(bounds.height - height - 8, clientY - bounds.top - height - 10));
    state.tooltip.style.left = x + 'px';
    state.tooltip.style.top = y + 'px';
  }

  function mountSvg(state, width, height, title, description) {
    const id = 'sg-chart-' + (++nextId);
    const svg = svgNode('svg', { viewBox: '0 0 ' + width + ' ' + height, role: 'img', 'aria-labelledby': id + '-title ' + id + '-desc', class: 'sg-chart-svg' });
    svg.append(svgNode('title', { id: id + '-title' }, title || '数据图表'));
    svg.append(svgNode('desc', { id: id + '-desc' }, description || '数据点可用 Tab 键聚焦查看。'));
    state.canvas.replaceChildren(svg);
    return svg;
  }

  function safeRows(rows) {
    return Array.isArray(rows) ? rows.filter(row => row && typeof row === 'object' && !Array.isArray(row)) : [];
  }

  function line(el, initialRows, initialSeries, options) {
    const opts = Object.assign({ xKey: 'date', mode: 'line', height: 290, allowToggle: true }, options || {});
    const state = setup(el, opts);
    let rows = safeRows(initialRows);
    let series = [];
    let mode = opts.type === 'bar' || opts.mode === 'bar' ? 'bar' : 'line';
    let disposed = false;
    let lastWidth = 0;
    let observer;
    let frame;
    const hidden = new Set();

    function setSeries(input) {
      series = (Array.isArray(input) ? input : []).map((item, index) => {
        const definition = typeof item === 'string' ? { key: item, label: item } : (item || {});
        return { key: String(definition.key || ''), label: String(definition.label || definition.key || ''), color: color(definition.color, COLORS[index % COLORS.length]) };
      }).filter(item => item.key);
    }

    function controls() {
      state.controls.replaceChildren();
      const legend = node('div', { class: 'sg-chart-legend', 'aria-label': '图例' });
      series.forEach(item => {
        const button = node('button', { type: 'button', class: 'sg-chart-legend-item', 'aria-pressed': String(!hidden.has(item.key)) });
        const dot = node('span', { class: 'sg-chart-dot' });
        dot.style.backgroundColor = item.color;
        button.append(dot, node('span', {}, item.label));
        button.addEventListener('click', () => {
          if (hidden.has(item.key)) hidden.delete(item.key); else hidden.add(item.key);
          controls(); draw();
        });
        legend.append(button);
      });
      state.controls.append(legend);
      if (opts.allowToggle !== false) {
        const toggle = node('div', { class: 'sg-chart-toggle', role: 'group', 'aria-label': '图表类型' });
        [['line', '折线'], ['bar', '柱图']].forEach(([kind, name]) => {
          const button = node('button', { type: 'button', 'aria-pressed': String(mode === kind) }, name);
          button.addEventListener('click', () => { mode = kind; controls(); draw(); });
          toggle.append(button);
        });
        state.controls.append(toggle);
      }
    }

    function draw() {
      if (disposed) return;
      state.tooltip.hidden = true;
      const shown = series.filter(item => !hidden.has(item.key));
      const values = rows.flatMap(row => shown.map(item => number(row[item.key]))).filter(value => value !== null);
      if (!rows.length || !shown.length || !values.length) { empty(state.canvas, !shown.length && series.length ? '点击图例选择需要查看的指标' : opts.emptyText); return; }
      const width = Math.max(300, Math.round(state.host.getBoundingClientRect().width || 760));
      lastWidth = width;
      const height = Math.max(220, Number(opts.height) || 290);
      const margin = { top: 16, right: 18, bottom: 42, left: width < 450 ? 58 : 72 };
      const plotWidth = width - margin.left - margin.right;
      const plotHeight = height - margin.top - margin.bottom;
      const range = scaleRange(values);
      const y = value => margin.top + (range.max - value) / (range.max - range.min) * plotHeight;
      const slot = plotWidth / Math.max(rows.length, 1);
      const x = index => margin.left + slot * (index + 0.5);
      const svg = mountSvg(state, width, height, opts.title, opts.description || rows.length + ' 个数据点；' + shown.map(item => item.label).join('、') + '。Tab 键可逐点查看，空值不连线。');
      const grid = svgNode('g', { class: 'sg-chart-grid' });
      let tickCount = 0;
      for (let tick = range.min; tick <= range.max + range.step / 100 && tickCount < 12; tick += range.step, tickCount++) {
        grid.append(svgNode('line', { x1: margin.left, x2: width - margin.right, y1: y(tick), y2: y(tick) }));
        grid.append(svgNode('text', { x: margin.left - 10, y: y(tick) + 4, 'text-anchor': 'end' }, format(Math.abs(tick) < range.step / 100 ? 0 : tick, opts.axisFormatter || opts.valueFormatter)));
      }
      svg.append(grid);
      (Array.isArray(opts.annotations) ? opts.annotations : []).forEach(annotation => {
        const index = rows.findIndex(row => label(row, opts.xKey) === String(annotation.date || ''));
        if (index < 0) return;
        const markerColor = color(annotation.color, '#a87537');
        const marker = svgNode('g', { class: 'sg-chart-annotation' });
        marker.append(svgNode('line', { x1: x(index), x2: x(index), y1: margin.top, y2: height - margin.bottom, stroke: markerColor, 'stroke-dasharray': '4 4', 'stroke-width': 1 }));
        marker.append(svgNode('text', { x: Math.min(width - margin.right, Math.max(margin.left, x(index) - 5)), y: margin.top + 9, 'text-anchor': x(index) > width * .65 ? 'end' : 'start', fill: markerColor, 'font-size': 9 }, annotation.label || annotation.date));
        svg.append(marker);
      });
      if (opts.yLabel) svg.append(svgNode('text', { x: margin.left, y: 11, class: 'sg-chart-unit' }, opts.yLabel));
      const maxLabels = Math.max(2, Math.floor(plotWidth / 65));
      const step = Math.max(1, Math.ceil(rows.length / maxLabels));
      const labelIndices = [];
      for (let index = 0; index < rows.length; index += step) labelIndices.push(index);
      if (rows.length > 1 && labelIndices[labelIndices.length - 1] !== rows.length - 1) {
        const last = labelIndices[labelIndices.length - 1];
        if (x(rows.length - 1) - x(last) < 60) labelIndices.pop();
        labelIndices.push(rows.length - 1);
      }
      labelIndices.forEach(index => svg.append(svgNode('text', { x: x(index), y: height - 14, 'text-anchor': 'middle', class: 'sg-chart-axis' }, axisLabel(label(rows[index], opts.xKey), opts.xFormatter))));
      const marks = svgNode('g');
      shown.forEach((item, seriesIndex) => {
        if (mode === 'line') {
          let path = '';
          let connected = false;
          rows.forEach((row, index) => {
            const value = number(row[item.key]);
            if (value === null) { connected = false; return; }
            path += (connected ? 'L' : 'M') + x(index).toFixed(2) + ',' + y(value).toFixed(2) + ' ';
            connected = true;
          });
          marks.append(svgNode('path', { d: path, fill: 'none', stroke: item.color, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
          rows.forEach((row, index) => {
            const value = number(row[item.key]);
            if (value !== null) marks.append(svgNode('circle', { cx: x(index), cy: y(value), r: rows.length > 70 ? 1.5 : 3, fill: item.color, stroke: 'white', 'stroke-width': 1 }));
          });
        } else {
          const groupWidth = Math.min(62, slot * 0.78);
          const barWidth = groupWidth / shown.length;
          rows.forEach((row, index) => {
            const value = number(row[item.key]);
            if (value === null) return;
            const bar = svgNode('rect', { x: x(index) - groupWidth / 2 + seriesIndex * barWidth + 0.5, y: Math.min(y(0), y(value)), width: Math.max(0.5, barWidth - 1), height: Math.max(value === 0 ? 1 : 0, Math.abs(y(value) - y(0))), rx: Math.min(2, barWidth / 4), fill: item.color });
            bar.append(svgNode('title', {}, label(row, opts.xKey) + ' · ' + item.label + '：' + format(value, opts.valueFormatter)));
            marks.append(bar);
          });
        }
      });
      svg.append(marks);
      const cursor = svgNode('line', { y1: margin.top, y2: height - margin.bottom, stroke: '#627990', 'stroke-dasharray': '4 4', opacity: 0 });
      svg.append(cursor);
      function show(index, clientX, clientY) {
        const row = rows[index];
        cursor.setAttribute('x1', x(index)); cursor.setAttribute('x2', x(index)); cursor.setAttribute('opacity', '0.6');
        tooltipContent(state.tooltip, label(row, opts.xKey), shown.map(item => ({ label: item.label, color: item.color, value: format(number(row[item.key]), opts.valueFormatter) })));
        positionTooltip(state, clientX, clientY);
      }
      const hitArea = svgNode('g', { class: 'sg-chart-hit-areas' });
      rows.forEach((row, index) => {
        const details = label(row, opts.xKey) + '；' + shown.map(item => item.label + '：' + format(number(row[item.key]), opts.valueFormatter)).join('；');
        const hit = svgNode('rect', { x: x(index) - slot / 2, y: margin.top, width: slot, height: plotHeight, fill: 'transparent', tabindex: '0', role: 'img', 'aria-label': details });
        hit.append(svgNode('title', {}, details));
        hit.addEventListener('pointermove', event => show(index, event.clientX, event.clientY));
        hit.addEventListener('focus', () => {
          const bounds = hit.getBoundingClientRect();
          show(index, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        });
        hit.addEventListener('keydown', event => {
          const next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : -1;
          if (next >= 0 && next < rows.length) { event.preventDefault(); hitArea.children[next].focus(); }
          if (event.key === 'Escape') { state.tooltip.hidden = true; cursor.setAttribute('opacity', '0'); }
        });
        hitArea.append(hit);
      });
      svg.append(hitArea);
      svg.addEventListener('pointerleave', () => { state.tooltip.hidden = true; cursor.setAttribute('opacity', '0'); });
      svg.addEventListener('focusout', event => { if (!svg.contains(event.relatedTarget)) { state.tooltip.hidden = true; cursor.setAttribute('opacity', '0'); } });
    }

    setSeries(initialSeries);
    controls(); draw();
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(() => {
        if (Math.abs(state.host.getBoundingClientRect().width - lastWidth) < 1) return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(draw);
      });
      observer.observe(state.host);
    }
    const controller = {
      update(nextRows, nextSeries) { rows = safeRows(nextRows); if (nextSeries) setSeries(nextSeries); controls(); draw(); },
      setMode(nextMode) { mode = nextMode === 'bar' ? 'bar' : 'line'; controls(); draw(); },
      destroy() { disposed = true; if (observer) observer.disconnect(); cancelAnimationFrame(frame); state.host.replaceChildren(); activeCharts.delete(state.host); }
    };
    activeCharts.set(state.host, controller);
    return controller;
  }

  function bars(el, initialRows, labelKey, valueKey, options) {
    const opts = Object.assign({ title: '', maxRows: 20, color: COLORS[0] }, options || {});
    const state = setup(el, opts);
    let rows = safeRows(initialRows);
    let disposed = false;
    let lastWidth = 0;
    let observer;
    let frame;
    function draw() {
      if (disposed) return;
      state.tooltip.hidden = true;
      const candidates = rows.map(row => ({ row, value: number(row[valueKey]) })).filter(item => item.value !== null);
      if (opts.sort !== false) candidates.sort((a, b) => b.value - a.value);
      const visible = candidates.slice(0, Math.max(1, Number(opts.maxRows) || 20));
      if (!visible.length) { empty(state.canvas, opts.emptyText); return; }
      const width = Math.max(300, Math.round(state.host.getBoundingClientRect().width || 600));
      lastWidth = width;
      const rowHeight = 45;
      const height = visible.length * rowHeight + 8;
      const range = scaleRange(visible.map(item => item.value));
      const x = value => 3 + (value - range.min) / (range.max - range.min) * (width - 6);
      const svg = mountSvg(state, width, height, opts.title || '数据排名', opts.description || visible.length + ' 项数据。Tab 键可逐项查看。');
      visible.forEach((item, index) => {
        const name = label(item.row, labelKey);
        const valueText = format(item.value, opts.valueFormatter);
        const rowColor = color(typeof opts.color === 'function' ? opts.color(item.row, index) : opts.color, COLORS[0]);
        const row = svgNode('g', { class: 'sg-bar-svg-item', tabindex: '0', role: 'img', 'aria-label': name + '：' + valueText });
        const top = 17 + index * rowHeight;
        const maxLabelLength = Math.max(8, Math.floor((width - 100) / 12));
        const shortName = name.length > maxLabelLength ? name.slice(0, maxLabelLength - 1) + '…' : name;
        row.append(svgNode('title', {}, name + '：' + valueText));
        row.append(svgNode('text', { x: 3, y: top, class: 'sg-bar-svg-label' }, shortName));
        row.append(svgNode('text', { x: width - 3, y: top, 'text-anchor': 'end', class: 'sg-bar-svg-value' }, valueText));
        row.append(svgNode('rect', { x: 3, y: top + 8, width: width - 6, height: 7, rx: 3.5, fill: '#edf3f5' }));
        row.append(svgNode('rect', { x: Math.min(x(0), x(item.value)), y: top + 8, width: Math.max(item.value === 0 ? 0 : 1, Math.abs(x(item.value) - x(0))), height: 7, rx: 3.5, fill: rowColor }));
        if (range.min < 0) row.append(svgNode('line', { x1: x(0), x2: x(0), y1: top + 5, y2: top + 18, stroke: '#879ba9', 'stroke-width': 1 }));
        function show(clientX, clientY) {
          tooltipContent(state.tooltip, name, [{ label: opts.valueLabel || '数值', color: rowColor, value: valueText }]);
          positionTooltip(state, clientX, clientY);
        }
        row.addEventListener('pointermove', event => show(event.clientX, event.clientY));
        row.addEventListener('focus', () => { const bounds = row.getBoundingClientRect(); show(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2); });
        row.addEventListener('keydown', event => {
          if (event.key === 'Escape') state.tooltip.hidden = true;
          const next = event.key === 'ArrowDown' ? index + 1 : event.key === 'ArrowUp' ? index - 1 : -1;
          if (next >= 0 && next < visible.length) { event.preventDefault(); svg.querySelectorAll('.sg-bar-svg-item')[next].focus(); }
        });
        svg.append(row);
      });
      svg.addEventListener('pointerleave', () => { state.tooltip.hidden = true; });
      svg.addEventListener('focusout', event => { if (!svg.contains(event.relatedTarget)) state.tooltip.hidden = true; });
      if (candidates.length > visible.length) state.canvas.append(node('p', { class: 'sg-chart-subtitle' }, '显示前 ' + visible.length + ' 项，共 ' + candidates.length + ' 项'));
    }
    draw();
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(() => {
        if (Math.abs(state.host.getBoundingClientRect().width - lastWidth) < 1) return;
        cancelAnimationFrame(frame); frame = requestAnimationFrame(draw);
      });
      observer.observe(state.host);
    }
    const controller = {
      update(nextRows) { rows = safeRows(nextRows); draw(); },
      destroy() { disposed = true; if (observer) observer.disconnect(); cancelAnimationFrame(frame); state.host.replaceChildren(); activeCharts.delete(state.host); }
    };
    activeCharts.set(state.host, controller);
    return controller;
  }

  global.StargateCharts = Object.freeze({ line, bars });
})(typeof window !== 'undefined' ? window : globalThis);
