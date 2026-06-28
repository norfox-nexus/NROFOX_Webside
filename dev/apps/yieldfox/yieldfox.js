// YieldFOX.js — Web port of PlotMe_v06 (MATLAB)
// Tensile test analysis: open file, plot σ-ε, pick elastic region, calc E,
// 0.2% offset Yield, UTS, elongation.

(() => {
  // ---------- State ----------
  const S = {
    settings: {
        area: 200,              // mm²
      areaBackup: 200,        // restore when switching back from stress input
      startLine: 6,           // header lines to skip
      strainCol: 4,           // 1-based
      forceCol: 3,            // 1-based
      decimalSep: 'auto',     // 'auto' | 'dot' | 'comma'
      strainUnit: 'percent',  // 'percent' | 'mm/mm' | 'microstrain'
      inputType: 'stress',    // 'force' | 'stress'
      curveType: 'engineering', // 'engineering' | 'true'
      theme: 'dark',
      forceScale: 1,          // multiplier applied to raw force values (e.g. 1000 for kN→N)
      advancedMode: true,     // run ReH/ReL · Lüders · PLC · necking detection
    },
    sample: {
      name: '',
      filename: '',
      raw: [],              // 2D array of numbers
      strain: [],           // unitless (e.g. 0.0042)
      stress: [],           // MPa
    },
    results: {
      E: 0,                 // GPa
      yieldStrength: 0,     // MPa
      uts: 0,               // MPa
      elongation: 0,        // %
      eRange: null,         // {x1, x2} in % strain — user-picked elastic range
      yieldType: null,      // 'offset' | 'discontinuous'
      ReH: 0,               // upper yield strength MPa
      ReL: 0,               // lower yield strength MPa
      yieldDrop: 0,         // ReH − ReL MPa
      ludersStart: 0,       // % strain at ReH
      ludersEnd: 0,         // % strain at end of plateau
      ludersStrain: 0,      // Lüders plateau width %
      plc: null,            // { detected, count, avgAmplitude, startStrain, endStrain }
      neckingStrain: 0,     // % strain at necking onset (Considère)
      neckingStress: 0,     // MPa at necking onset
    },
    axes: { xMin: 0, xMax: 12, yMin: 0, yMax: 600, auto: true },
    axesAuto: { xMin: 0, xMax: 12, yMin: 0, yMax: 600 }, // computed from data
    pickMode: false,        // when true, next clicks set elastic-region points
    pickPoints: [],
    interaction: { mode: 'pan', dragging: null, boxStart: null, boxEnd: null },
  };

  const LS_KEY = 'yieldfox_state_v1';

  // ---------- Persistence ----------
  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) Object.assign(S.settings, JSON.parse(raw));
    } catch {}
    syncSettingsToUI();
  }
  function saveState() {
    localStorage.setItem(LS_KEY, JSON.stringify(S.settings));
    log('ok', 'Settings saved');
  }

  // ---------- DOM helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function log(kind, ...msgs) {
    const el = $('#logBox');
    const time = new Date().toTimeString().slice(0, 8);
    const cls = kind === 'ok' ? 'ok' : kind === 'warn' ? 'warn' :
                kind === 'err' ? 'err' : 'info';
    const div = document.createElement('div');
    div.innerHTML = `<span class="dim">[${time}]</span> ` +
      `<span class="${cls}">${kind.toUpperCase()}</span> ` +
      msgs.map(m => String(m)).join(' ');
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  function setStatus(text, busy = false) {
    $('#statusText').textContent = text;
    $('#statusDot').classList.toggle('busy', busy);
  }

  // ---------- File parsing (intelligent) ----------

  // Scan multiple lines to pick the most consistent delimiter
  function detectDelimiterSmart(lines) {
    const sample = lines.filter(l => l.trim().length > 0).slice(0, 40);
    if (!sample.length) return ',';
    let best = null, bestScore = -1;
    for (const d of ['\t', ';', ',']) {
      const counts = sample.map(l => l.split(d).length - 1);
      const max = Math.max(...counts);
      if (max < 1) continue;
      const consistent = counts.filter(c => c === max).length;
      const score = consistent * (max + 1);
      if (score > bestScore) { bestScore = score; best = d; }
    }
    return (best && bestScore >= sample.length * 0.5) ? best : /\s+/;
  }

  function splitByDelim(line, delim) {
    return delim instanceof RegExp ? line.trim().split(delim) : line.split(delim);
  }

  // True if a string looks like a number with dot or comma as decimal
  function fieldLooksNumeric(s) {
    s = s.trim();
    return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s) ||
           /^[+-]?\d+,\d*$/.test(s);
  }

  // Locate the first block of rows with ≥2 numeric columns.
  // Also detect the header row immediately above that block.
  function findDataRegion(lines, delim) {
    let dataStart = -1, headerIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const parts = splitByDelim(line, delim);
      const numCount = parts.filter(p => fieldLooksNumeric(p)).length;
      const total    = parts.filter(p => p.trim().length > 0).length;
      if (numCount >= 2 && total > 0 && numCount / total >= 0.5) {
        if (dataStart === -1) {
          dataStart = i;
          // Search backwards (up to 5 lines) for an all-text header row
          for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
            if (!lines[j].trim()) continue;
            const prev = splitByDelim(lines[j], delim);
            const pNum   = prev.filter(p => fieldLooksNumeric(p)).length;
            const pTotal = prev.filter(p => p.trim().length > 0).length;
            if (pTotal >= 2 && pNum === 0) headerIdx = j;
            break;
          }
        }
      } else if (dataStart !== -1 && line.trim().length > 0) {
        break; // non-numeric line after data block — stop
      }
    }
    const headerParts = headerIdx >= 0
      ? splitByDelim(lines[headerIdx], delim).map(p => p.trim())
      : null;
    return { dataStart: dataStart >= 0 ? dataStart : 0, headerParts };
  }

  // Detect decimal separator from a sample of data lines
  function detectDecimalSep(lines, startLine, delim) {
    if (delim === ',') return 'dot'; // comma is delimiter → dot must be decimal
    let dots = 0, commas = 0;
    for (const ln of lines.slice(startLine, startLine + 40)) {
      for (const p of splitByDelim(ln, delim)) {
        const s = p.trim();
        if (/\d\.\d/.test(s)) dots++;
        if (/\d,\d/.test(s)) commas++;
      }
    }
    return commas > dots ? 'comma' : 'dot';
  }

  // ---------- Column identification from header keywords ----------
  const COL_TYPE_KEYWORDS = {
    strain:    ['strain','eps','epsilon','ε','dehnung','mm/mm','m/m'],
    extension: ['extension','ext','disp','displacement','position','pos','traverse','weg'],
    force:     ['force','load','kraft','kn','fn','fmax','f [','f['],
    stress:    ['stress','sigma','σ','mpa','n/mm'],
    time:      ['time','zeit','temps','t [','t[','sec','second','ms','min['],
  };

  function classifyColumn(text) {
    const s = (text || '').toLowerCase();
    let type = null;
    for (const [t, kws] of Object.entries(COL_TYPE_KEYWORDS)) {
      if (kws.some(k => s.includes(k))) { type = t; break; }
    }
    let unit = null;
    if (/\bkn\b/.test(s))                                         unit = 'kN';
    else if (s.includes('mpa') || s.includes('n/mm'))             unit = 'MPa';
    else if (/\[n\]|\(n\)|\bn\b/.test(s))                         unit = 'N';
    else if (s.includes('mm/mm') || s.includes('m/m'))            unit = 'mm/mm';
    else if (s.includes('µε') || s.includes('με') ||
             s.includes('microstrain'))                            unit = 'microstrain';
    else if (s.includes('%') || s.includes('percent'))            unit = 'percent';
    return { type, unit };
  }

  function identifyColumnsFromHeaders(headerParts, rows) {
    const out = { strainCol: null, forceCol: null, strainUnit: null,
                  inputType: null, forceScale: 1, reasons: [] };
    if (!headerParts || !headerParts.length) return out;
    const cls = headerParts.map(classifyColumn);
    let strainIdx = cls.findIndex(c => c.type === 'strain');
    if (strainIdx < 0) strainIdx = cls.findIndex(c => c.type === 'extension');
    const stressIdx = cls.findIndex(c => c.type === 'stress');
    const forceIdx  = cls.findIndex(c => c.type === 'force');
    if (strainIdx >= 0) {
      out.strainCol = strainIdx + 1;
      const u = cls[strainIdx].unit;
      if      (u === 'percent')     out.strainUnit = 'percent';
      else if (u === 'mm/mm')       out.strainUnit = 'mm/mm';
      else if (u === 'microstrain') out.strainUnit = 'microstrain';
      out.reasons.push(`Strain → col ${strainIdx + 1} "${headerParts[strainIdx]}"`);
    }
    const dataIdx = stressIdx >= 0 ? stressIdx : forceIdx;
    if (dataIdx >= 0) {
      out.forceCol = dataIdx + 1;
      if (stressIdx >= 0) {
        out.inputType = 'stress';
        out.reasons.push(`Stress → col ${dataIdx + 1} "${headerParts[dataIdx]}"`);
      } else {
        out.inputType = 'force';
        if (cls[dataIdx].unit === 'kN') out.forceScale = 1000;
        out.reasons.push(
          `Force → col ${dataIdx + 1} "${headerParts[dataIdx]}"` +
          (out.forceScale === 1000 ? ' (kN→N ×1000)' : ''));
      }
    }
    return out;
  }

  // ---------- Smart text-file parser ----------
  function smartParseText(text) {
    const lines = text.split(/\r?\n/);
    const delim = detectDelimiterSmart(lines);
    const { dataStart, headerParts } = findDataRegion(lines, delim);
    const decSep = detectDecimalSep(lines, dataStart, delim);
    const commaIsDecimal = decSep === 'comma';
    const rowLines = lines.slice(dataStart);
    const endIdx  = rowLines.findIndex(l => !l.trim());
    const used    = endIdx >= 0 ? rowLines.slice(0, endIdx) : rowLines;
    const rows = [];
    for (const ln of used) {
      const parts = splitByDelim(ln, delim);
      const nums  = parts.map(p => {
        let s = p.trim();
        if (commaIsDecimal) s = s.replace(',', '.');
        const n = Number(s);
        return Number.isFinite(n) ? n : NaN;
      });
      if (nums.some(n => Number.isFinite(n))) rows.push(nums);
    }
    const colInfo = identifyColumnsFromHeaders(headerParts, rows);
    return { rows, dataStart, decSep, headerParts, colInfo };
  }

  // ---------- Sample name derivation ----------
  function deriveName(filename) {
    return filename.replace(/\.[^.]+$/, '');
  }

  // ---------- Build strain/stress arrays from raw rows ----------
  function collectColumnStats(rows) {
    const stats = [];
    for (const row of rows) {
      for (let i = 0; i < row.length; i++) {
        const v = row[i];
        if (!Number.isFinite(v)) continue;
        if (!stats[i]) stats[i] = { idx: i, count: 0, min: Infinity, max: -Infinity, sum: 0 };
        const s = stats[i];
        s.count += 1;
        s.min = Math.min(s.min, v);
        s.max = Math.max(s.max, v);
        s.sum += v;
      }
    }
    return stats.filter(Boolean);
  }

  function guessColumns(rows) {
    const stats = collectColumnStats(rows);
    if (stats.length < 2) return null;
    const sorted = stats.slice().sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.max - a.max;
    });
    const first = sorted[0];
    const second = sorted[1];
    const pair = [first, second].slice().sort((a, b) => a.max - b.max);
    return {
      strainCol: pair[0].idx + 1,
      forceCol: pair[1].idx + 1,
      guessed: true,
      reason: `Guessed from ${stats.length} numeric columns`
    };
  }

  function buildStrainStress(rows, overrideStrainCol, overrideForceCol) {
    const sc = (overrideStrainCol != null ? overrideStrainCol : S.settings.strainCol) - 1;
    const fc = (overrideForceCol != null ? overrideForceCol : S.settings.forceCol) - 1;
    const strainFactor = S.settings.strainUnit === 'percent' ? 0.01
                       : S.settings.strainUnit === 'microstrain' ? 1e-6 : 1;
    const fScale = S.settings.forceScale || 1;
    const strain = [], stress = [];
    for (const r of rows) {
      const sV = r[sc], fV = r[fc];
      if (!Number.isFinite(sV) || !Number.isFinite(fV)) continue;
      strain.push(sV * strainFactor);
      stress.push(S.settings.inputType === 'stress' ? fV : (fV * fScale) / S.settings.area);
    }
    if (S.settings.curveType === 'true') {
      for (let i = 0; i < strain.length; i++) {
        const ee = strain[i];
        strain[i] = Math.log(1 + ee);
        stress[i] = stress[i] * (1 + ee);
      }
    }
    return { strain, stress };
  }

  function sampleMetaText(filename) {
    const dataInfo = S.settings.inputType === 'stress'
      ? 'Direct stress' : `${S.settings.area} mm²`;
    const curveInfo = S.settings.curveType === 'true' ? ' · True' : '';
    return `${dataInfo}${curveInfo}  ·  ${filename}`;
  }

  // ---------- Sheet picker ----------
  function pickSheet(wb) {
    const names = wb.SheetNames;
    if (names.length === 1) return Promise.resolve(names[0]);
    return new Promise((resolve, reject) => {
      const SKIP = /^(statistics|summary|overview|results|info|meta|readme)/i;
      const dataSheets = names.filter(n => !SKIP.test(n.trim()));
      let selected = dataSheets.length ? dataSheets[0] : names[0];

      const modal = $('#sheetPickerModal');
      const list  = $('#sheetPickerList');
      list.innerHTML = '';

      function highlight(name) {
        selected = name;
        list.querySelectorAll('.sheet-pick-btn').forEach(b =>
          b.classList.toggle('selected', b.dataset.name === name));
      }

      names.forEach(name => {
        const isSkip = SKIP.test(name.trim());
        const btn = document.createElement('button');
        btn.className = 'sheet-pick-btn' + (isSkip ? ' skip-sheet' : '');
        btn.dataset.name = name;
        btn.textContent = name;
        if (isSkip) {
          const tag = document.createElement('span');
          tag.textContent = 'summary';
          tag.style.cssText = 'font-size:10px;padding:1px 5px;border-radius:3px;background:var(--border);color:var(--text-faint);flex-shrink:0';
          btn.appendChild(tag);
        }
        btn.onclick = () => highlight(name);
        btn.ondblclick = () => { highlight(name); load(); };
        list.appendChild(btn);
      });
      highlight(selected);

      function load() { modal.setAttribute('data-open', 'false'); resolve(selected); }
      function cancel() { modal.setAttribute('data-open', 'false'); reject(new Error('cancelled')); }

      $('#sheetPickerLoad').onclick = load;
      $('#sheetPickerCancel').onclick = cancel;
      $('#sheetPickerClose').onclick = cancel;
      $('#sheetPickerBackdrop').onclick = cancel;
      modal.setAttribute('data-open', 'true');
    });
  }

  // ---------- Excel parsing (intelligent) ----------
  async function parseExcelSmart(file) {
    const buf = await file.arrayBuffer();
    const wb  = window.XLSX.read(buf, { type: 'array' });
    const sheetName = await pickSheet(wb);
    const ws  = wb.Sheets[sheetName];
    const raw = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    // Find where numeric data starts
    let dataStart = -1, headerIdx = -1;
    for (let i = 0; i < raw.length; i++) {
      const row = raw[i];
      if (!row) continue;
      const filled   = row.filter(c => c !== null && c !== '');
      const numCount = filled.filter(c => Number.isFinite(Number(c))).length;
      if (filled.length === 0) continue;
      if (numCount >= 2 && numCount / filled.length >= 0.5) {
        if (dataStart === -1) {
          dataStart = i;
          for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
            const pr = raw[j];
            if (!pr) continue;
            const pf  = pr.filter(c => c !== null && c !== '');
            const pNum = pf.filter(c => Number.isFinite(Number(c))).length;
            if (pf.length >= 2 && pNum === 0) headerIdx = j;
            break;
          }
        }
      } else if (dataStart !== -1 && filled.length > 0) {
        break;
      }
    }
    const headerParts = headerIdx >= 0
      ? raw[headerIdx].map(c => (c == null ? '' : String(c).trim()))
      : null;
    const startRow = dataStart >= 0 ? dataStart : 0;
    const rows = [];
    for (let i = startRow; i < raw.length; i++) {
      const row = raw[i];
      if (!row || row.every(c => c === null || c === '')) break;
      const nums = row.map(c => {
        if (c === null || c === undefined || c === '') return NaN;
        const n = Number(c);
        return Number.isFinite(n) ? n : NaN;
      });
      if (nums.some(n => Number.isFinite(n))) rows.push(nums);
    }
    const colInfo = identifyColumnsFromHeaders(headerParts, rows);
    return { rows, dataStart: startRow, headerParts, colInfo };
  }

  // ---------- Open file ----------
  async function openFile(file) {
    setStatus('Loading…', true);
    try {
      const isExcel = /\.(xlsx|xls)$/i.test(file.name);
      let rows, colInfo, dataStart, headerParts, decSep;

      if (isExcel) {
        if (!window.XLSX) { log('err', 'SheetJS not loaded — check internet connection'); setStatus('Ready'); return; }
        ({ rows, dataStart, headerParts, colInfo } = await parseExcelSmart(file));
      } else {
        const text = await file.text();
        ({ rows, dataStart, headerParts, colInfo, decSep } = smartParseText(text));
      }

      if (!rows.length) {
        log('err', 'No numeric data found — check file format.');
        setStatus('Ready');
        return;
      }

      // Fall back to value-range heuristic when header identification failed
      if (!colInfo.strainCol || !colInfo.forceCol) {
        const guess = guessColumns(rows);
        if (guess) {
          if (!colInfo.strainCol) {
            colInfo.strainCol = guess.strainCol;
            colInfo.reasons.push(`Strain → col ${guess.strainCol} (by value range, no header found)`);
          }
          if (!colInfo.forceCol) {
            colInfo.forceCol = guess.forceCol;
            colInfo.reasons.push(`Force/Stress → col ${guess.forceCol} (by value range, no header found)`);
          }
        }
      }

      if (!colInfo.strainCol || !colInfo.forceCol) {
        log('err', 'Could not identify strain and stress/force columns.');
        setStatus('Ready');
        return;
      }

      // Apply detected settings; only override what was actually detected
      S.settings.strainCol  = colInfo.strainCol;
      S.settings.forceCol   = colInfo.forceCol;
      S.settings.forceScale = colInfo.forceScale || 1;
      if (dataStart != null)    S.settings.startLine  = dataStart;
      if (colInfo.strainUnit)   S.settings.strainUnit = colInfo.strainUnit;
      if (colInfo.inputType)    S.settings.inputType  = colInfo.inputType;
      if (decSep && decSep !== 'auto') S.settings.decimalSep = decSep;
      syncSettingsToUI();

      // Log every detection decision so the user can verify
      if (headerParts && headerParts.some(h => h)) {
        log('info', `Headers: ${headerParts.filter(h => h).join(' | ')}`);
      } else {
        log('warn', 'No column headers found — using value-range heuristic');
      }
      colInfo.reasons.forEach(r => log('info', `  ${r}`));

      let { strain, stress } = buildStrainStress(rows, colInfo.strainCol, colInfo.forceCol);

      if (strain.length < 5) {
        log('err', `Only ${strain.length} valid rows — check columns.`);
        setStatus('Ready');
        return;
      }

      S.sample.filename = file.name;
      S.sample.name     = deriveName(file.name);
      S.sample.raw      = rows;
      S.sample.strain   = strain;
      S.sample.stress   = stress;
      resetResults();
      autoAxes();
      render();
      log('ok', `Loaded ${file.name} (${strain.length} pts)`);
      setStatus(`Ready · ${file.name}`);
      $('#rowCount').textContent = `${strain.length} rows`;
      $('#sampleName').value = S.sample.name;
      $('#sampleMeta').textContent = sampleMetaText(file.name);
      enableAfterLoad(true);
    } catch (e) {
      if (e.message === 'cancelled') { setStatus('Ready'); return; }
      log('err', e.message);
      setStatus('Ready');
    }
  }

  function enableAfterLoad(on) {
    $$('[data-needs-data]').forEach(b => b.disabled = !on);
    $$('.mi-needs-data').forEach(el => el.classList.toggle('mi-disabled', !on));
  }

  function autoAxes() {
    const xs = S.sample.strain.map(v => v * 100);
    const ys = S.sample.stress;
    const xMax = Math.ceil(xs.reduce((a, b) => a > b ? a : b, 0) * 1.05);
    const yMax = Math.ceil(ys.reduce((a, b) => a > b ? a : b, 0) * 1.1 / 50) * 50;
    S.axesAuto = { xMin: 0, xMax, yMin: 0, yMax };
    S.axes = { ...S.axesAuto, auto: true };
    syncAxesToUI();
  }
  function fitAxes() {
    if (!S.sample.strain.length) return;
    autoAxes();
    render();
    log('info', 'Axes auto-fit to data');
  }
  function zoomElastic() {
    if (!S.sample.strain.length) return;
    const step = (S.zoomEStep || 0) % 3;
    S.zoomEStep = step + 1;
    if (step === 2) {
      autoAxes();
      render();
      log('info', 'Axes auto-fit to data');
      return;
    }
    const xLimit = step === 0 ? 1 : 0.5;
    const xs = S.sample.strain.map(v => v * 100);
    const ys = S.sample.stress;
    let yMax = 0;
    for (let i = 0; i < xs.length; i++) {
      if (xs[i] <= xLimit && ys[i] > yMax) yMax = ys[i];
    }
    yMax = Math.ceil((yMax || ys.reduce((a, b) => a > b ? a : b, 0)) * 1.1 / 50) * 50;
    S.axes = { xMin: 0, xMax: xLimit, yMin: 0, yMax, auto: false };
    syncAxesToUI();
    render();
    log('info', `Zoomed to elastic region (0–${xLimit} % strain)`);
  }
  function zoomBy(factor, cx, cy) {
    // Zoom centered on (cx, cy) in data coords. Smaller factor = zoom in.
    const { xMin, xMax, yMin, yMax } = S.axes;
    cx = cx ?? (xMin + xMax) / 2;
    cy = cy ?? (yMin + yMax) / 2;
    S.axes.xMin = cx - (cx - xMin) * factor;
    S.axes.xMax = cx + (xMax - cx) * factor;
    S.axes.yMin = cy - (cy - yMin) * factor;
    S.axes.yMax = cy + (yMax - cy) * factor;
    syncAxesToUI();
    render();
  }

  // ---------- Calculations (port of MATLAB) ----------
  function calcEFromRange(xStartPct, xEndPct) {
    const x1 = xStartPct / 100, x2 = xEndPct / 100;
    const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
    const xs = [], ys = [];
    for (let i = 0; i < S.sample.strain.length; i++) {
      const s = S.sample.strain[i];
      if (s >= lo && s <= hi) { xs.push(s); ys.push(S.sample.stress[i]); }
    }
    if (xs.length < 3) { log('warn', 'Too few points in selected range — widen the selection'); return 0; }
    const fit = linReg(xs, ys);
    if (!fit) { log('warn', 'Linear fit failed — points may be collinear'); return 0; }
    const E_GPa = Math.ceil(fit.slope / 1000);
    S.results.E = E_GPa;
    S.results.eRange = { x1: lo * 100, x2: hi * 100 };
    return E_GPa;
  }

  // ── Signal utilities ────────────────────────────────────────────────────
  function smooth(arr, w) {
    w = w || 7;
    const half = Math.floor(w / 2);
    const out = arr.slice();
    for (let i = half; i < arr.length - half; i++) {
      let s = 0;
      for (let j = -half; j <= half; j++) s += arr[i + j];
      out[i] = s / w;
    }
    return out;
  }

  function derivative(xs, ys) {
    const n = ys.length;
    const d = new Array(n).fill(0);
    for (let i = 1; i < n - 1; i++) {
      const dx = xs[i + 1] - xs[i - 1];
      if (Math.abs(dx) > 1e-14) d[i] = (ys[i + 1] - ys[i - 1]) / dx;
    }
    d[0] = d[1]; d[n - 1] = d[n - 2];
    return d;
  }

  // ── Yield-point phenomenon (ReH / ReL / Lüders) ─────────────────────────
  function detectYieldPoint() {
    const strain = S.sample.strain;
    const stress = S.sample.stress;
    const n = strain.length;

    S.results.yieldType = 'offset';
    S.results.ReH = 0; S.results.ReL = 0; S.results.yieldDrop = 0;
    S.results.ludersStart = 0; S.results.ludersEnd = 0; S.results.ludersStrain = 0;

    if (n < 30 || !S.results.E) return;

    const wSmooth = Math.min(21, Math.floor(n / 50) * 2 + 3);
    const ss = smooth(stress, wSmooth);

    const elasticEndPct = S.results.eRange ? S.results.eRange.x2 : 0.15;
    let startIdx = 0;
    while (startIdx < n - 1 && strain[startIdx] * 100 < elasticEndPct) startIdx++;

    // Find first peak with a significant drop after it
    let reHIdx = -1;
    const scanEnd = Math.min(n - 10, startIdx + 600);
    for (let i = startIdx + 3; i < scanEnd; i++) {
      if (ss[i] <= ss[i - 1] || ss[i] <= ss[i - 2]) continue;
      if (ss[i] <= ss[i + 1] || ss[i] <= ss[i + 2]) continue;

      const lookEnd = Math.min(n, i + 300);
      let minAfter = ss[i];
      for (let j = i + 1; j < lookEnd; j++) {
        if (ss[j] < minAfter) minAfter = ss[j];
        if (ss[j] > ss[i] * 1.01) break;
      }
      if ((ss[i] - minAfter) / ss[i] >= 0.01) { reHIdx = i; break; }
    }
    if (reHIdx < 0) return;

    // Find ReL (minimum after peak)
    let reLIdx = reHIdx + 1, reLVal = ss[reLIdx];
    const searchEnd = Math.min(n - 1, reHIdx + 400);
    for (let i = reHIdx + 1; i <= searchEnd; i++) {
      if (ss[i] < reLVal) { reLVal = ss[i]; reLIdx = i; }
      if (i > reLIdx + 30 && ss[i] > reLVal * 1.03) break;
    }

    const drop = stress[reHIdx] - reLVal;
    if (drop / stress[reHIdx] < 0.008) return;

    // Find end of Lüders plateau (where stress rises consistently above ReL * 1.06)
    const platThresh = reLVal * 1.06;
    let ludersEndIdx = reLIdx;
    for (let i = reLIdx + 1; i < Math.min(n, reLIdx + 800); i++) {
      if (ss[i] <= platThresh) ludersEndIdx = i;
      else if (i > ludersEndIdx + 20) break;
    }

    S.results.yieldType     = 'discontinuous';
    S.results.ReH           = stress[reHIdx];
    S.results.ReL           = reLVal;
    S.results.yieldDrop     = drop;
    S.results.ludersStart   = strain[reHIdx] * 100;
    S.results.ludersEnd     = strain[ludersEndIdx] * 100;
    S.results.ludersStrain  = (strain[ludersEndIdx] - strain[reHIdx]) * 100;
    S.results.yieldStrength = reLVal; // ReL is the design yield for discontinuous curves
  }

  // ── PLC / Portevin-Le Chatelier serration detection ─────────────────────
  function detectPLC() {
    const strain = S.sample.strain;
    const stress = S.sample.stress;
    const n = strain.length;
    S.results.plc = null;
    if (n < 50) return;

    const plasticStartPct = S.results.ludersEnd > 0
      ? S.results.ludersEnd
      : (S.results.eRange ? S.results.eRange.x2 + 0.2 : 0.3);

    let startIdx = 0;
    while (startIdx < n - 1 && strain[startIdx] * 100 < plasticStartPct) startIdx++;
    if (startIdx >= n - 30) return;

    const ss = smooth(stress.slice(startIdx), 3);
    const minAmp = Math.max(0.5, (S.results.uts || 100) * 0.002);

    const serrations = [];
    for (let i = 1; i < ss.length - 2; i++) {
      if (ss[i] <= ss[i - 1] || ss[i] < ss[i + 1]) continue;
      let minVal = ss[i], minI = i;
      for (let j = i + 1; j < Math.min(ss.length, i + 60); j++) {
        if (ss[j] < minVal) { minVal = ss[j]; minI = j; }
        if (j > minI + 10 && ss[j] > ss[i]) break;
      }
      const amp = ss[i] - minVal;
      if (amp >= minAmp && minI > i) {
        serrations.push({ strain: strain[startIdx + i] * 100, amplitude: amp });
        i = minI;
      }
    }
    if (serrations.length < 3) return;

    const avgAmp = serrations.reduce((s, r) => s + r.amplitude, 0) / serrations.length;
    S.results.plc = {
      detected: true,
      count: serrations.length,
      avgAmplitude: avgAmp,
      startStrain: serrations[0].strain,
      endStrain: serrations[serrations.length - 1].strain,
    };
  }

  // ── Necking onset — Considère criterion ─────────────────────────────────
  function calcNecking() {
    const strain = S.sample.strain;
    const stress = S.sample.stress;
    const n = strain.length;
    S.results.neckingStrain = 0; S.results.neckingStress = 0;
    if (n < 20 || !S.results.uts) return;

    const trueE = strain.map(e => Math.log(1 + e));
    const trueS = stress.map((s, i) => s * (1 + strain[i]));
    const smS   = smooth(trueS, Math.min(15, Math.floor(n / 40) + 3));
    const dS    = derivative(trueE, smS);

    const utsIdx = stress.indexOf(S.results.uts);
    const searchEnd = utsIdx > 0 ? utsIdx : n - 2;

    for (let i = Math.max(1, Math.floor(n * 0.1)); i < searchEnd; i++) {
      if (dS[i] > 0 && dS[i] <= trueS[i] && dS[i - 1] > trueS[i - 1]) {
        S.results.neckingStrain = strain[i] * 100;
        S.results.neckingStress = stress[i];
        return;
      }
    }
    // Fallback: necking at UTS in engineering terms
    if (utsIdx >= 0) {
      S.results.neckingStrain = strain[utsIdx] * 100;
      S.results.neckingStress = S.results.uts;
    }
  }

  function calcYieldUTS() {
    const E_MPa = S.results.E * 1000;
    const Strain = S.sample.strain;
    const Stress = S.sample.stress;
    const n = Strain.length;

    const UTS = Stress.reduce((a, b) => a > b ? a : b, -Infinity);
    const elongation = Strain.reduce((a, b) => a > b ? a : b, -Infinity) * 100;
    S.results.uts = UTS;
    S.results.elongation = elongation;

    // Detect yield-point phenomenon when advanced mode is on
    if (S.settings.advancedMode) {
      detectYieldPoint();
    } else {
      S.results.yieldType = 'offset';
    }

    // For continuous (offset) curves: 0.2% proof stress method
    if (S.results.yieldType !== 'discontinuous') {
      const TP = new Array(n);
      for (let i = 0; i < n; i++) TP[i] = Strain[i] - Stress[i] / E_MPa;
      let b1 = -1;
      for (let i = 0; i < n; i++) if (TP[i] >= 0.002) { b1 = i; break; }
      let YS = 0;
      if (b1 > 0) {
        const t = (0.002 - TP[b1 - 1]) / (TP[b1] - TP[b1 - 1]);
        YS = t * (Stress[b1] - Stress[b1 - 1]) + Stress[b1 - 1];
      } else {
        log('warn', 'Yield not found — check E value or data');
      }
      S.results.yieldStrength = YS;
    }
    // Discontinuous: detectYieldPoint already set yieldStrength = ReL

    if (S.settings.advancedMode) { detectPLC(); calcNecking(); }

    const yld = S.results.yieldStrength;
    if (S.results.yieldType === 'discontinuous') {
      log('ok', `ReH = ${S.results.ReH.toFixed(0)} MPa  ·  ReL = ${S.results.ReL.toFixed(0)} MPa  ·  Lüders ε = ${S.results.ludersStrain.toFixed(3)} %  ·  UTS = ${UTS.toFixed(0)} MPa`);
    } else {
      log('ok', `Yield = ${yld.toFixed(0)} MPa  ·  UTS = ${UTS.toFixed(0)} MPa  ·  ε = ${elongation.toFixed(2)} %`);
    }
    return { YS: yld, UTS, elongation };
  }

  function resetResults() {
    S.results = {
      E: 0, yieldStrength: 0, uts: 0, elongation: 0, eRange: null,
      yieldType: null, ReH: 0, ReL: 0, yieldDrop: 0,
      ludersStart: 0, ludersEnd: 0, ludersStrain: 0,
      plc: null, neckingStrain: 0, neckingStress: 0,
    };
    S.zoomEStep = 0;
    S.pickMode = false;
    S.pickPoints = [];
    syncResultsToUI();
  }

  // ---------- Auto E detection ----------
  const MATERIALS = {
    'auto':            { name: 'Auto-detect',            eMin: 10,  eMax: 400, strainMax: 0.005,  r2Min: 0.990 },
    'steel-carbon':    { name: 'Carbon Steel',           eMin: 190, eMax: 215, strainMax: 0.0025, r2Min: 0.998 },
    'steel-stainless': { name: 'Stainless Steel',        eMin: 180, eMax: 210, strainMax: 0.0030, r2Min: 0.997 },
    'al-wrought':      { name: 'Wrought Aluminum',       eMin: 65,  eMax: 75,  strainMax: 0.0030, r2Min: 0.996 },
    'al-cast':         { name: 'Cast Aluminum',          eMin: 60,  eMax: 80,  strainMax: 0.0035, r2Min: 0.993 },
    'mg-alloy':        { name: 'Mg Alloy',               eMin: 40,  eMax: 50,  strainMax: 0.0040, r2Min: 0.990 },
    'ci-gray':         { name: 'Gray Cast Iron',         eMin: 80,  eMax: 140, strainMax: 0.0020, r2Min: 0.980 },
    'ci-ductile':      { name: 'Ductile Iron',           eMin: 160, eMax: 180, strainMax: 0.0025, r2Min: 0.995 },
    'ci-cgi':          { name: 'Compact Graphite Iron',  eMin: 120, eMax: 160, strainMax: 0.0030, r2Min: 0.988 },
  };

  function linReg(xs, ys) {
    const n = xs.length;
    if (n < 3) return null;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
    if (den === 0) return null;
    const slope = num / den;
    const intercept = my - slope * mx;
    let ssTot = 0, ssRes = 0;
    for (let i = 0; i < n; i++) {
      ssTot += (ys[i] - my) ** 2;
      ssRes += (ys[i] - (slope * xs[i] + intercept)) ** 2;
    }
    const r2 = ssTot < 1e-12 ? 1 : 1 - ssRes / ssTot;
    return { slope, intercept, r2 };
  }

  function autoFitE(materialKey) {
    const mat = MATERIALS[materialKey] || MATERIALS['auto'];
    // Collect finite, non-negative pairs and sort by strain
    const pairs = [];
    for (let i = 0; i < S.sample.strain.length; i++) {
      const x = S.sample.strain[i], y = S.sample.stress[i];
      if (Number.isFinite(x) && Number.isFinite(y) && y >= 0) pairs.push([x, y]);
    }
    pairs.sort((a, b) => a[0] - b[0]);
    if (pairs.length < 5) return null;

    // Zero-shift strain so the curve starts at 0
    const xOff = pairs[0][0];
    const xs = pairs.map(p => p[0] - xOff);
    const ys = pairs.map(p => p[1]);
    const totalN = xs.length;

    // Build candidate [lo, hi] windows in strain (decimal)
    // Dense fixed-end windows from origin — fine steps to find exact elastic limit
    const candidates = [];
    for (const hi of [0.00005, 0.0001, 0.00015, 0.0002, 0.00025, 0.0003, 0.0004, 0.0005,
                      0.0006, 0.0007, 0.0008, 0.0009, 0.001, 0.0012, 0.0015, 0.0018,
                      0.002, 0.0025, 0.003, 0.004, 0.005, 0.006, 0.008, 0.01]) {
      if (hi > mat.strainMax * 1.5) break;
      candidates.push([0, hi]);
    }
    // Sliding windows (help for materials with nonlinear initial response, e.g. gray CI)
    for (const w of [0.0003, 0.0005, 0.001, 0.0015, 0.002]) {
      let lo = 0;
      while (lo + w <= mat.strainMax) {
        candidates.push([lo, lo + w]);
        lo += w * 0.5;
      }
    }

    let best = null, bestScore = -Infinity;
    for (const [lo, hi] of candidates) {
      const pxs = [], pys = [];
      for (let i = 0; i < totalN; i++) {
        if (xs[i] >= lo && xs[i] <= hi) { pxs.push(xs[i]); pys.push(ys[i]); }
      }
      if (pxs.length < 4) continue;
      const fit = linReg(pxs, pys);
      if (!fit || fit.r2 <= 0) continue;
      const E_GPa = fit.slope / 1000;
      if (E_GPa < mat.eMin || E_GPa > mat.eMax) continue;
      // R² dominates: r2^20 means 0.9999 vs 0.999 vs 0.990 differ enormously.
      // Size bonus is tiny (0.1) so it only breaks ties, never overrides linearity.
      const score = Math.pow(fit.r2, 20) * (1 + (pxs.length / totalN) * 0.1);
      if (score > bestScore) {
        bestScore = score;
        best = { E_GPa, r2: fit.r2, lo: lo + xOff, hi: hi + xOff, nPts: pxs.length };
      }
    }
    if (!best) return null;
    const confidence = best.r2 >= 0.9995 ? 'HIGH' : best.r2 >= 0.995 ? 'MEDIUM' : 'LOW';
    return { ...best, confidence };
  }

  function openAutoEModal() {
    if (!S.sample.strain.length) { log('warn', 'Open a file first'); return; }
    const modal = $('#autoEModal');
    modal.setAttribute('data-open', 'true');
    $('#autoEResult').style.display = 'none';
    $('#autoEAccept').disabled = true;
    modal._pendingResult = null;
  }

  function runAutoE() {
    const key = $('#autoEMaterial').value;
    const result = autoFitE(key);
    const box = $('#autoEResult');
    if (!result) {
      box.innerHTML = `<div style="color:var(--danger);font-weight:600">No suitable elastic region found.<br>
        Try a different material or use manual Find E.</div>`;
      box.style.display = 'block';
      $('#autoEAccept').disabled = true;
      $('#autoEModal')._pendingResult = null;
      return;
    }
    const confColor = result.confidence === 'HIGH' ? '#22c55e'
                    : result.confidence === 'MEDIUM' ? '#f59e0b' : '#ef4444';
    box.innerHTML = `
      <table class="autoe-table">
        <tr><td>Young's Modulus (E)</td><td><b>${result.E_GPa.toFixed(1)} GPa</b></td></tr>
        <tr><td>Strain interval</td><td>${(result.lo*100).toFixed(3)} – ${(result.hi*100).toFixed(3)} %</td></tr>
        <tr><td>R²</td><td>${result.r2.toFixed(5)}</td></tr>
        <tr><td>Points used</td><td>${result.nPts}</td></tr>
        <tr><td>Confidence</td><td><b style="color:${confColor}">${result.confidence}</b></td></tr>
      </table>`;
    box.style.display = 'block';
    $('#autoEAccept').disabled = false;
    $('#autoEModal')._pendingResult = result;
  }

  function acceptAutoE() {
    const modal = $('#autoEModal');
    const result = modal._pendingResult;
    if (!result) return;
    // Round E to nearest integer GPa (same convention as manual)
    S.results.E = Math.ceil(result.E_GPa);
    S.results.eRange = { x1: result.lo * 100, x2: result.hi * 100 };
    calcYieldUTS();
    log('ok', `Auto E = ${S.results.E} GPa  (${(result.lo*100).toFixed(3)}–${(result.hi*100).toFixed(3)} %, R²=${result.r2.toFixed(4)}, ${result.confidence})`);
    log('ok', `Yield = ${S.results.yieldStrength.toFixed(1)} MPa · UTS = ${S.results.uts.toFixed(1)} MPa · ε_max = ${S.results.elongation.toFixed(2)} %`);
    modal.setAttribute('data-open', 'false');
    render();
  }

  // ---------- UI sync ----------
  function syncSettingsToUI() {
    $('#fArea').value = S.settings.inputType === 'stress' ? 1 : S.settings.area;
    $('#fStart').value = S.settings.startLine;
    $('#fStrain').value = S.settings.strainCol;
    $('#fForce').value = S.settings.forceCol;
    $('#fDecimal').value = S.settings.decimalSep;
    $('#fStrainUnit').value = S.settings.strainUnit;
    $('#fInputType').value = S.settings.inputType;
    $('#fCurveType').value = S.settings.curveType;
    updateAreaVisibility();
    applyTheme(S.settings.theme);
    const advBtn = $('#btnAdvanced');
    if (advBtn) advBtn.classList.toggle('active', !!S.settings.advancedMode);
  }
  function readSettingsFromUI() {
    S.settings.startLine = +$('#fStart').value || 0;
    S.settings.strainCol = +$('#fStrain').value || 1;
    S.settings.forceCol = +$('#fForce').value || 1;
    S.settings.decimalSep = $('#fDecimal').value;
    S.settings.strainUnit = $('#fStrainUnit').value;
    S.settings.inputType = $('#fInputType').value;
    S.settings.curveType = $('#fCurveType').value;
    if (S.settings.inputType === 'stress') {
      if (S.settings.area !== 1) S.settings.areaBackup = S.settings.area;
      S.settings.area = 1;
    } else {
      const rawArea = +$('#fArea').value;
      S.settings.area = rawArea > 0 ? rawArea : (S.settings.areaBackup || 1);
    }
    updateAreaVisibility();
  }
  function updateAreaVisibility() {
    const isStress = S.settings.inputType === 'stress';
    const areaEl = $('#fArea');
    areaEl.disabled = isStress;
    if (isStress) {
      areaEl.value = 1;
    } else {
      areaEl.value = S.settings.area;
    }
    $('#areaRow').style.opacity = isStress ? '0.6' : '1';
    $('#forceColLabel').textContent = isStress ? 'Stress column' : 'Force column';
  }
  function applyTheme(theme) {
    const next = theme === 'light' ? 'light' : 'dark';
    S.settings.theme = next;
    $('#appRoot').dataset.theme = next;
    $('#btnTheme .lbl').textContent = next === 'dark' ? 'Light mode' : 'Dark mode';
  }
  function toggleTheme() {
    applyTheme(S.settings.theme === 'dark' ? 'light' : 'dark');
  }
  function renderDataTable() {
    const rows = S.sample.raw;
    const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const cols = Array.from({ length: maxCols }, (_, i) => i + 1);
    const table = $('#dataTable');
    let html = '<tr><th>#</th>' + cols.map(c => `<th>Col ${c}</th>`).join('') + '</tr>';
    const visibleRows = rows.slice(0, 120);
    for (let ri = 0; ri < visibleRows.length; ri++) {
      const row = visibleRows[ri];
      html += '<tr><td>' + (ri + 1) + '</td>' + cols.map(ci => `<td>${Number.isFinite(row[ci - 1]) ? row[ci - 1] : ''}</td>`).join('') + '</tr>';
    }
    if (rows.length > visibleRows.length) {
      html += `<tr><td colspan="${maxCols + 1}">... ${rows.length - visibleRows.length} more rows</td></tr>`;
    }
    table.innerHTML = html;
  }
  function openDataModal() {
    if (!S.sample.raw.length) { log('warn', 'No data loaded'); return; }
    $('#dataModalSummary').textContent = `Showing first ${Math.min(120, S.sample.raw.length)} rows of ${S.sample.raw.length}.`;
    renderDataTable();
    const modal = $('#dataModal');
    modal.dataset.open = 'true';
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeDataModal() {
    const modal = $('#dataModal');
    modal.dataset.open = 'false';
    modal.setAttribute('aria-hidden', 'true');
  }
  function syncAxesToUI() {
    $('#axXmin').value = S.axes.xMin;
    $('#axXmax').value = S.axes.xMax;
    $('#axYmin').value = S.axes.yMin;
    $('#axYmax').value = S.axes.yMax;
  }
  function readAxesFromUI() {
    S.axes.xMin = +$('#axXmin').value;
    S.axes.xMax = +$('#axXmax').value;
    S.axes.yMin = +$('#axYmin').value;
    S.axes.yMax = +$('#axYmax').value;
  }
  function syncResultsToUI() {
    $('#rE').value = S.results.E || '';
    $('#rU').textContent = fmt(S.results.uts);
    $('#rEl').textContent = fmt(S.results.elongation, 2);

    const disc = S.results.yieldType === 'discontinuous';
    $('#rY').textContent = fmt(S.results.yieldStrength);
    $('#rYLabel').textContent = disc ? 'Yield — ReL (lower)' : 'Yield (0.2 % offset)';

    // Advanced section visibility
    const hasAdv = S.settings.advancedMode &&
      (S.results.yieldType || S.results.neckingStrain > 0 || (S.results.plc && S.results.plc.detected));
    $('#advResults').style.display = hasAdv ? '' : 'none';

    // Discontinuous yield data
    $('#resDiscontinuous').style.display = disc ? '' : 'none';
    if (disc) {
      $('#rReH').textContent = fmt(S.results.ReH);
      $('#rReL').textContent = fmt(S.results.ReL);
      $('#rYieldDrop').textContent = fmt(S.results.yieldDrop);
      $('#rLuders').textContent = fmt(S.results.ludersStrain, 3);
    }

    // PLC
    const plcEl = $('#resPLC');
    const plc = S.results.plc;
    if (plc && plc.detected) {
      plcEl.style.display = '';
      $('#rPLCCount').textContent = plc.count + ' serrations';
      $('#rPLCRange').textContent = `Avg ${fmt(plc.avgAmplitude)} MPa · ${fmt(plc.startStrain, 2)}–${fmt(plc.endStrain, 2)} %`;
    } else {
      plcEl.style.display = 'none';
    }

    // Necking
    const neckEl = $('#resNecking');
    if (S.results.neckingStrain > 0) {
      neckEl.style.display = '';
      $('#rNecking').textContent = fmt(S.results.neckingStrain, 2);
      $('#rNeckingStress').textContent = fmt(S.results.neckingStress);
    } else {
      neckEl.style.display = 'none';
    }
  }
  function fmt(v, d = 1) {
    if (!v || !isFinite(v)) return '—';
    return v.toFixed(d);
  }

  // ---------- Plot rendering ----------
  const PAD = { l: 64, r: 24, t: 24, b: 52 };

  function plotMetrics() {
    const svg = $('#plot');
    const r = svg.getBoundingClientRect();
    const W = r.width, H = r.height;
    return {
      W, H,
      x0: PAD.l, x1: W - PAD.r,
      y0: H - PAD.b, y1: PAD.t,
      sx: (x) => PAD.l + (x - S.axes.xMin) / (S.axes.xMax - S.axes.xMin) * (W - PAD.l - PAD.r),
      sy: (y) => (H - PAD.b) - (y - S.axes.yMin) / (S.axes.yMax - S.axes.yMin) * (H - PAD.t - PAD.b),
      ix: (px) => S.axes.xMin + (px - PAD.l) / (W - PAD.l - PAD.r) * (S.axes.xMax - S.axes.xMin),
      iy: (py) => S.axes.yMin + ((H - PAD.b) - py) / (H - PAD.t - PAD.b) * (S.axes.yMax - S.axes.yMin),
    };
  }

  function niceTicks(min, max, count) {
    const range = max - min;
    const rough = range / count;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const norm = rough / mag;
    let step;
    if (norm < 1.5) step = 1 * mag;
    else if (norm < 3) step = 2 * mag;
    else if (norm < 7) step = 5 * mag;
    else step = 10 * mag;
    const ticks = [];
    const start = Math.ceil(min / step) * step;
    for (let v = start; v <= max + 1e-9; v += step) ticks.push(+v.toFixed(10));
    return ticks;
  }

  function render() {
    const svg = $('#plot');
    const m = plotMetrics();
    const xt = niceTicks(S.axes.xMin, S.axes.xMax, 8);
    const yt = niceTicks(S.axes.yMin, S.axes.yMax, 6);

    let g = '';

    // Plot frame
    g += `<rect x="${m.x0}" y="${m.y1}" width="${m.x1 - m.x0}" height="${m.y0 - m.y1}"
      fill="var(--panel)" stroke="var(--border)" stroke-width="1"/>`;

    // grid
    for (const yv of yt) {
      const py = m.sy(yv);
      g += `<line x1="${m.x0}" x2="${m.x1}" y1="${py}" y2="${py}"
        stroke="var(--grid)" stroke-width="1" stroke-dasharray="2 4"/>`;
      g += `<text x="${m.x0 - 6}" y="${py + 4}" text-anchor="end"
        font-size="11" fill="var(--text-dim)" font-family="Segoe UI">${yv}</text>`;
    }
    for (const xv of xt) {
      const px = m.sx(xv);
      g += `<line x1="${px}" x2="${px}" y1="${m.y1}" y2="${m.y0}"
        stroke="var(--grid)" stroke-width="1" stroke-dasharray="2 4"/>`;
      g += `<text x="${px}" y="${m.y0 + 16}" text-anchor="middle"
        font-size="11" fill="var(--text-dim)" font-family="Segoe UI">${xv}</text>`;
    }

    // axis labels
    const isTrue = S.settings.curveType === 'true';
    const xLabel = isTrue ? 'True Strain εt (%)' : 'Strain ε (%)';
    const yLabel = isTrue ? 'True Stress σt (MPa)' : 'Stress σ (MPa)';
    g += `<text x="${(m.x0 + m.x1) / 2}" y="${m.y0 + 36}" text-anchor="middle"
      font-size="12" fill="var(--text)" font-family="Segoe UI">${xLabel}</text>`;
    g += `<text x="${m.x0 - 46}" y="${(m.y0 + m.y1) / 2}" text-anchor="middle"
      font-size="12" fill="var(--text)" font-family="Segoe UI"
      transform="rotate(-90 ${m.x0 - 46} ${(m.y0 + m.y1) / 2})">${yLabel}</text>`;

    // Picked elastic region highlight
    if (S.results.eRange) {
      const x1 = m.sx(S.results.eRange.x1);
      const x2 = m.sx(S.results.eRange.x2);
      g += `<rect x="${Math.min(x1, x2)}" y="${m.y1}"
        width="${Math.abs(x2 - x1)}" height="${m.y0 - m.y1}"
        fill="var(--accent)" opacity="0.08"/>`;
    }

    // Curve
    if (S.sample.strain.length) {
      let d = '';
      for (let i = 0; i < S.sample.strain.length; i++) {
        const px = m.sx(S.sample.strain[i] * 100);
        const py = m.sy(S.sample.stress[i]);
        d += (i === 0 ? 'M' : 'L') + px.toFixed(1) + ',' + py.toFixed(1) + ' ';
      }
      g += `<path d="${d}" fill="none" stroke="var(--curve)" stroke-width="2"
        stroke-linejoin="round" stroke-linecap="round"/>`;
    }

    // E-fit line + 0.2% offset line
    if (S.results.E > 0) {
      const E_MPa = S.results.E * 1000;
      // E line through origin: y = E * (x/100)
      const eLine = (xPct) => E_MPa * (xPct / 100);
      const xA = S.axes.xMin, xB = Math.min(S.axes.xMax, 2);
      g += `<line x1="${m.sx(xA)}" y1="${m.sy(eLine(xA))}"
        x2="${m.sx(xB)}" y2="${m.sy(eLine(xB))}"
        stroke="var(--curve-2)" stroke-width="1.5" stroke-dasharray="6 4"/>`;

      // 0.2% offset
      const off = (xPct) => E_MPa * ((xPct - 0.2) / 100);
      const ox1 = 0.2, ox2 = Math.min(S.axes.xMax, 3);
      g += `<line x1="${m.sx(ox1)}" y1="${m.sy(off(ox1))}"
        x2="${m.sx(ox2)}" y2="${m.sy(off(ox2))}"
        stroke="var(--text-faint)" stroke-width="1" stroke-dasharray="4 4"/>`;
    }

    // Lüders plateau shading
    if (S.results.yieldType === 'discontinuous' && S.results.ludersStrain > 0) {
      const lx1 = Math.max(m.sx(S.results.ludersStart), m.x0);
      const lx2 = Math.min(m.sx(S.results.ludersEnd),   m.x1);
      if (lx2 > lx1) {
        g += `<rect x="${lx1}" y="${m.y0}" width="${lx2 - lx1}" height="${m.y1 - m.y0}"
          fill="#f97316" fill-opacity="0.07"/>`;
      }
    }

    // PLC region bracket (purple bar above plot)
    if (S.results.plc && S.results.plc.detected) {
      const px1 = Math.max(m.sx(S.results.plc.startStrain), m.x0);
      const px2 = Math.min(m.sx(S.results.plc.endStrain),   m.x1);
      if (px2 > px1) {
        const py = m.y0 - 7;
        g += `<line x1="${px1}" y1="${py}" x2="${px2}" y2="${py}" stroke="#8b5cf6" stroke-width="2.5"/>`;
        g += `<line x1="${px1}" y1="${py - 4}" x2="${px1}" y2="${py + 4}" stroke="#8b5cf6" stroke-width="2"/>`;
        g += `<line x1="${px2}" y1="${py - 4}" x2="${px2}" y2="${py + 4}" stroke="#8b5cf6" stroke-width="2"/>`;
        g += `<text x="${(px1 + px2) / 2}" y="${py - 8}" font-size="10" text-anchor="middle"
          fill="#8b5cf6" font-family="Segoe UI">PLC (${S.results.plc.count})</text>`;
      }
    }

    // Yield markers — discontinuous (ReH + ReL) or standard 0.2% offset
    if (S.results.yieldType === 'discontinuous' && S.results.ReH > 0) {
      // ReH — upper yield point (orange)
      let reHIdx = -1;
      for (let i = 0; i < S.sample.stress.length; i++) {
        if (S.sample.stress[i] >= S.results.ReH * 0.99) { reHIdx = i; break; }
      }
      if (reHIdx >= 0) {
        const cx = m.sx(S.sample.strain[reHIdx] * 100), cy = m.sy(S.results.ReH);
        g += `<circle cx="${cx}" cy="${cy}" r="5" fill="#f97316" stroke="var(--panel)" stroke-width="2"/>`;
        g += `<line x1="${cx}" y1="${cy}" x2="${cx - 40}" y2="${cy - 22}" stroke="var(--text-faint)" stroke-width="1"/>`;
        g += `<text x="${cx - 44}" y="${cy - 20}" font-size="11" text-anchor="end"
          fill="var(--text)" font-family="Segoe UI">ReH  ${S.results.ReH.toFixed(0)} MPa</text>`;
      }
      // ReL — lower yield point (blue)
      if (S.results.ReL > 0) {
        let reLIdx = reHIdx >= 0 ? reHIdx : 0;
        for (let i = reLIdx; i < S.sample.stress.length; i++) {
          if (S.sample.stress[i] <= S.results.ReL * 1.03) { reLIdx = i; break; }
        }
        const cx = m.sx(S.sample.strain[reLIdx] * 100), cy = m.sy(S.results.ReL);
        g += `<circle cx="${cx}" cy="${cy}" r="5" fill="var(--curve)" stroke="var(--panel)" stroke-width="2"/>`;
        g += `<line x1="${cx}" y1="${cy}" x2="${cx + 38}" y2="${cy + 22}" stroke="var(--text-faint)" stroke-width="1"/>`;
        g += `<text x="${cx + 42}" y="${cy + 24}" font-size="11"
          fill="var(--text)" font-family="Segoe UI">ReL  ${S.results.ReL.toFixed(0)} MPa</text>`;
      }
    } else if (S.results.yieldStrength > 0) {
      // Standard 0.2% offset yield marker
      const ys = S.results.yieldStrength;
      let ix = -1;
      for (let i = 0; i < S.sample.stress.length; i++) {
        if (S.sample.stress[i] >= ys) { ix = i; break; }
      }
      if (ix >= 0) {
        const xPct = S.sample.strain[ix] * 100;
        const cx = m.sx(xPct), cy = m.sy(ys);
        g += `<circle cx="${cx}" cy="${cy}" r="5" fill="var(--curve)" stroke="var(--panel)" stroke-width="2"/>`;
        g += `<line x1="${cx}" y1="${cy}" x2="${cx + 40}" y2="${cy - 24}" stroke="var(--text-faint)" stroke-width="1"/>`;
        g += `<text x="${cx + 44}" y="${cy - 22}" font-size="11"
          fill="var(--text)" font-family="Segoe UI">Yield  ${ys.toFixed(0)} MPa</text>`;
      }
    }

    // UTS marker
    if (S.results.uts > 0) {
      const idx = S.sample.stress.indexOf(S.results.uts);
      if (idx >= 0) {
        const cx = m.sx(S.sample.strain[idx] * 100);
        const cy = m.sy(S.results.uts);
        g += `<circle cx="${cx}" cy="${cy}" r="5" fill="var(--curve)" stroke="var(--panel)" stroke-width="2"/>`;
        g += `<text x="${cx + 8}" y="${cy - 8}" font-size="11"
          fill="var(--text)" font-family="Segoe UI">UTS  ${S.results.uts.toFixed(0)} MPa</text>`;
      }
    }

    // Necking onset marker (dashed red circle — only when distinct from UTS)
    if (S.results.neckingStrain > 0 && Math.abs(S.results.neckingStress - S.results.uts) > 1) {
      const cx = m.sx(S.results.neckingStrain);
      const cy = m.sy(S.results.neckingStress);
      if (cx >= m.x0 && cx <= m.x1 && cy >= m.y0 && cy <= m.y1) {
        g += `<circle cx="${cx}" cy="${cy}" r="6" fill="none" stroke="#ef4444"
          stroke-width="1.5" stroke-dasharray="3 2"/>`;
        g += `<text x="${cx + 10}" y="${cy + 4}" font-size="10"
          fill="#ef4444" font-family="Segoe UI">Necking</text>`;
      }
    }

    // Mechanical properties box (top-right inside plot area)
    const hasProps = S.results.yieldStrength > 0 || S.results.uts > 0 || S.results.E > 0;
    if (hasProps) {
      const disc = S.results.yieldType === 'discontinuous';
      const props = [];
      if (S.results.E > 0)             props.push(['E',          `${S.results.E.toFixed(1)} GPa`]);
      if (disc && S.results.ReH > 0)   props.push(['ReH',        `${S.results.ReH.toFixed(0)} MPa`]);
      if (disc && S.results.ReL > 0)   props.push(['ReL',        `${S.results.ReL.toFixed(0)} MPa`]);
      if (!disc && S.results.yieldStrength > 0) props.push(['Yield σ₀.₂', `${S.results.yieldStrength.toFixed(0)} MPa`]);
      if (S.results.uts > 0)           props.push(['UTS',        `${S.results.uts.toFixed(0)} MPa`]);
      if (S.results.elongation > 0)    props.push(['εₘₐˣ',       `${S.results.elongation.toFixed(2)} %`]);
      if (disc && S.results.ludersStrain > 0) props.push(['Lüders ε', `${S.results.ludersStrain.toFixed(3)} %`]);
      const lineH = 18, padX = 10, padY = 8;
      const boxW = 170, boxH = props.length * lineH + padY * 2;
      const bx = m.x1 - boxW - 10;
      const by = m.y0 - boxH - 10;
      g += `<rect x="${bx}" y="${by}" width="${boxW}" height="${boxH}"
        rx="4" fill="var(--panel)" fill-opacity="0.88"
        stroke="var(--border)" stroke-width="1"/>`;
      props.forEach(([label, val], i) => {
        const ty = by + padY + 12 + i * lineH;
        g += `<text x="${bx + padX}" y="${ty}" font-size="11"
          fill="var(--text-dim)" font-family="Segoe UI">${label}</text>`;
        g += `<text x="${bx + boxW - padX}" y="${ty}" text-anchor="end" font-size="11"
          font-weight="600" fill="var(--text)" font-family="Segoe UI">${val}</text>`;
      });
    }

    // Pick mode crosshair lines
    if (S.pickMode && S.pickPoints.length) {
      for (const xPct of S.pickPoints) {
        const px = m.sx(xPct);
        g += `<line x1="${px}" x2="${px}" y1="${m.y1}" y2="${m.y0}"
          stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3"/>`;
      }
    }

    // Box-zoom rubber band
    if (S.interaction.boxStart && S.interaction.boxEnd) {
      const a = S.interaction.boxStart, b = S.interaction.boxEnd;
      const x = Math.min(a.px, b.px), y = Math.min(a.py, b.py);
      const w = Math.abs(b.px - a.px), h = Math.abs(b.py - a.py);
      g += `<rect x="${x}" y="${y}" width="${w}" height="${h}"
        fill="var(--accent)" fill-opacity="0.12"
        stroke="var(--accent)" stroke-width="1" stroke-dasharray="4 3"/>`;
    }

    svg.innerHTML = g;
    syncResultsToUI();
  }

  // ---------- Plot interactions ----------
  function svgPoint(evt) {
    const svg = $('#plot');
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  function onPlotWheel(evt) {
    if (!S.sample.strain.length) return;
    evt.preventDefault();
    const p = svgPoint(evt);
    const m = plotMetrics();
    const cx = m.ix(p.x), cy = m.iy(p.y);
    const factor = evt.deltaY < 0 ? 0.85 : 1.18; // wheel up = zoom in
    zoomBy(factor, cx, cy);
  }
  function onPlotDown(evt) {
    if (!S.sample.strain.length) return;
    if (S.pickMode) return;        // pick mode uses click handler
    const p = svgPoint(evt);
    if (S.interaction.mode === 'box' || evt.shiftKey) {
      S.interaction.boxStart = { px: p.x, py: p.y };
      S.interaction.boxEnd = { px: p.x, py: p.y };
    } else {
      // pan
      const m = plotMetrics();
      S.interaction.dragging = {
        x0: p.x, y0: p.y,
        axes: { ...S.axes },
        m,
      };
      $('#plot').style.cursor = 'grabbing';
    }
  }
  function onPlotMove(evt) {
    if (S.interaction.dragging) {
      const p = svgPoint(evt);
      const d = S.interaction.dragging;
      const dx = (p.x - d.x0) / (d.m.x1 - d.m.x0) * (d.axes.xMax - d.axes.xMin);
      const dy = (p.y - d.y0) / (d.m.y0 - d.m.y1) * (d.axes.yMax - d.axes.yMin);
      S.axes.xMin = d.axes.xMin - dx;
      S.axes.xMax = d.axes.xMax - dx;
      S.axes.yMin = d.axes.yMin + dy;
      S.axes.yMax = d.axes.yMax + dy;
      syncAxesToUI();
      render();
    } else if (S.interaction.boxStart) {
      const p = svgPoint(evt);
      S.interaction.boxEnd = { px: p.x, py: p.y };
      render();
    }
  }
  function onPlotUp(evt) {
    if (S.interaction.dragging) {
      S.interaction.dragging = null;
      $('#plot').style.cursor = '';
    }
    if (S.interaction.boxStart && S.interaction.boxEnd) {
      const a = S.interaction.boxStart, b = S.interaction.boxEnd;
      const m = plotMetrics();
      const x1 = m.ix(a.px), x2 = m.ix(b.px);
      const y1 = m.iy(a.py), y2 = m.iy(b.py);
      if (Math.abs(b.px - a.px) > 6 && Math.abs(b.py - a.py) > 6) {
        S.axes.xMin = Math.min(x1, x2); S.axes.xMax = Math.max(x1, x2);
        S.axes.yMin = Math.min(y1, y2); S.axes.yMax = Math.max(y1, y2);
        syncAxesToUI();
      }
      S.interaction.boxStart = null; S.interaction.boxEnd = null;
      S.interaction.mode = 'pan';
      $('#plot').classList.remove('boxzoom');
      render();
    }
  }

  // ---------- Click on plot to select elastic region ----------
  function onPlotClick(evt) {
    if (!S.pickMode) return;
    const local = svgPoint(evt);
    const m = plotMetrics();
    const xPct = m.ix(local.x);
    S.pickPoints.push(xPct);
    if (S.pickPoints.length === 2) {
      const [a, b] = S.pickPoints;
      const E = calcEFromRange(a, b);
      log('ok', `E-Module = ${E} GPa  (range ${Math.min(a, b).toFixed(2)}–${Math.max(a, b).toFixed(2)} %)`);
      S.pickMode = false;
      $('#plot').classList.remove('picking');
      $('#hintBar').style.display = 'none';
      // automatically compute yield + UTS
      if (E > 0) {
        calcYieldUTS();
        log('ok', `Yield = ${S.results.yieldStrength.toFixed(1)} MPa · UTS = ${S.results.uts.toFixed(1)} MPa · ε_max = ${S.results.elongation.toFixed(2)} %`);
      }
    }
    render();
  }

  function beginPick() {
    if (!S.sample.strain.length) { log('warn', 'Open a file first'); return; }
    S.pickMode = true;
    S.pickPoints = [];
    $('#plot').classList.add('picking');
    $('#hintBar').style.display = 'flex';
    zoomElastic();
    log('info', 'Click 2 points on the plot to define the elastic region');
  }

  // ---------- Save plot as PNG ----------
  function savePlotPng() {
    if (!S.sample.strain.length) { log('warn', 'Nothing to save'); return; }
    const svg = $('#plot');
    const rect = svg.getBoundingClientRect();
    const clone = svg.cloneNode(true);
    const widthPx = Math.round(rect.width);
    const heightPx = Math.round(rect.height);
    clone.setAttribute('width', widthPx);
    clone.setAttribute('height', heightPx);
    clone.setAttribute('viewBox', `0 0 ${widthPx} ${heightPx}`);
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '0');
    bgRect.setAttribute('y', '0');
    bgRect.setAttribute('width', widthPx);
    bgRect.setAttribute('height', heightPx);
    bgRect.setAttribute('fill', '#ffffff');
    clone.insertBefore(bgRect, clone.firstChild);
    let xml = new XMLSerializer().serializeToString(clone);
    // Resolve CSS custom properties — they are unavailable when the SVG is
    // used as an img src outside the document's style context.
    const rootStyle = getComputedStyle(document.documentElement);
    ['--bg','--panel','--panel-2','--border','--border-strong',
     '--text','--text-dim','--text-faint','--accent','--grid',
     '--curve','--curve-2','--danger'].forEach(v => {
      const val = rootStyle.getPropertyValue(v).trim();
      xml = xml.split(`var(${v})`).join(val);
    });
    const svgData = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);

    const img = new Image();
    img.onload = () => {
      const width = 3508; // A4 landscape at 300 DPI
      const height = 2480;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      const aspect = img.width / img.height;
      let dw = width - 120;
      let dh = dw / aspect;
      if (dh > height - 120) {
        dh = height - 120;
        dw = dh * aspect;
      }
      const dx = (width - dw) / 2;
      const dy = (height - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
      canvas.toBlob(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${S.sample.name || 'plot'}-A4-landscape.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, 'image/png');
    };
    img.onerror = () => {
      log('err', 'Unable to render SVG for PNG export.');
    };
    img.src = svgData;
  }

  // ---------- Apply settings update ----------
  function applyUpdate() {
    if (!S.sample.raw.length) return;
    try {
      const prevStrainCol = S.settings.strainCol;
      const prevForceCol = S.settings.forceCol;
      readSettingsFromUI();
      const maxc = Math.max(...S.sample.raw.map(r => r.length));
      let sc = S.settings.strainCol - 1;
      let fc = S.settings.forceCol - 1;
      let guessed = false;
      if (sc >= maxc || fc >= maxc) {
        const guess = guessColumns(S.sample.raw);
        if (guess) {
          guessed = true;
          sc = guess.strainCol - 1;
          fc = guess.forceCol - 1;
          S.settings.strainCol = guess.strainCol;
          S.settings.forceCol = guess.forceCol;
          log('warn', `Selected columns out of range. ${guess.reason}. Using strain=${guess.strainCol}, stress=${guess.forceCol}.`);
        } else {
          // Revert to last known-good columns so other settings (area, unit, curve type) still apply
          S.settings.strainCol = prevStrainCol;
          S.settings.forceCol = prevForceCol;
          sc = prevStrainCol - 1;
          fc = prevForceCol - 1;
          syncSettingsToUI();
          log('err', `Column out of range (data has ${maxc} cols). Reverting to strain=${prevStrainCol}, force=${prevForceCol}.`);
        }
      }
      let { strain, stress } = buildStrainStress(S.sample.raw, sc + 1, fc + 1);
      if (!strain.length || !stress.length || strain.length < 5) {
        const guess = guessColumns(S.sample.raw);
        if (guess) {
          guessed = true;
          sc = guess.strainCol - 1;
          fc = guess.forceCol - 1;
          S.settings.strainCol = guess.strainCol;
          S.settings.forceCol = guess.forceCol;
          log('warn', `No valid rows for selected columns. ${guess.reason}. Using strain=${guess.strainCol}, stress=${guess.forceCol}.`);
          ({ strain, stress } = buildStrainStress(S.sample.raw, sc + 1, fc + 1));
        }
      }
      if (!strain.length || strain.length < 5) {
        log('err', 'No valid numeric rows found for the selected columns.');
        render();
        return;
      }
      if (guessed) syncSettingsToUI();
      S.sample.strain = strain;
      S.sample.stress = stress;
      $('#sampleMeta').textContent = sampleMetaText(S.sample.filename);
      autoAxes();
      if (S.results.E > 0) calcYieldUTS();
      render();
      log('info', 'Plot updated');
    } catch (error) {
      log('err', error.message || 'Unexpected error while updating plot.');
      render();
    }
  }

  // ---------- PDF / Report export ----------
  function getLogoDataUrl() {
    try {
      const img = document.querySelector('.titlebar img[src="YieldFOX.png"]');
      if (!img || !img.complete || !img.naturalWidth) return null;
      const c = document.createElement('canvas');
      c.width  = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/png');
    } catch { return null; }
  }

  function exportPdf() {
    if (!S.sample.strain.length) { log('warn', 'Nothing to export'); return; }
    log('info', 'Building report…');

    const logoDataUrl = getLogoDataUrl();

    // ── 1. Capture the plot SVG at full-data view ────────────────────────
    const savedAxes = { ...S.axes };
    autoAxes();
    render();

    const svgEl  = $('#plot');
    const svgRect = svgEl.getBoundingClientRect();
    const W = Math.round(svgRect.width), H = Math.round(svgRect.height);
    const clone = svgEl.cloneNode(true);
    clone.setAttribute('width',   W);
    clone.setAttribute('height',  H);
    clone.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '0'); bgRect.setAttribute('y', '0');
    bgRect.setAttribute('width', W); bgRect.setAttribute('height', H);
    bgRect.setAttribute('fill', '#ffffff');
    clone.insertBefore(bgRect, clone.firstChild);

    let svgXml = new XMLSerializer().serializeToString(clone);

    // Resolve all CSS custom-property tokens to hardcoded light-mode values
    const TOKENS = {
      '--bg':'#f7f7f8','--panel':'#ffffff','--panel-2':'#fafafa',
      '--border':'#e4e4e7','--border-strong':'#d4d4d8',
      '--text':'#18181b','--text-dim':'#71717a','--text-faint':'#a1a1aa',
      '--accent':'#2563eb','--accent-soft':'#eff6ff',
      '--grid':'#ececef','--curve':'#2563eb','--curve-2':'#f97316','--danger':'#dc2626'
    };
    for (const [k, v] of Object.entries(TOKENS))
      svgXml = svgXml.split(`var(${k})`).join(v);

    // ── Capture yield-region zoom (0 – 1 % strain) ───────────────────────
    let yMaxElastic = 0;
    for (let i = 0; i < S.sample.strain.length; i++) {
      if (S.sample.strain[i] * 100 <= 1.0 && S.sample.stress[i] > yMaxElastic)
        yMaxElastic = S.sample.stress[i];
    }
    if (!yMaxElastic) yMaxElastic = S.sample.stress.reduce((a,b)=>a>b?a:b,-Infinity) * 0.5;
    yMaxElastic = Math.ceil(yMaxElastic * 1.15 / 50) * 50;
    S.axes = { xMin: 0, xMax: 1.0, yMin: 0, yMax: yMaxElastic, auto: false };
    syncAxesToUI();
    render();

    const svgElZ  = $('#plot');
    const svgRectZ = svgElZ.getBoundingClientRect();
    const WZ = Math.round(svgRectZ.width), HZ = Math.round(svgRectZ.height);
    const cloneZ = svgElZ.cloneNode(true);
    cloneZ.setAttribute('width',   WZ);
    cloneZ.setAttribute('height',  HZ);
    cloneZ.setAttribute('viewBox', `0 0 ${WZ} ${HZ}`);
    const bgZ = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgZ.setAttribute('x','0'); bgZ.setAttribute('y','0');
    bgZ.setAttribute('width', WZ); bgZ.setAttribute('height', HZ);
    bgZ.setAttribute('fill','#ffffff');
    cloneZ.insertBefore(bgZ, cloneZ.firstChild);
    let svgXmlZ = new XMLSerializer().serializeToString(cloneZ);
    for (const [k, v] of Object.entries(TOKENS))
      svgXmlZ = svgXmlZ.split(`var(${k})`).join(v);

    // Restore user's view
    Object.assign(S.axes, savedAxes);
    syncAxesToUI();
    render();

    // ── 2. Format values ─────────────────────────────────────────────────
    const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const fv  = (v, d = 1) => (v && isFinite(v)) ? v.toFixed(d) : '—';

    const E     = fv(S.results.E, 0);
    const yld   = fv(S.results.yieldStrength, 1);
    const uts   = fv(S.results.uts, 1);
    const elong = fv(S.results.elongation, 2);
    const eRange = S.results.eRange
      ? `${S.results.eRange.x1.toFixed(3)} – ${S.results.eRange.x2.toFixed(3)} %` : '—';

    const today = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });
    const now   = new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });

    const areaLabel    = S.settings.inputType === 'stress' ? 'Direct (MPa)' : `${S.settings.area} mm²`;
    const curveLabel   = S.settings.curveType === 'true' ? 'True' : 'Engineering';
    const strainLabel  = { percent:'% (percent)', 'mm/mm':'mm/mm', microstrain:'µε (micro)' }[S.settings.strainUnit] || '—';
    const inputLabel   = S.settings.inputType === 'stress' ? 'Stress (MPa)' : 'Force (N)';
    const hasAllProps  = S.results.yieldStrength > 0 && S.results.uts > 0 && S.results.E > 0;

    // ── 3. Build the report HTML ─────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<title>Tensile Test Report – ${esc(S.sample.name || 'Sample')}</title>
