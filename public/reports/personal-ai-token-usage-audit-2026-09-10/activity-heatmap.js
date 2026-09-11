(() => {
  const svg = document.getElementById('activityHeatmap');
  if (!svg || typeof DATA === 'undefined' || typeof state === 'undefined') return;
  const hmNode = (tag, attrs = {}) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };
  const hmCompact = value => {
    const x = Number(value || 0);
    if (x >= 1e9) return (x / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
    if (x >= 1e6) return (x / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (x >= 1e3) return (x / 1e3).toFixed(0) + 'K';
    return Math.round(x).toLocaleString('zh-CN');
  };
  const hmColor = ratio => {
    if (ratio <= 0) return '#f0f3f6';
    if (ratio < .12) return '#dceeff';
    if (ratio < .28) return '#b8dcff';
    if (ratio < .5) return '#82bdf5';
    if (ratio < .72) return '#4b99e6';
    if (ratio < .9) return '#2578c9';
    return '#155aa6';
  };
  const hmValue = row => [...state.selected].reduce((sum, key) => sum + Number(row[key] || 0), 0);
  const hmRows = () => DATA.daily.filter(row => row.day >= state.start && row.day <= state.end);
  function hmStats(rows) {
    const values = rows.map(row => ({ ...row, value: hmValue(row) }));
    const observed = values.filter(row => row.observable !== false);
    const peak = observed.reduce((best, row) => row.value > best.value ? row : best, { day: '—', value: 0 });
    let run = 0;
    let longest = 0;
    observed.forEach(row => {
      run = row.value > 0 ? run + 1 : 0;
      longest = Math.max(longest, run);
    });
    let current = 0;
    for (let i = observed.length - 1; i >= 0 && observed[i].value > 0; i -= 1) current += 1;
    return {
      values,
      peak,
      total: observed.reduce((sum, row) => sum + row.value, 0),
      active: observed.filter(row => row.value > 0).length,
      current,
      longest,
    };
  }
  function hmTooltip(event, html) {
    const tip = document.getElementById('tooltip');
    tip.innerHTML = html;
    tip.style.display = 'block';
    tip.style.left = Math.min(innerWidth - 275, event.clientX + 12) + 'px';
    tip.style.top = Math.max(8, event.clientY - 48) + 'px';
  }
  function hmHide() {
    document.getElementById('tooltip').style.display = 'none';
  }
  function hmDraw() {
    const stats = hmStats(hmRows());
    const selectedNames = DATA.platforms.filter(platform => state.selected.has(platform.key)).map(platform => platform.name);
    document.getElementById('heatmapTotal').textContent = hmCompact(stats.total);
    document.getElementById('heatmapPeak').textContent = stats.peak.day === '—' ? '—' : stats.peak.day.slice(5) + ' · ' + hmCompact(stats.peak.value);
    document.getElementById('heatmapActive').textContent = stats.active + ' 天';
    document.getElementById('heatmapCurrent').textContent = stats.current + ' 天';
    document.getElementById('heatmapLongest').textContent = stats.longest + ' 天';
    document.getElementById('heatmapCaption').textContent = (selectedNames.length ? selectedNames.join(' + ') : '未选择平台') + ' · ' + state.start + '—' + state.end;
    const allButton = document.getElementById('selectAllPlatforms');
    allButton.classList.toggle('active', state.selected.size === DATA.platforms.length);

    svg.innerHTML = '';
    const width = Math.max(340, svg.clientWidth || 1000);
    const left = width < 560 ? 30 : 48;
    const right = 12;
    const top = 32;
    const height = 205;
    const firstOffset = stats.values.length ? (new Date(stats.values[0].day + 'T00:00:00Z').getUTCDay() + 6) % 7 : 0;
    const weeks = Math.max(1, Math.ceil((firstOffset + stats.values.length) / 7));
    const step = Math.max(5, Math.min(19, (width - left - right) / weeks));
    const cell = Math.max(3, step - Math.max(2, step * .18));
    const gridWidth = weeks * step;
    const startX = left + Math.max(0, (width - left - right - gridWidth) / 2);
    const max = Math.max(1, ...stats.values.filter(row => row.observable !== false).map(row => row.value));
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

    const defs = hmNode('defs');
    const pattern = hmNode('pattern', { id: 'unknownPattern', width: 6, height: 6, patternUnits: 'userSpaceOnUse' });
    pattern.append(hmNode('rect', { width: 6, height: 6, fill: '#e5ebf1' }));
    pattern.append(hmNode('path', { d: 'M0,6 L6,0', stroke: '#cbd5df', 'stroke-width': 1 }));
    defs.append(pattern);
    svg.append(defs);

    if (step >= 10) {
      [['一', 0], ['三', 2], ['五', 4], ['日', 6]].forEach(([label, row]) => {
        const text = hmNode('text', { x: startX - 8, y: top + row * step + cell * .72, 'text-anchor': 'end' });
        text.textContent = label;
        svg.append(text);
      });
    }

    let lastMonthWeek = -9;
    stats.values.forEach((row, index) => {
      const slot = firstOffset + index;
      const week = Math.floor(slot / 7);
      const weekday = slot % 7;
      const fill = row.observable === false ? 'url(#unknownPattern)' : hmColor(row.value / max);
      const rect = hmNode('rect', { x: startX + week * step, y: top + weekday * step, width: cell, height: cell, rx: Math.max(1, cell * .2), fill });
      rect.addEventListener('mousemove', event => hmTooltip(event, '<strong>' + row.day + '</strong><br>' + (row.observable === false ? '本机无留存记录' : Number(row.value).toLocaleString('zh-CN') + ' Token')));
      rect.addEventListener('mouseleave', hmHide);
      svg.append(rect);
      if ((index === 0 || row.day.slice(8) === '01') && week - lastMonthWeek >= 3) {
        const label = hmNode('text', { x: startX + week * step, y: 18 });
        label.textContent = row.day.slice(5, 7) + '月';
        svg.append(label);
        lastMonthWeek = week;
      }
    });

    const legendX = Math.max(startX, width - 222);
    const legendY = top + 7 * step + 22;
    const less = hmNode('text', { x: legendX, y: legendY + 10 });
    less.textContent = '少';
    svg.append(less);
    [0, .12, .28, .5, .72, 1].forEach((ratio, index) => svg.append(hmNode('rect', { x: legendX + 22 + index * 21, y: legendY, width: 15, height: 15, rx: 3, fill: hmColor(ratio) })));
    const more = hmNode('text', { x: legendX + 154, y: legendY + 10 });
    more.textContent = '多';
    svg.append(more);
    const unknown = hmNode('rect', { x: legendX + 180, y: legendY, width: 15, height: 15, rx: 3, fill: 'url(#unknownPattern)' });
    svg.append(unknown);
    const unknownLabel = hmNode('text', { x: legendX + 200, y: legendY + 10 });
    unknownLabel.textContent = '无留存';
    svg.append(unknownLabel);
  }

  document.querySelectorAll('[data-preset], #startDate, #endDate, #platformChecks input').forEach(control => {
    control.addEventListener('click', () => setTimeout(hmDraw, 0));
    control.addEventListener('change', () => setTimeout(hmDraw, 0));
  });
  document.getElementById('selectAllPlatforms').addEventListener('click', () => {
    document.querySelectorAll('#platformChecks input').forEach(input => { input.checked = true; state.selected.add(input.value); });
    draw();
    hmDraw();
  });
  let hmResizeTimer;
  addEventListener('resize', () => { clearTimeout(hmResizeTimer); hmResizeTimer = setTimeout(hmDraw, 60); });
  hmDraw();
})();
