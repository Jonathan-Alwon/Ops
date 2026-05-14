/* ALWON OS — operational runtime client
 * Shell renderer + tickers + command palette + store selector.
 */

(function () {
  const NAV = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'dashboard',     label: 'Dashboard',     href: 'dashboard.html',     icon: 'grid' },
        { id: 'events',        label: 'Events',        href: 'events.html',        icon: 'pulse',  meta: '24/s',  metaTone: '' },
        { id: 'incidents',     label: 'Incidents',     href: 'incidents.html',     icon: 'alert',  meta: '3',     metaTone: 'crit' },
      ],
    },
    {
      group: 'DAILY WORK',
      items: [
        { id: 'inventory',     label: 'Inventory',     href: 'inventory.html',     icon: 'box',    meta: '12',    metaTone: 'warn' },
        { id: 'checkout',      label: 'Checkout',      href: 'checkout.html',      icon: 'scan' },
        { id: 'payments',      label: 'Payments',      href: 'payments.html',      icon: 'card' },
        { id: 'messages',      label: 'Messages',      href: 'messages.html',      icon: 'inbox',  meta: '7',     metaTone: '' },
        { id: 'loss',          label: 'Loss Prevention', href: 'loss-prevention.html', icon: 'eye', meta: '2',  metaTone: 'warn' },
      ],
    },
    {
      group: 'SETUP',
      items: [
        { id: 'stores',        label: 'Stores',        href: 'stores.html',        icon: 'building' },
        { id: 'observability', label: 'Observability', href: 'observability.html', icon: 'wave' },
        { id: 'settings',      label: 'Settings',      href: 'settings.html',      icon: 'gear' },
      ],
    },
  ];

  const STORES = [
    { id: 'BOG-001', name: 'Bogotá · Chapinero',    state: 'live'  },
    { id: 'BOG-002', name: 'Bogotá · Usaquén',      state: 'live'  },
    { id: 'BOG-003', name: 'Bogotá · Salitre',      state: 'live'  },
    { id: 'MDE-001', name: 'Medellín · El Poblado', state: 'live'  },
    { id: 'CTG-001', name: 'Cartagena · Bocagrande', state: 'sync' },
    { id: 'CLO-001', name: 'Cali · Granada',        state: 'staged' },
  ];

  const ICONS = {
    grid:   '<path d="M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z"/>',
    pulse:  '<path d="M3 10h3l2-5 3 10 2-5 4 0"/>',
    alert:  '<path d="M10 3l8 14H2zM10 8v4M10 14v.5"/>',
    box:    '<path d="M3 6l7-3 7 3v8l-7 3-7-3z"/><path d="M3 6l7 3 7-3M10 9v9"/>',
    scan:   '<path d="M3 6V4h3M14 4h3v2M3 14v2h3M14 16h3v-2"/><path d="M5 10h10"/>',
    card:   '<rect x="2" y="5" width="16" height="11" rx="1"/><path d="M2 9h16M5 13h3"/>',
    inbox:  '<path d="M3 4h14v9H3z"/><path d="M3 10h4l1 2h4l1-2h4"/>',
    eye:    '<path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z"/><circle cx="10" cy="10" r="2"/>',
    building:'<path d="M4 17V4h7v13M11 17V9h5v8"/><path d="M6 7h2M6 10h2M6 13h2M13 12h2M13 14.5h2"/>',
    wave:   '<path d="M2 10c2 0 2-4 4-4s2 8 4 8 2-6 4-6 2 2 4 2"/>',
    gear:   '<circle cx="10" cy="10" r="2.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.5 4.5l1.5 1.5M14 14l1.5 1.5M4.5 15.5L6 14M14 6l1.5-1.5"/>',
    search: '<circle cx="9" cy="9" r="5.5"/><path d="M13.5 13.5L17 17"/>',
    bell:   '<path d="M5 13V9a5 5 0 0 1 10 0v4l1 2H4z"/><path d="M8 16a2 2 0 0 0 4 0"/>',
    chevron:'<path d="M5 7l5 5 5-5"/>',
    panels: '<rect x="3" y="3" width="14" height="14" rx="1"/><path d="M7 3v14"/>',
    plus:   '<path d="M10 4v12M4 10h12"/>',
    refresh:'<path d="M3 4v4h4"/><path d="M3 8a7 7 0 0 1 13-1"/><path d="M17 16v-4h-4"/><path d="M17 12a7 7 0 0 1-13 1"/>',
    filter: '<path d="M3 4h14l-5 7v5l-4-2v-3z"/>',
    arrow_up:'<path d="M10 14V6M6 9l4-4 4 4"/>',
    arrow_down:'<path d="M10 6v8M14 11l-4 4-4-4"/>',
    download:'<path d="M10 3v10M6 9l4 4 4-4M3 16h14"/>',
    dot_more:'<circle cx="5" cy="10" r="1"/><circle cx="10" cy="10" r="1"/><circle cx="15" cy="10" r="1"/>',
  };

  function icon(name, cls = '') {
    return `<svg class="${cls}" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
  }

  function liveClock() {
    const u = new Date();
    const utc = u.toISOString().slice(11, 19);
    const local = u.toTimeString().slice(0, 8);
    return { utc, local };
  }

  function renderShell(opts) {
    const active = opts.active || '';
    const crumb = opts.crumb || [];
    const right = opts.headerRight || '';

    const navHtml = NAV.map(g => `
      <div class="nav-group">
        <div class="nav-group-label">${g.group}</div>
        ${g.items.map(it => `
          <a class="nav-item ${it.id === active ? 'active' : ''}" href="${it.href}">
            <span class="nav-icon">${icon(it.icon)}</span>
            <span class="nav-label">${it.label}</span>
            ${it.meta ? `<span class="nav-meta ${it.metaTone || ''}">${it.meta}</span>` : ''}
          </a>
        `).join('')}
      </div>
    `).join('');

    const storesHtml = STORES.map(s => `
      <div class="store-row" data-store="${s.id}">
        <span class="dot ${s.state === 'live' ? 'ok' : s.state === 'sync' ? 'info' : 'idle'}"></span>
        <span><span class="store-row-id">${s.id}</span><span class="store-row-name">${s.name}</span></span>
        <span class="store-row-state">${s.state}</span>
        <span class="store-row-state mono dim-2">↵</span>
      </div>
    `).join('');

    return `
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="mark"></div>
          <div class="wordmark">
            <span class="name">ALWON OS</span>
            <span class="sub">v0.9.4 · ops</span>
          </div>
        </div>
        <div class="sidebar-scroll">${navHtml}</div>
        <div class="sidebar-footer">
          <div class="avatar">JJ</div>
          <div class="who">
            <span class="name">Jonathan J.</span>
            <span class="role"><span class="role-dot"></span>Lead Operator</span>
          </div>
        </div>
      </aside>

      <header class="topbar">
        <button class="collapse-btn" id="alwonCollapse" title="Collapse sidebar">${icon('panels')}</button>

        <div class="store-selector" id="alwonStoreBtn">
          <span class="pulse ok"></span>
          <span class="store-id" id="alwonStoreId">BOG-001</span>
          <span class="store-name" id="alwonStoreName">· Bogotá · Chapinero</span>
          <span class="caret">▾</span>
          <div class="store-dropdown" id="alwonStoreDropdown">
            <div class="cmdk-group" style="padding: 6px 8px 4px;">ACTIVE PILOT STORES · 6</div>
            ${storesHtml}
          </div>
        </div>

        <div class="topbar-cell">
          <span class="key">RUNTIME</span>
          <span class="pulse ok"></span>
          <span class="mono fg-ok">NOMINAL</span>
        </div>
        <div class="topbar-cell">
          <span class="key">CONN</span>
          <span class="mono">edge ⇄ cloud</span>
          <span class="mono fg-ok">14ms</span>
        </div>
        <div class="topbar-cell">
          <span class="key">EVT/s</span>
          <span class="mono" id="alwonEvtRate">23.7</span>
        </div>
        <div class="topbar-cell">
          <span class="key">UTC</span>
          <span class="mono" id="alwonUtc">--:--:--</span>
        </div>
        <div class="topbar-cell">
          <span class="key">LOCAL</span>
          <span class="mono" id="alwonLocal">--:--:--</span>
        </div>

        <div class="spacer"></div>

        <div class="topbar-cell" style="padding: 0 8px;">
          <button class="cmd-input" id="alwonCmd">
            ${icon('search')}
            <span class="cmd-placeholder">Search runtime, events, SKUs…</span>
            <span class="kbd">⌘K</span>
          </button>
        </div>
        <div class="topbar-cell" style="padding: 0 4px;">
          <button class="icon-btn" title="Notifications">
            ${icon('bell')}
            <span class="badge">3</span>
          </button>
        </div>
      </header>

      <main class="main" id="alwonMain">${opts.main || ''}</main>

      <footer class="statusbar">
        <div class="sb-cell"><span class="label">BUILD</span><span class="val">os.0.9.4-rc3</span></div>
        <div class="sb-cell"><span class="label">REGION</span><span class="val">co-bog-1</span></div>
        <div class="sb-cell"><span class="label">EDGE</span><span class="val">edge-co-3 · primary</span></div>
        <div class="sb-cell"><span class="label">REPLAY</span><span class="val" id="alwonReplay">queue: 0</span></div>
        <div class="sb-cell"><span class="label">WS</span><span class="val">stream · ${makeStreamId()}</span></div>
        <div class="sb-spacer"></div>
        <div class="sb-cell"><span class="label">P95 API</span><span class="val" id="alwonApi">142ms</span></div>
        <div class="sb-cell"><span class="label">INGEST</span><span class="val fg-ok">healthy</span></div>
        <div class="sb-cell"><span class="label">SHIFT</span><span class="val">opening · 14:00–22:00</span></div>
      </footer>

      ${renderCmdK()}
    `;
  }

  function makeStreamId() {
    const h = '0123456789abcdef';
    let s = '';
    for (let i = 0; i < 8; i++) s += h[Math.floor(Math.random() * 16)];
    return s;
  }

  function renderCmdK() {
    return `
      <div class="cmdk-veil" id="alwonCmdkVeil">
        <div class="cmdk">
          <div class="cmdk-input">
            ${icon('search', 'fg-2')}
            <input type="text" placeholder="Run a command, jump to an event, look up an SKU…" id="alwonCmdkInput" autofocus />
            <span class="cmdk-hint">ESC to close</span>
          </div>
          <div class="cmdk-results">
            <div class="cmdk-group">JUMP TO</div>
            <div class="cmdk-row" data-href="dashboard.html"><span class="cmdk-icon">${icon('grid')}</span><span>Dashboard · operational command surface</span><span class="cmdk-kbd">G D</span></div>
            <div class="cmdk-row" data-href="events.html"><span class="cmdk-icon">${icon('pulse')}</span><span>Events · realtime telemetry stream</span><span class="cmdk-kbd">G E</span></div>
            <div class="cmdk-row" data-href="observability.html"><span class="cmdk-icon">${icon('wave')}</span><span>Observability · infra runtime</span><span class="cmdk-kbd">G O</span></div>
            <div class="cmdk-row" data-href="incidents.html"><span class="cmdk-icon">${icon('alert')}</span><span>Incidents · queue</span><span class="cmdk-kbd">G I</span></div>
            <div class="cmdk-row" data-href="payments.html"><span class="cmdk-icon">${icon('card')}</span><span>Payments · infrastructure</span><span class="cmdk-kbd">G P</span></div>

            <div class="cmdk-group">ACTIONS</div>
            <div class="cmdk-row"><span class="cmdk-icon fg-info">${icon('refresh')}</span><span>Force resync edge-co-3 → cloud</span><span class="cmdk-kbd">⌘⇧R</span></div>
            <div class="cmdk-row"><span class="cmdk-icon fg-warn">${icon('alert')}</span><span>Acknowledge all open incidents (BOG-001)</span><span class="cmdk-kbd">⌘⇧A</span></div>
            <div class="cmdk-row"><span class="cmdk-icon">${icon('download')}</span><span>Export last 24h event window · NDJSON</span><span class="cmdk-kbd">⌘E</span></div>

            <div class="cmdk-group">QUICK LOOKUP</div>
            <div class="cmdk-row"><span class="cmdk-icon">${icon('search')}</span><span>SKU · 0x7281 · "Postobón Cola 400ml"</span><span class="cmdk-kbd">↵</span></div>
            <div class="cmdk-row"><span class="cmdk-icon">${icon('search')}</span><span>SKU · 0x9442 · "Aguila Light 330ml"</span><span class="cmdk-kbd">↵</span></div>
            <div class="cmdk-row"><span class="cmdk-icon">${icon('search')}</span><span>txn · 8f3a-2e91-... · 14:22:46.802</span><span class="cmdk-kbd">↵</span></div>
          </div>
        </div>
      </div>
    `;
  }

  function tickClock() {
    const t = liveClock();
    const utc = document.getElementById('alwonUtc');
    const loc = document.getElementById('alwonLocal');
    if (utc) utc.textContent = t.utc;
    if (loc) loc.textContent = t.local;
  }

  function tickRates() {
    const evt = document.getElementById('alwonEvtRate');
    const api = document.getElementById('alwonApi');
    const replay = document.getElementById('alwonReplay');
    if (evt) {
      const v = 22 + Math.random() * 6;
      evt.textContent = v.toFixed(1);
    }
    if (api) {
      const v = 128 + Math.floor(Math.random() * 40);
      api.textContent = v + 'ms';
    }
    if (replay) {
      const v = Math.floor(Math.random() * 4);
      replay.textContent = 'queue: ' + v;
    }
  }

  function wireStoreSelector() {
    const btn = document.getElementById('alwonStoreBtn');
    const drop = document.getElementById('alwonStoreDropdown');
    if (!btn || !drop) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      drop.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target)) drop.classList.remove('open');
    });
    drop.querySelectorAll('.store-row').forEach(r => {
      r.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = r.getAttribute('data-store');
        const name = r.querySelector('.store-row-name').textContent;
        document.getElementById('alwonStoreId').textContent = id;
        document.getElementById('alwonStoreName').textContent = name;
        drop.classList.remove('open');
      });
    });
  }

  function wireCollapse() {
    const btn = document.getElementById('alwonCollapse');
    if (!btn) return;
    btn.addEventListener('click', () => {
      document.querySelector('.app').classList.toggle('collapsed');
    });
  }

  function wireCmdK() {
    const trigger = document.getElementById('alwonCmd');
    const veil = document.getElementById('alwonCmdkVeil');
    const input = document.getElementById('alwonCmdkInput');
    if (!veil) return;

    const open = () => {
      veil.classList.add('open');
      setTimeout(() => input && input.focus(), 0);
    };
    const close = () => veil.classList.remove('open');

    if (trigger) trigger.addEventListener('click', open);
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (veil.classList.contains('open')) close(); else open();
      } else if (e.key === 'Escape') {
        close();
      }
    });
    veil.addEventListener('click', (e) => {
      if (e.target === veil) close();
    });
    veil.querySelectorAll('.cmdk-row').forEach(r => {
      r.addEventListener('click', () => {
        const href = r.getAttribute('data-href');
        if (href) window.location.href = href;
        else close();
      });
    });
  }

  function wireTabs() {
    document.querySelectorAll('.tabbar').forEach(bar => {
      bar.querySelectorAll('.tab').forEach(t => {
        t.addEventListener('click', () => {
          bar.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
          t.classList.add('active');
          const filterTarget = t.getAttribute('data-filter-target');
          const filterVal = t.getAttribute('data-filter-value');
          if (filterTarget) {
            document.querySelectorAll('[data-filter-on="' + filterTarget + '"]').forEach(el => {
              if (filterVal === 'all' || el.getAttribute('data-' + filterTarget) === filterVal) {
                el.style.display = '';
              } else {
                el.style.display = 'none';
              }
            });
          }
        });
      });
    });
  }

  /* ---------- Live event stream simulator ---------- */
  const EVENT_TEMPLATES = [
    { src: 'CHECKOUT', sev: 'info', tone: 'checkout', msgs: [
      'POS-{n} · session.completed · basket:{b} · {price}',
      'POS-{n} · session.started · basket:0',
      'POS-{n} · scan.added · sku 0x{sku} · qty 1',
      'POS-{n} · scan.voided · sku 0x{sku} · operator OP-{op}',
      'POS-{n} · tender.cash · returned {price}'
    ]},
    { src: 'PAYMENT', sev: 'ok', tone: 'payment', msgs: [
      'AUTH · visa ****4019 · ✓ approved · {ms}ms',
      'AUTH · mastercard ****5341 · ✓ approved · {ms}ms',
      'AUTH · nequi qr · ✓ approved · {ms}ms',
      'CAPTURE · pse · ✓ settled · {price}',
      'AUTH · amex ****8821 · ✓ approved · {ms}ms'
    ]},
    { src: 'INV', sev: 'info', tone: 'inv', msgs: [
      'sku 0x{sku} · movement -1 · shelf B-{n}',
      'sku 0x{sku} · movement -1 · shelf A-{n}',
      'sku 0x{sku} · reorder.predicted · 4h window',
      'sku 0x{sku} · drift detected · Δ 0.{d}%'
    ]},
    { src: 'EDGE', sev: 'ok', tone: 'edge', msgs: [
      'sync.replica · delta:{n}ev · ack {ms}ms',
      'heartbeat · edge-co-3 · rtt {ms}ms',
      'sync.snapshot · 1.2MB · ✓ flushed',
      'tunnel.refresh · wss · ✓ ok'
    ]},
    { src: 'VISION', sev: 'warn', tone: 'vision', msgs: [
      'cam-{n} · loitering.detected · conf 0.{d}',
      'cam-{n} · concealment.flag · conf 0.{d} · → review',
      'cam-{n} · zone.entry · staff-only · conf 0.{d}',
      'cam-{n} · scan-avoid.candidate · conf 0.{d}'
    ]},
    { src: 'API', sev: 'info', tone: 'api', msgs: [
      'POST /v1/sessions · 200 · {ms}ms · op OP-{op}',
      'POST /v1/payments/authorize · 200 · {ms}ms',
      'GET /v1/inventory/sku · 200 · {ms}ms · cache:hit',
      'POST /v1/incidents · 201 · {ms}ms · severity:warn'
    ]},
  ];

  function rint(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }
  function fill(s) {
    return s
      .replace('{n}', String(rint(1, 9)).padStart(2, '0'))
      .replace('{b}', rint(1, 12))
      .replace('{price}', '$ ' + (rint(4000, 38000)).toLocaleString('en-US').replace(/,/g, '.'))
      .replace('{sku}', rint(1000, 65000).toString(16).padStart(4, '0'))
      .replace('{op}', String(rint(1, 12)).padStart(3, '0'))
      .replace('{ms}', rint(86, 320))
      .replace('{d}', rint(60, 98));
  }

  function nowTs() {
    const d = new Date();
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return d.toTimeString().slice(0, 8) + '.' + ms;
  }

  function makeEvent() {
    const tpl = EVENT_TEMPLATES[rint(0, EVENT_TEMPLATES.length - 1)];
    const m = tpl.msgs[rint(0, tpl.msgs.length - 1)];
    let sev = tpl.sev;
    if (tpl.src === 'PAYMENT' && Math.random() < 0.05) sev = 'crit';
    if (tpl.src === 'VISION' && Math.random() < 0.30) sev = 'crit';
    if (tpl.src === 'EDGE' && Math.random() < 0.04) sev = 'warn';
    return {
      ts: nowTs(),
      src: tpl.src,
      tone: tpl.tone,
      sev,
      msg: fill(m),
    };
  }

  function startEventStream(targetEl, opts) {
    if (!targetEl) return;
    const max = (opts && opts.max) || 28;
    const interval = (opts && opts.interval) || 800;

    function push() {
      const ev = makeEvent();
      const row = document.createElement('div');
      row.className = 't-row sev-' + ev.sev;
      row.innerHTML = `
        <span class="ts">${ev.ts}</span>
        <span class="src ${ev.tone}">${ev.src}</span>
        <span class="msg">${ev.msg}</span>
      `;
      row.style.opacity = '0';
      targetEl.insertBefore(row, targetEl.firstChild);
      requestAnimationFrame(() => { row.style.transition = 'opacity 200ms ease-out'; row.style.opacity = '1'; });
      while (targetEl.children.length > max) targetEl.removeChild(targetEl.lastChild);
    }
    push();
    return setInterval(push, interval + rint(-200, 400));
  }

  /* ---------- Counter animation ---------- */
  function animateCounter(el, target, opts) {
    if (!el) return;
    const decimals = (opts && opts.decimals) || 0;
    const suffix = (opts && opts.suffix) || '';
    const dur = (opts && opts.duration) || 900;
    const start = parseFloat(el.dataset.cur || '0');
    const t0 = performance.now();
    function step(t) {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = start + (target - start) * eased;
      el.textContent = v.toFixed(decimals) + suffix;
      if (k < 1) requestAnimationFrame(step);
      else { el.dataset.cur = String(target); }
    }
    requestAnimationFrame(step);
  }

  function startKpiFluctuation() {
    document.querySelectorAll('[data-kpi]').forEach(el => {
      const base = parseFloat(el.dataset.kpiBase || '0');
      const vary = parseFloat(el.dataset.kpiVary || '0');
      const dec = parseInt(el.dataset.kpiDec || '0', 10);
      const suffix = el.dataset.kpiSuffix || '';
      function step() {
        const delta = (Math.random() - 0.5) * 2 * vary;
        const next = base + delta;
        animateCounter(el, next, { decimals: dec, suffix, duration: 700 });
      }
      step();
      setInterval(step, 3000 + Math.random() * 2000);
    });
  }

  /* ---------- Sparkline ---------- */
  function sparkline(values, opts) {
    const o = Object.assign({ w: 56, h: 16, stroke: 'currentColor', fill: 'none' }, opts || {});
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const dx = o.w / (values.length - 1);
    const pts = values.map((v, i) => `${(i * dx).toFixed(1)},${(o.h - ((v - min) / range) * (o.h - 2) - 1).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 ${o.w} ${o.h}" width="${o.w}" height="${o.h}" preserveAspectRatio="none" fill="none">
      <polyline points="${pts}" stroke="${o.stroke}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`;
  }

  function renderSparklines() {
    document.querySelectorAll('[data-spark]').forEach(el => {
      const len = parseInt(el.dataset.sparkLen || '24', 10);
      const seed = parseInt(el.dataset.sparkSeed || '7', 10);
      const colorClass = el.dataset.sparkClass || '';
      let s = seed;
      const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
      const values = [];
      let v = 50 + rng() * 30;
      for (let i = 0; i < len; i++) {
        v += (rng() - 0.5) * 22;
        v = Math.max(8, Math.min(96, v));
        values.push(v);
      }
      if (colorClass) el.classList.add(colorClass);
      el.innerHTML = sparkline(values, { w: parseInt(el.getAttribute('width') || el.offsetWidth || 56, 10) || 56, h: parseInt(el.getAttribute('height') || el.offsetHeight || 16, 10) || 16 });
    });
  }

  /* ---------- Public init ---------- */
  function init(opts) {
    const root = document.getElementById('app');
    if (!root) return;
    root.className = 'app';
    root.innerHTML = renderShell(opts);

    tickClock();
    setInterval(tickClock, 1000);
    tickRates();
    setInterval(tickRates, 2500);

    wireCollapse();
    wireStoreSelector();
    wireCmdK();
    wireTabs();
    renderSparklines();
    startKpiFluctuation();

    if (opts.onMounted) opts.onMounted();
  }

  window.ALWON = {
    init,
    icon,
    startEventStream,
    sparkline,
    animateCounter,
    nowTs,
    rint,
    makeEvent,
  };
})();