<style>
  @page { size: A4 landscape; margin: 8mm 10mm; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 100%; background: #fff; color: #18181b;
    font: 10.5px/1.5 "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  /* height:100vh + overflow:hidden forces each .page to exactly one printed page */
  .page { width:100%; height:100vh; display:flex; flex-direction:column; overflow:hidden; }

  /* Header */
  .hd {
    display:flex; align-items:center; gap:14px; flex-shrink:0;
    padding-bottom:7px; margin-bottom:8px;
    border-bottom:3px solid #f97316;
  }
  .hd-logo   { height:52px; width:auto; object-fit:contain; display:block; flex-shrink:0; }
  .hd-brand  { font-size:20px; font-weight:800; color:#18181b; letter-spacing:-0.03em; flex-shrink:0; }
  .hd-brand span { color:#f97316; }
  .hd-title  { flex:1; font-size:14px; font-weight:700; color:#18181b; text-align:center; letter-spacing:0.01em; }
  .hd-title small { display:block; font-size:9.5px; font-weight:400; color:#71717a; margin-top:1px; letter-spacing:0.04em; text-transform:uppercase; }
  .hd-meta   { text-align:right; font-size:9.5px; color:#71717a; line-height:1.6; flex-shrink:0; }
  .hd-meta strong { display:block; font-size:11px; font-weight:700; color:#18181b; }

  /* Body — overflow:hidden keeps content within the page height */
  .body      { flex:1; display:flex; gap:12px; min-height:0; overflow:hidden; }
  .col-plot  { flex:1; display:flex; flex-direction:column; gap:6px; min-width:0; overflow:hidden; }
  .col-data  { width:190px; flex-shrink:0; display:flex; flex-direction:column; gap:9px; overflow:hidden; }
  .col-right { width:210px; flex-shrink:0; display:flex; flex-direction:column; gap:9px; overflow:hidden; }

  /* Sample bar (page 1) */
  .sample-bar {
    background:#f8f8fa; border:1px solid #e4e4e7; border-radius:6px; flex-shrink:0;
    padding:5px 10px; display:flex; gap:18px; flex-wrap:wrap; align-items:flex-start;
  }
  .sb-lbl { font-size:7.5px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#a1a1aa; margin-bottom:1px; }
  .sb-val { font-size:11px; font-weight:600; color:#18181b; }
  .sb-val.mono { font-family:"Consolas","Courier New",monospace; font-weight:400; font-size:10px; }

  /* Info bar (page 2) */
  .si {
    background:#f8f8fa; border:1px solid #e4e4e7; border-radius:6px; flex-shrink:0;
    padding:5px 10px; display:flex; gap:18px; flex-wrap:wrap; align-items:flex-start;
  }
  .si-lbl { font-size:7.5px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#a1a1aa; display:block; margin-bottom:1px; }
  .si-val { font-size:11px; font-weight:600; color:#18181b; }

  /* Plot */
  .plot-box { flex:1; border:1px solid #e4e4e7; border-radius:6px; overflow:hidden; background:#fff; min-height:0; }
  .plot-box svg { width:100%; height:100%; display:block; }

  /* Section headings */
  .sh { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.12em;
        color:#a1a1aa; padding-bottom:4px; border-bottom:1px solid #e4e4e7; margin-bottom:6px; flex-shrink:0; }

  /* Result cards */
  .res-grid { display:flex; flex-direction:column; gap:4px; }
  .rc-row   { display:flex; gap:6px; }
  .rc-row .rc { flex:1; }
  .rc { border:1px solid #e4e4e7; border-radius:6px; padding:7px 9px; background:#fafafa; }
  .rc.blue { background:#fff7ed; border-color:#fed7aa; }
  .rc-lbl { font-size:8px; font-weight:600; text-transform:uppercase; letter-spacing:.07em; color:#71717a; }
  .rc-val { font-size:20px; font-weight:700; color:#18181b; font-variant-numeric:tabular-nums; line-height:1.15; }
  .rc-unit { font-size:10px; font-weight:500; color:#71717a; margin-left:3px; }
  .rc-note { font-size:8px; color:#a1a1aa; margin-top:2px; }

  /* Parameters */
  .pt { width:100%; border-collapse:collapse; }
  .pt tr { border-bottom:1px solid #f0f0f1; }
  .pt tr:last-child { border-bottom:none; }
  .pt td { padding:3.5px 0; vertical-align:top; font-size:9.5px; }
  .pt td:first-child { color:#71717a; width:46%; padding-right:6px; }
  .pt td:last-child  { font-weight:600; color:#18181b; }

  /* Verdict */
  .verdict { border:1px solid #bbf7d0; background:#f0fdf4; border-radius:6px; padding:7px 9px; }
  .verdict .v-head { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#16a34a; margin-bottom:3px; }
  .verdict .v-body { font-size:9px; color:#15803d; line-height:1.6; }

  /* Footer */
  .ft { margin-top:6px; padding-top:5px; border-top:2px solid #f97316; flex-shrink:0;
        display:flex; justify-content:space-between; align-items:center;
        font-size:8px; color:#a1a1aa; }
  .ft b { color:#f97316; font-weight:700; }
</style>
</head>
<body>
<div class="page">

  <div class="hd">
    ${logoDataUrl
      ? `<img src="${logoDataUrl}" alt="YieldFOX" class="hd-logo"/>`
      : `<div class="hd-brand">Yield<span>FOX</span></div>`}
    <div class="hd-title">
      Tensile Test Analysis Report
      <small>Measure &nbsp;&middot;&nbsp; Analyze &nbsp;&middot;&nbsp; Understand</small>
    </div>
    <div class="hd-meta">
      <strong>${today}</strong>
      ${now} &nbsp;&middot;&nbsp; YieldFOX v1.0 &nbsp;&middot;&nbsp; NORFOX
    </div>
  </div>

  <div class="body">

    <div class="col-plot">
      <div class="sample-bar">
        <div><div class="sb-lbl">Sample ID</div><div class="sb-val">${esc(S.sample.name || '—')}</div></div>
        <div><div class="sb-lbl">Source file</div><div class="sb-val mono">${esc(S.sample.filename || '—')}</div></div>
        <div><div class="sb-lbl">Data points</div><div class="sb-val">${S.sample.strain.length}</div></div>
        <div><div class="sb-lbl">Curve type</div><div class="sb-val">${curveLabel}</div></div>
        <div><div class="sb-lbl">Strain unit</div><div class="sb-val">${strainLabel}</div></div>
      </div>
      <div class="plot-box">${svgXml}</div>
    </div>

    <div class="col-data">

      <div>
        <div class="sh">Mechanical Properties</div>
        <div class="res-grid">
          <div class="rc blue">
            <div class="rc-lbl">Young's Modulus (E)</div>
            <div class="rc-val">${E}<span class="rc-unit">GPa</span></div>
            <div class="rc-note">Elastic range: ${eRange}</div>
          </div>
          <div class="rc">
            <div class="rc-lbl">Yield Strength &mdash; 0.2% offset</div>
            <div class="rc-val">${yld}<span class="rc-unit">MPa</span></div>
          </div>
          <div class="rc">
            <div class="rc-lbl">Ultimate Tensile Strength</div>
            <div class="rc-val">${uts}<span class="rc-unit">MPa</span></div>
          </div>
          <div class="rc">
            <div class="rc-lbl">Elongation at Break</div>
            <div class="rc-val">${elong}<span class="rc-unit">%</span></div>
          </div>
        </div>
      </div>

      <div>
        <div class="sh">Test Parameters</div>
        <table class="pt">
          <tr><td>Cross-section area</td><td>${esc(areaLabel)}</td></tr>
          <tr><td>Input data type</td><td>${inputLabel}</td></tr>
          <tr><td>Strain unit</td><td>${strainLabel}</td></tr>
          <tr><td>Curve type</td><td>${curveLabel}</td></tr>
          <tr><td>Yield method</td><td>0.2% proof stress</td></tr>
          <tr><td>E fit method</td><td>Linear regression</td></tr>
          ${S.results.eRange ? `<tr><td>Elastic range</td><td>${eRange}</td></tr>` : ''}
        </table>
      </div>

      ${hasAllProps ? `
      <div class="verdict">
        <div class="v-head">&#10003; Analysis complete</div>
        <div class="v-body">
          E = ${E} GPa<br>
          &sigma;<sub>0.2</sub> = ${yld} MPa<br>
          UTS = ${uts} MPa<br>
          &epsilon;<sub>max</sub> = ${elong} %
        </div>
      </div>` : ''}

    </div>
  </div>

  <div class="ft">
    <b>NORFOX &nbsp;&middot;&nbsp; YieldFOX v1.0</b>
    <span>ISO 6892-1 &nbsp;&middot;&nbsp; 0.2% proof stress &nbsp;&middot;&nbsp; Linear regression E</span>
    <span>Page 1 of 2</span>
  </div>

</div>

<!-- ═══════════════════════ PAGE 2 — Yield Region ═══════════════════════ -->
<div class="page" style="break-before:page;">

  <div class="hd">
    ${logoDataUrl ? `<img class="hd-logo" src="${logoDataUrl}" alt="YieldFOX logo">` : ''}
    <div class="hd-brand">YIELD<span>FOX</span></div>
    <div class="hd-title">
      Yield Region Analysis
      <small>Strain 0 – 1 % &nbsp;&middot;&nbsp; Elastic &amp; Yield Detail</small>
    </div>
    <div class="hd-meta">
      <strong>${esc(S.sample.name || 'Sample')}</strong>
      ${today}<br>${now}
    </div>
  </div>

  <!-- sample bar (same as page 1) -->
  <div class="si">
    <div class="si-item"><span class="si-lbl">Sample</span><span class="si-val">${esc(S.sample.name||'—')}</span></div>
    <div class="si-item"><span class="si-lbl">Material</span><span class="si-val">${esc(S.settings.material||'—')}</span></div>
    <div class="si-item"><span class="si-lbl">Cross-section</span><span class="si-val">${esc(areaLabel)}</span></div>
    <div class="si-item"><span class="si-lbl">Curve type</span><span class="si-val">${curveLabel}</span></div>
    <div class="si-item"><span class="si-lbl">Strain unit</span><span class="si-val">${strainLabel}</span></div>
    <div class="si-item"><span class="si-lbl">Date</span><span class="si-val">${today}</span></div>
  </div>

  <div class="body">

    <!-- Zoomed plot -->
    <div class="col-plot">
      <div class="plot-box">${svgXmlZ}</div>
    </div>

    <!-- Right panel: elastic + yield detail -->
    <div class="col-right" style="width:230px;flex-shrink:0;">

      <div>
        <div class="sh">Elastic Region</div>
        <div class="rc-row">
          <div class="rc">
            <div class="rc-lbl">Young's Modulus</div>
            <div class="rc-val">${E}<span class="rc-unit">GPa</span></div>
          </div>
          <div class="rc">
            <div class="rc-lbl">Fit Range</div>
            <div class="rc-val" style="font-size:13px;">${eRange}</div>
          </div>
        </div>
      </div>

      <div>
        <div class="sh">Yield Analysis</div>
        <div class="rc-row">
          <div class="rc">
            <div class="rc-lbl">Yield Strength</div>
            <div class="rc-val">${yld}<span class="rc-unit">MPa</span></div>
          </div>
          <div class="rc">
            <div class="rc-lbl">Yield Strain (0.2%)</div>
            <div class="rc-val" style="font-size:13px;">${
              (S.results.E > 0 && S.results.yieldStrength > 0)
                ? ((S.results.yieldStrength / (S.results.E * 1000) + 0.002) * 100).toFixed(4) + ' %'
                : '—'
            }</div>
          </div>
        </div>
      </div>

      <div>
        <div class="sh">Method Reference</div>
        <table class="pt">
          <tr><td>Standard</td><td>ISO 6892-1</td></tr>
          <tr><td>Yield method</td><td>0.2 % proof stress</td></tr>
          <tr><td>E method</td><td>Linear regression</td></tr>
          <tr><td>Strain range</td><td>0 – 1 %</td></tr>
          ${S.results.eRange ? `<tr><td>E fit range</td><td>${eRange}</td></tr>` : ''}
        </table>
      </div>

      ${(S.results.E > 0 && S.results.yieldStrength > 0) ? `
      <div class="verdict">
        <div class="v-head">Elastic Summary</div>
        <div class="v-body">
          E = ${E} GPa<br>
          &sigma;<sub>0.2</sub> = ${yld} MPa<br>
          Yield &epsilon; = ${((S.results.yieldStrength/(S.results.E*1000))+0.002).toFixed(5)}<br>
          E range = ${eRange}
        </div>
      </div>` : ''}

    </div>
  </div>

  <div class="ft">
    <b>NORFOX &nbsp;&middot;&nbsp; YieldFOX v1.0</b>
    <span>ISO 6892-1 &nbsp;&middot;&nbsp; Yield Region Detail</span>
    <span>Page 2 of 2</span>
  </div>

</div>
<script>
  window.onload = () => setTimeout(() => window.print(), 300);
  window.onafterprint = () => window.close();
</script>
</body></html>`;

    // ── 4. Open in a new window and trigger print ────────────────────────
    const win = window.open('', '_blank', 'width=1120,height=760');
    if (!win) {
      log('err', 'Pop-up blocked — allow pop-ups for this page and try again');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    log('ok', 'Report ready — save as PDF from the print dialog');
  }

  // ---------- Menubar ----------
  function setupMenubar() {
    const menus = $$('.menubar .m');
    let menuOpen = false;

    function closeAll() {
      menus.forEach(m => m.classList.remove('open'));
      menuOpen = false;
    }

    // Close when clicking anywhere outside the menubar
    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.menubar')) closeAll();
    });

    menus.forEach(menu => {
      // Use click (not mousedown) so the .mi click fires before we hide the dropdown.
      // Skip if the click came from inside the dropdown — mi() handles those.
      menu.addEventListener('click', (e) => {
        if (e.target.closest('.menu-drop')) return;
        const wasOpen = menu.classList.contains('open');
        closeAll();
        if (!wasOpen) { menu.classList.add('open'); menuOpen = true; }
      });
      // While a menu is open, hovering another label switches to it
      menu.addEventListener('mouseenter', () => {
        if (menuOpen && !menu.classList.contains('open')) {
          closeAll();
          menu.classList.add('open');
          menuOpen = true;
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
      if (e.key === 'F1') { e.preventDefault(); window.open('Help.html', '_blank'); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault(); $('#fileInput').click();
      }
    });

    function mi(id, fn) {
      const el = $('#' + id);
      if (!el) return;
      el.addEventListener('click', (e) => { e.stopPropagation(); closeAll(); fn(); });
    }

    // File
    mi('miOpen',      () => $('#fileInput').click());
    mi('miReload',    () => { applyUpdate(); log('info', 'Data reloaded'); });
    mi('miShowData',  openDataModal);
    mi('miSavePng',   savePlotPng);
    mi('miExportPdf', exportPdf);
    mi('miClear', () => {
      S.sample = { name: '', filename: '', raw: [], strain: [], stress: [] };
      resetResults();
      $('#sampleName').value = '— no sample —';
      $('#sampleMeta').textContent = '';
      $('#rowCount').textContent = '0 rows';
      enableAfterLoad(false);
      render();
      log('info', 'Cleared');
    });

    // Edit
    mi('miResetResults', () => { resetResults(); render(); log('info', 'Results reset'); });
    mi('miLoadSettings', () => { loadState(); log('ok', 'Settings reloaded'); });
    mi('miSaveSettings', () => { readSettingsFromUI(); saveState(); });

    // View
    mi('miToggleTheme', toggleTheme);
    mi('miZoomIn',  () => zoomBy(0.8));
    mi('miZoomOut', () => zoomBy(1.25));
    mi('miFit',     fitAxes);
    mi('miZoomE',   zoomElastic);
    mi('miBoxZoom', () => {
      if (!S.sample.strain.length) return;
      S.interaction.mode = 'box';
      $('#plot').classList.add('boxzoom');
      log('info', 'Drag a rectangle on the plot to zoom in');
    });

    // Analysis
    mi('miFindE',    beginPick);
    mi('miAutoE',    openAutoEModal);
    mi('miYieldUTS', () => {
      if (S.results.E <= 0) { log('warn', 'Set E first (Find E or type a value)'); return; }
      calcYieldUTS();
      render();
      log('ok', `Yield = ${S.results.yieldStrength.toFixed(1)} MPa`);
    });
    mi('miReset2',   () => { resetResults(); render(); log('info', 'Results reset'); });

    // Tools
    mi('miShowData2', openDataModal);

    // Help
    mi('miHelp',  () => window.open('Help.html', '_blank'));
    mi('miAbout', () => log('info', 'YieldFOX v1.0 — Tensile Test Analysis · NORFOX'));
  }

  // ---------- Wire UI ----------
  function wire() {
    // toolbar
    $('#btnOpen').onclick = () => $('#fileInput').click();
    $('#fileInput').onchange = (e) => {
      const f = e.target.files[0];
      if (f) openFile(f);
      e.target.value = '';
    };
    $('#btnUpdate').onclick = applyUpdate;
    $('#btnClear').onclick = () => {
      S.sample = { name: '', filename: '', raw: [], strain: [], stress: [] };
      resetResults();
      $('#sampleName').value = '— no sample —';
      $('#sampleMeta').textContent = '';
      $('#rowCount').textContent = '0 rows';
      enableAfterLoad(false);
      render();
      log('info', 'Cleared');
    };
    $('#btnReset').onclick = () => { resetResults(); render(); log('info', 'Results reset'); };
    $('#btnAdvanced').onclick = () => {
      S.settings.advancedMode = !S.settings.advancedMode;
      $('#btnAdvanced').classList.toggle('active', S.settings.advancedMode);

      // When turning advanced OFF, clear the extra fields so they don't linger in the panel
      if (!S.settings.advancedMode) {
        S.results.yieldType = null;
        S.results.ReH = 0; S.results.ReL = 0; S.results.yieldDrop = 0;
        S.results.ludersStart = 0; S.results.ludersEnd = 0; S.results.ludersStrain = 0;
        S.results.plc = null; S.results.neckingStrain = 0; S.results.neckingStress = 0;
      }

      // Re-run immediately if a result already exists so the user sees the change at once
      const hasAnalysis = S.sample.strain.length > 0 && S.results.E > 0 &&
        (S.results.yieldStrength > 0 || S.results.uts > 0);
      if (hasAnalysis) {
        calcYieldUTS();
        render();
      }
      syncResultsToUI();

      const msg = S.settings.advancedMode
        ? 'Advanced analysis ON — ReH/ReL · Lüders · PLC · Necking'
        : 'Advanced analysis OFF — standard 0.2 % offset only';
      log('info', msg);
    };
    $('#btnEModule').onclick = beginPick;
    $('#btnAutoE').onclick = openAutoEModal;
    $('#autoERunBtn').onclick = runAutoE;
    $('#autoEAccept').onclick = acceptAutoE;
    const closeAutoE = () => $('#autoEModal').setAttribute('data-open', 'false');
    $('#autoECancel').onclick = closeAutoE;
    $('#autoEModalClose').onclick = closeAutoE;
    $('#autoEModalBackdrop').onclick = closeAutoE;
    $('#btnZoomIn').onclick = () => zoomBy(0.8);
    $('#btnZoomOut').onclick = () => zoomBy(1.25);
    $('#btnFit').onclick = fitAxes;
    $('#btnZoomE').onclick = zoomElastic;
    $('#btnBoxZoom').onclick = () => {
      if (!S.sample.strain.length) return;
      S.interaction.mode = 'box';
      $('#plot').classList.add('boxzoom');
      log('info', 'Drag a rectangle on the plot to zoom in');
    };
    $('#btnYield').onclick = () => {
      if (S.results.E <= 0) { log('warn', 'Set E first (Find E-Module, or type a value)'); return; }
      calcYieldUTS();
      render();
      log('ok', `Yield = ${S.results.yieldStrength.toFixed(1)} MPa`);
    };
    $('#btnSavePng').onclick = savePlotPng;
    $('#btnPdf').onclick = exportPdf;
    // axis inputs
    $$('#axXmin,#axXmax,#axYmin,#axYmax').forEach(el => {
      el.addEventListener('change', () => { readAxesFromUI(); render(); });
    });

    // settings — column inputs update on commit (Enter/blur) to avoid mid-typing errors
    $$('#fStrain,#fForce').forEach(el => {
      el.addEventListener('change', applyUpdate);
    });
    $$('#fArea').forEach(el => {
      el.addEventListener('input', () => {
        if (S.settings.inputType !== 'stress') applyUpdate();
      });
    });
    $$('#fStrainUnit,#fInputType,#fCurveType').forEach(el => {
      el.addEventListener('change', applyUpdate);
    });
    // start line and decimal sep only update stored settings (need file reload to take effect)
    $$('#fStart,#fDecimal').forEach(el => {
      el.addEventListener('change', readSettingsFromUI);
    });
    // editable sample name in plot header
    $('#sampleName').addEventListener('change', () => {
      S.sample.name = $('#sampleName').value;
    });

    // editable E
    $('#rE').addEventListener('change', () => {
      const v = +$('#rE').value;
      if (v > 0) {
        S.results.E = v;
        log('info', `E set manually to ${v} GPa`);
        if (S.sample.strain.length) {
          calcYieldUTS();
          render();
        }
      }
    });

    $('#btnShowData').onclick = openDataModal;
    $('#btnReload').onclick = () => { applyUpdate(); log('info', 'Data reloaded'); };
    $('#btnTheme').onclick = toggleTheme;
    $('#btnCloseData').onclick = closeDataModal;
    $('#dataModalClose').onclick = closeDataModal;

    // load / save settings
    $('#btnSaveSettings').onclick = () => { readSettingsFromUI(); saveState(); };
    $('#btnLoadSettings').onclick = () => { loadState(); log('ok', 'Settings reloaded'); };

    setupMenubar();

    // plot interactions
    const svgEl = $('#plot');
    svgEl.addEventListener('click', onPlotClick);
    svgEl.addEventListener('wheel', onPlotWheel, { passive: false });
    svgEl.addEventListener('pointerdown', onPlotDown);
    window.addEventListener('pointermove', onPlotMove);
    window.addEventListener('pointerup', onPlotUp);
    svgEl.addEventListener('dblclick', fitAxes);

    // resize re-render
    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt); rt = setTimeout(render, 80);
    });
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    wire();
    enableAfterLoad(false);
    render();
    log('info', 'YieldFOX ready · open a .dat / .txt / .csv file to begin');
  });
})();
