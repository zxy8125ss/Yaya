/* 芽芽 · app.js  原生 JS + hash 路由 + localStorage */
(function () {
  'use strict';
  var SRC = window.SRC, NODES = window.NODES, CARDS = window.CARDS, IDEAS = window.IDEAS, PACT = window.PACT;
  var KEY = 'yaya.v1';
  var CATS = ['喂养', '生病穿衣', '睡眠护理', '管教习惯'];
  var PHASE = { prep: '备孕', preg: '怀孕', baby: '0–3 岁', kid: '3–18 岁 · 粗略版' };
  var app = document.getElementById('app');

  /* ---------- 存储 ---------- */
  var st = load();
  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '{}'); return v && typeof v === 'object' ? v : {}; }
    catch (e) { return {}; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  st.done = st.done || {}; st.pact = st.pact || {};

  /* ---------- 工具 ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function parseDate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], m[2] - 1, +m[3]) : null; }
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function dayDiff(a, b) { return Math.round((b - a) / 864e5); }
  function fmt(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function toast(t) {
    var el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = t;
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2200);
  }
  var IC = {
    sprout: '<svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 58V30" stroke="currentColor" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M32 34C32 20 22 12 8 12c0 14 10 22 24 22z" fill="#8DBF6E"/><path d="M32 30c0-12 9-20 24-20 0 13-9 20-24 20z" fill="#F4A87C"/></svg>',
    back: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chev: '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    speak: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    warn: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2L12 3z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 10v5M12 18v.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    copy: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
  };
  function srcHtml(ids) {
    ids = (ids || []).filter(function (i) { return SRC[i]; });
    if (!ids.length) return '';
    return '<div class="src">来源：' + ids.map(function (i) {
      var s = SRC[i];
      return '<a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.n) + '</a>（' + esc(s.o) + '，' + esc(s.d) + '）';
    }).join('；') + '</div>';
  }

  /* ---------- 阶段定位 ---------- */
  function locate() {
    var t = today(), r = { id: null, ring: '', ringSub: '', info: '' };
    if (st.mode === 'prep') { r.id = 'prep'; r.ring = '备孕'; r.ringSub = '准备中'; r.info = '提前 3–6 个月准备'; return r; }
    if (st.mode === 'preg') {
      var due = parseDate(st.due); if (!due) return r;
      var gd = 280 - dayDiff(t, due); if (gd < 0) gd = 0;
      var w = Math.floor(gd / 7), d = gd % 7, wk = w + 1;
      r.id = wk <= 13 ? 'p1' : wk <= 27 ? 'p2' : 'p3';
      r.ring = '孕 ' + w + ' 周'; r.ringSub = d ? '+' + d + ' 天' : '整';
      var left = dayDiff(t, due);
      r.info = '预产期 ' + st.due + (left >= 0 ? ' · 还有 ' + left + ' 天' : ' · 已过预产期 ' + (-left) + ' 天，宝宝出生后到「我的」改成已出生');
      return r;
    }
    if (st.mode === 'born') {
      var b = parseDate(st.birth); if (!b) return r;
      var m = (t.getFullYear() - b.getFullYear()) * 12 + (t.getMonth() - b.getMonth()) - (t.getDate() < b.getDate() ? 1 : 0);
      if (m < 0) m = 0;
      if (m < 36) {
        var best = null;
        NODES.forEach(function (n) { if (n.phase === 'baby' && n.m <= m) best = n; });
        r.id = best.id;
      } else if (m < 48) r.id = 'm36';
      else if (m < 72) r.id = 'k3';
      else if (m < 144) r.id = 'k6';
      else r.id = 'k12';
      if (m < 1) { r.ring = dayDiff(b, t) + ' 天'; r.ringSub = '新生儿'; }
      else if (m < 24) { r.ring = m + ' 个月'; r.ringSub = '月龄'; }
      else { r.ring = Math.floor(m / 12) + ' 岁'; r.ringSub = m % 12 ? (m % 12) + ' 个月' : '整'; }
      r.info = '生日 ' + st.birth;
      return r;
    }
    return r;
  }

  /* ---------- 朗读 ---------- */
  var speakingBtn = null;
  function speak(text, btn) {
    if (!('speechSynthesis' in window)) { toast('这个浏览器不支持朗读'); return; }
    var ss = window.speechSynthesis;
    if (speakingBtn) { ss.cancel(); var was = speakingBtn; stopUI(); if (was === btn) return; }
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN'; u.rate = st.elder ? 0.85 : 1;
    var v = ss.getVoices().filter(function (x) { return /zh[-_]CN/i.test(x.lang); })[0]; if (v) u.voice = v;
    u.onend = u.onerror = stopUI;
    speakingBtn = btn; if (btn) btn.classList.add('on');
    ss.speak(u);
  }
  function stopUI() { if (speakingBtn) speakingBtn.classList.remove('on'); speakingBtn = null; }
  function stopSpeak() { try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {} stopUI(); }

  /* ---------- 公共片段 ---------- */
  function top(title) {
    return '<header class="top">' + (title
      ? '<button class="back" data-act="back" aria-label="返回">' + IC.back + '返回</button>'
      : '<div class="logo">' + IC.sprout + '芽芽</div>') +
      '<button class="pill' + (st.elder ? ' on' : '') + '" data-act="elder" aria-pressed="' + !!st.elder + '">长辈模式</button></header>';
  }
  function nav(cur) {
    var tabs = [['home', '#/', '首页'], ['cards', '#/cards', '场景卡'], ['ideas', '#/ideas', '观念库'], ['me', '#/me', '我的']];
    return '<nav class="nav" aria-label="主导航">' + tabs.map(function (t) {
      return '<a href="' + t[1] + '"' + (t[0] === cur ? ' class="on" aria-current="page"' : '') + '>' + t[2] + '</a>';
    }).join('') + '</nav>';
  }
  function page(cur, inner) {
    return '<div class="wrap"><div class="blob a"></div><div class="blob b"></div>' + inner +
      '<p class="note">芽芽整理自公开的权威指南，仅作养育参考，不替代医生的面诊和建议。</p></div>' + nav(cur);
  }
  function cardItem(c) {
    return '<a class="item" href="#/card/' + c.id + '" style="text-decoration:none;color:inherit"><span class="tag">' + esc(c.cat) +
      '</span><div class="grow"><div class="tt">“' + esc(c.q) + '”</div><div class="dd">' + esc(c.why) + '</div></div>' + IC.chev + '</a>';
  }
  function setupForm(isFirst) {
    var mode = st._draft || st.mode || 'preg';
    return '<div class="card"><div style="font-weight:700">' + (isFirst ? '先告诉芽芽你在哪个阶段' : '阶段设置') + '</div>' +
      '<div class="seg" style="margin-top:12px" role="group" aria-label="阶段">' +
      [['prep', '备孕'], ['preg', '怀孕'], ['born', '已出生']].map(function (o) {
        return '<button data-act="mode" data-v="' + o[0] + '" class="' + (mode === o[0] ? 'on' : '') + '" aria-pressed="' + (mode === o[0]) + '">' + o[1] + '</button>';
      }).join('') + '</div>' +
      (mode === 'preg' ? '<label class="field"><span class="small muted">预产期（按 280 天倒推孕周）</span><input id="f-due" type="date" value="' + esc(st.due || '') + '"></label>' : '') +
      (mode === 'born' ? '<label class="field"><span class="small muted">宝宝生日</span><input id="f-birth" type="date" max="' + fmt(today()) + '" value="' + esc(st.birth || '') + '"></label>' : '') +
      '<button class="btn block" style="margin-top:16px" data-act="saveStage">' + (isFirst ? '开始使用' : '保存') + '</button></div>';
  }

  /* ---------- 页面 ---------- */
  function vHome() {
    var loc = locate();
    if (!loc.id) {
      return page('home', top() + '<h1>一家人，一起把孩子带好</h1><p class="muted" style="margin:0">按阶段看要做的事、要留意的信号，和长辈有分歧时，看看指南怎么说、话怎么讲。</p>' +
        '<div style="margin-top:18px">' + setupForm(true) + '</div>' + timeline(null));
    }
    var n = byId(NODES, loc.id);
    var todos = n.todo.slice(0, 3);
    var tiles = todos.map(function (t, i) {
      var k = n.id + ':' + i, done = !!st.done[k];
      return '<button class="tile c' + i + (done ? ' done' : '') + '" data-act="todo" data-k="' + k + '" aria-pressed="' + done + '"><span class="n">' + (done ? '✓' : (i + 1)) + '</span><span class="x">' + esc(t.t) + '</span></button>';
    }).join('');
    var cid = n.cards[0] || (n.id === 'prep' ? 'undermine' : 'screen');
    var c = byId(CARDS, cid);
    return page('home', top() +
      '<section class="hero"><div class="ring"><span style="font-size:1.25rem;font-weight:800;color:var(--brand)">' + esc(loc.ring) + '</span><b class="muted">' + esc(loc.ringSub) + '</b></div>' +
      '<div style="min-width:0"><div class="t">' + esc(n.title) + (n.rough ? ' <span class="tag rough">粗略版</span>' : '') + '</div><div class="s">' + esc(loc.info) + '</div>' +
      '<a href="#/stage/' + n.id + '" class="small" style="font-weight:700">看本阶段详情 →</a></div></section>' +
      '<h2>本阶段先做这 ' + todos.length + ' 件</h2><div class="tiles">' + tiles + '</div>' +
      (c ? '<h2>和长辈可能聊到</h2><a class="card" href="#/card/' + c.id + '" style="display:block;text-decoration:none;color:inherit"><span class="tag">' + esc(c.cat) + '</span><div class="quote" style="margin-top:8px">“' + esc(c.q) + '”</div><p class="muted small" style="margin:6px 0 12px">' + esc(c.why) + '</p><span class="btn ghost">看看怎么说</span></a>' : '') +
      '<a class="item" href="#/pact" style="margin-top:12px;text-decoration:none;color:inherit"><div class="grow"><div class="tt">我家约定</div><div class="dd">8 道题理清全家的养育方向，生成图片发家庭群</div></div>' + IC.chev + '</a>' +
      timeline(n.id));
  }
  function timeline(curId) {
    var curIdx = -1; NODES.forEach(function (n, i) { if (n.id === curId) curIdx = i; });
    var out = '<h2>全部阶段</h2>', lastPhase = '';
    NODES.forEach(function (n, i) {
      if (n.phase !== lastPhase) { out += (lastPhase ? '</div>' : '') + '<div class="phase">' + PHASE[n.phase] + '</div><div class="list">'; lastPhase = n.phase; }
      var cls = i === curIdx ? 'cur' : (curIdx >= 0 && i < curIdx ? 'past' : '');
      out += '<a class="item' + (i === curIdx ? ' cur' : '') + '" href="#/stage/' + n.id + '" style="text-decoration:none;color:inherit"' + (i === curIdx ? ' aria-current="step"' : '') + '><span class="dot ' + cls + '"></span><div class="grow"><div class="tt">' + esc(n.title) + (i === curIdx ? '（现在）' : '') + '</div><div class="dd">' + esc(n.sub || n.todo.map(function (t) { return t.t; }).join(' · ')) + '</div></div>' + IC.chev + '</a>';
    });
    return out + '</div>';
  }

  function vStage(id) {
    var n = byId(NODES, id); if (!n) return vNotFound();
    var isCur = locate().id === id;
    var h = top(true) + '<div class="row" style="justify-content:space-between;align-items:flex-start"><div style="min-width:0"><h1>' + esc(n.title) + '</h1><div class="muted small">' +
      esc(n.sub || PHASE[n.phase]) + (isCur ? ' · 你现在在这里' : '') + '</div></div><button class="ibtn" style="margin-top:16px" data-act="speakStage" aria-label="朗读本页">' + IC.speak + '</button></div>';
    if (n.rough) h += '<p class="small muted">3 岁以后是粗略版，只列关键的睡眠、户外、疫苗与沟通要点。</p>';
    if (n.baby.length) {
      var ms = n.phase === 'baby' && n.baby.length >= 4;
      h += '<h2>' + (n.phase === 'preg' ? '宝宝在长' : n.phase === 'kid' ? '这个阶段的孩子' : '宝宝大多会') + '</h2><div class="card"><ul class="plain">' + n.baby.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' +
        (ms ? '<div class="src">“大多会”指约 75% 的孩子到这个月龄能做到，没做到不等于有问题。</div>' + srcHtml(['cdc_ms']) : '') + '</div>';
    }
    if (n.mom.length) h += '<h2>' + (n.phase === 'prep' ? '准备什么' : '妈妈和家里') + '</h2><div class="card"><ul class="plain">' + n.mom.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul></div>';
    if (n.warn.length) h += '<h2>需要关注</h2><div class="warnbox"><div class="h">' + IC.warn + '出现任何一条，尽快找儿保医生评估</div><ul class="plain warn">' + n.warn.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' + srcHtml(['cn_warn']) + '</div>';
    if (n.todo.length) h += '<h2>要做的</h2><div class="card" style="padding-top:4px;padding-bottom:4px">' + n.todo.map(function (t, i) {
      var k = n.id + ':' + i, done = !!st.done[k];
      return '<div class="check' + (done ? ' done' : '') + '"><input type="checkbox" id="t-' + k.replace(':', '-') + '" data-act="todo" data-k="' + k + '"' + (done ? ' checked' : '') + ' aria-label="' + esc(t.t) + '"><div style="min-width:0"><label class="tt" for="t-' + k.replace(':', '-') + '">' + esc(t.t) + '</label><div class="dd">' + esc(t.d) + '</div>' + srcHtml(t.s) +
        (t.link === 'pact' ? '<a href="#/pact" class="small" style="font-weight:700">去填「我家约定」→</a>' : '') + '</div></div>';
    }).join('') + '</div>';
    if (n.vac.length) h += '<h2>疫苗</h2><div class="card">' + n.vac.map(function (v) { return '<div class="vac"><span class="at">' + esc(v.at) + '</span><span>' + esc(v.v) + '</span></div>'; }).join('') +
      '<div class="src">国家免疫规划疫苗，具体以接种点通知为准；非免疫规划疫苗可咨询接种医生。</div>' + srcHtml(['cn_vac26']) + '</div>';
    if (n.cards.length) h += '<h2>相关场景卡</h2><div class="list">' + n.cards.map(function (c) { return cardItem(byId(CARDS, c)); }).join('') + '</div>';
    return page('home', h);
  }
  function stageText(n) {
    var parts = [n.title + '。'];
    if (n.baby.length) parts.push(n.baby.join('。') + '。');
    if (n.warn.length) parts.push('需要关注：' + n.warn.join('；') + '。');
    if (n.todo.length) parts.push('要做的：' + n.todo.map(function (t) { return t.t + '，' + t.d; }).join('。'));
    if (n.vac.length) parts.push('疫苗：' + n.vac.map(function (v) { return v.at + '，' + v.v; }).join('；') + '。');
    return parts.join('');
  }

  var cardCat = '全部';
  function vCards() {
    var list = CARDS.filter(function (c) { return cardCat === '全部' || c.cat === cardCat; });
    return page('cards', top() + '<h1>隔代场景卡</h1><p class="muted small" style="margin:0">老人常说的话，背后的心意、指南的说法，和一句能直接说出口的话。</p>' +
      '<div class="chips" style="margin-top:14px" role="group" aria-label="分类">' + ['全部'].concat(CATS).map(function (c) {
        var cnt = c === '全部' ? CARDS.length : CARDS.filter(function (x) { return x.cat === c; }).length;
        return '<button class="chip' + (c === cardCat ? ' on' : '') + '" data-act="cat" data-v="' + c + '" aria-pressed="' + (c === cardCat) + '">' + c + ' ' + cnt + '</button>';
      }).join('') + '</div><div class="list" style="margin-top:8px">' + list.map(cardItem).join('') + '</div>');
  }
  function vCard(id) {
    var c = byId(CARDS, id); if (!c) return vNotFound();
    var related = NODES.filter(function (n) { return n.cards.indexOf(id) >= 0; });
    return page('cards', top(true) + '<div style="margin-top:16px"><span class="tag">' + esc(c.cat) + '</span></div><div class="quote" style="margin-top:8px">老人说：“' + esc(c.q) + '”</div>' +
      '<h2>理解老人</h2><div class="card"><p style="margin:0">' + esc(c.why) + '</p></div>' +
      '<h2>指南怎么说</h2><div class="card">' + c.facts.map(function (f) {
        return '<div class="fact"><span class="tag ' + (f.r === '国内' ? 'cn' : 'intl') + '">' + esc(f.r) + '</span><p>' + esc(f.t) + '</p>' + srcHtml([f.s]) + '</div>';
      }).join('') + '</div>' +
      '<h2>可以这样说</h2><div class="say">' + esc(c.say) + '</div><div class="row" style="margin-top:10px"><button class="btn" data-act="speakSay">' + IC.speak + '读出来</button><button class="btn ghost" data-act="copySay">' + IC.copy + '复制</button></div>' +
      '<h2>可以弹性的地方</h2><div class="card" style="background:var(--green-soft)"><p style="margin:0">' + esc(c.flex) + '</p></div>' +
      (related.length ? '<h2>出现在这些阶段</h2><div class="chips">' + related.map(function (n) { return '<a class="chip" style="display:inline-flex;align-items:center;text-decoration:none;color:inherit" href="#/stage/' + n.id + '">' + esc(n.title) + '</a>'; }).join('') + '</div>' : ''));
  }

  function vIdeas() {
    return page('ideas', top() + '<h1>观念库</h1><p class="muted small" style="margin:0">先把方向想清楚，具体的事就好商量。</p>' +
      '<a class="card" href="#/pact" style="display:block;margin-top:14px;text-decoration:none;color:inherit;background:var(--peach-soft)"><div style="font-weight:800;color:var(--brand)">我家约定</div><div class="small muted">8 道题，全家一起选，生成一张图发家庭群</div></a>' +
      '<div class="list" style="margin-top:12px">' + IDEAS.map(function (x) {
        return '<a class="item" href="#/idea/' + x.id + '" style="text-decoration:none;color:inherit"><span class="tag intl">' + esc(x.k) + '</span><div class="grow"><div class="tt">' + esc(x.t) + '</div></div>' + IC.chev + '</a>';
      }).join('') + '</div>');
  }
  function vIdea(id) {
    var x = byId(IDEAS, id); if (!x) return vNotFound();
    return page('ideas', top(true) + '<div class="row" style="justify-content:space-between;align-items:flex-start"><h1 style="min-width:0">' + esc(x.t) + '</h1><button class="ibtn" style="margin-top:16px" data-act="speakIdea" aria-label="朗读本页">' + IC.speak + '</button></div>' +
      '<span class="tag intl">' + esc(x.k) + '</span><div class="card para" style="margin-top:12px">' + x.p.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + srcHtml(x.s) + '</div>' +
      (id === 'team' || id === 'styles' ? '<a class="btn block" style="margin-top:14px;text-decoration:none" href="#/pact">去填「我家约定」</a>' : ''));
  }

  function vPact() {
    var n = PACT.filter(function (q) { return st.pact[q.id] != null; }).length;
    return page('ideas', top(true) + '<h1>我家约定</h1><p class="muted small" style="margin:0">一家人一起选。已选 ' + n + ' / ' + PACT.length + '。</p>' +
      PACT.map(function (q, i) {
        return '<div class="card" style="margin-top:12px"><div style="font-weight:700">' + (i + 1) + '. ' + esc(q.q) + '</div><div class="opt" role="group" aria-label="' + esc(q.q) + '">' + q.o.map(function (o, j) {
          var on = st.pact[q.id] === j;
          return '<button class="' + (on ? 'on' : '') + '" data-act="pact" data-q="' + q.id + '" data-v="' + j + '" aria-pressed="' + on + '">' + esc(o) + '</button>';
        }).join('') + '</div></div>';
      }).join('') +
      '<button class="btn block" style="margin-top:16px' + (n ? '' : ';opacity:.5') + '" data-act="pactImg"' + (n ? '' : ' disabled') + '>生成约定图</button>' +
      '<p class="small muted" style="text-align:center">没选的题不会出现在图里。</p>');
  }

  var resetArmed = false;
  function vMe() {
    var srcs = Object.keys(SRC).map(function (k) { var s = SRC[k]; return '<li><a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.n) + '</a><div class="small muted">' + esc(s.o) + ' · ' + esc(s.d) + '</div></li>'; }).join('');
    return page('me', top() + '<h1>我的</h1>' + setupForm(false) +
      '<h2>阅读</h2><div class="card"><div class="row" style="justify-content:space-between"><div><div style="font-weight:700">长辈模式</div><div class="small muted">字号放大，朗读语速放慢</div></div><button class="btn' + (st.elder ? '' : ' ghost') + '" data-act="elder" aria-pressed="' + !!st.elder + '">' + (st.elder ? '已开启' : '开启') + '</button></div></div>' +
      '<h2>来源（共 ' + Object.keys(SRC).length + ' 条，核实于 2026-10-18）</h2><div class="card"><ul class="plain">' + srcs + '</ul></div>' +
      '<h2>说明</h2><div class="card para"><p>芽芽的内容整理自国家卫健委、国家疾控局、中国营养学会、WHO、美国儿科学会等公开指南，每条都标了来源。</p><p><b>芽芽不替代医生。</b>孩子出现发热、精神差、预警征象等情况，请及时就医或咨询儿保医生；疫苗以接种点通知为准；政策以当地最新文件为准。</p><p>你的选择只保存在这台设备的浏览器里，不会上传。</p></div>' +
      '<button class="btn ghost block" style="margin-top:14px" data-act="reset">' + (resetArmed ? '再点一次确认清除' : '清除本机数据') + '</button>');
  }
  function vNotFound() { return page('home', top(true) + '<h1>没有找到这一页</h1><a class="btn" href="#/">回首页</a>'); }

  /* ---------- 分享图 ---------- */
  function wrapText(ctx, text, maxW) {
    var lines = [], line = '';
    for (var i = 0; i < text.length; i++) {
      var t = line + text[i];
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = text[i]; } else line = t;
    }
    if (line) lines.push(line); return lines;
  }
  function pactImage() {
    var W = 750, P = 56, F = '-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
    var items = PACT.filter(function (q) { return st.pact[q.id] != null; }).map(function (q) { return [q.q, q.o[st.pact[q.id]]]; });
    var c = document.createElement('canvas'), ctx = c.getContext('2d');
    ctx.font = '600 30px ' + F;
    var blocks = items.map(function (it) { return { q: it[0], a: wrapText(ctx, it[1], W - P * 2 - 48) }; });
    var H = 250 + blocks.reduce(function (s, b) { return s + 60 + b.a.length * 44 + 24; }, 0) + 120;
    c.width = W; c.height = H;
    ctx.fillStyle = '#FFF8F0'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FDE6D6'; ctx.beginPath(); ctx.arc(30, 120, 110, 0, 7); ctx.fill();
    ctx.fillStyle = '#E3EFFA'; ctx.beginPath(); ctx.arc(W - 20, 40, 100, 0, 7); ctx.fill();
    ctx.fillStyle = '#B4572A'; ctx.font = '800 56px ' + F; ctx.fillText('我家约定', P, 120);
    ctx.fillStyle = '#7A6C64'; ctx.font = '28px ' + F; ctx.fillText('一家人商量好的养育方向 · ' + fmt(today()), P, 170);
    var y = 220;
    blocks.forEach(function (b, i) {
      var h = 60 + b.a.length * 44 + 24;
      ctx.fillStyle = '#FFFFFF'; roundRect(ctx, P, y, W - P * 2, h - 16, 24); ctx.fill();
      ctx.fillStyle = '#7A6C64'; ctx.font = '26px ' + F; ctx.fillText((i + 1) + '. ' + b.q, P + 24, y + 44);
      ctx.fillStyle = '#4A3F3A'; ctx.font = '600 30px ' + F;
      b.a.forEach(function (l, j) { ctx.fillText(l, P + 24, y + 90 + j * 44); });
      y += h;
    });
    ctx.fillStyle = '#B4572A'; ctx.font = '700 28px ' + F; ctx.fillText('芽芽 · 一家人一起带娃', P, H - 60);
    ctx.fillStyle = '#7A6C64'; ctx.font = '22px ' + F; ctx.fillText('健康安全问题以医生和权威指南为准', P, H - 26);
    return c;
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function showSheet(canvas) {
    var url = canvas.toDataURL('image/png');
    var el = document.createElement('div'); el.className = 'sheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '约定图');
    el.innerHTML = '<img alt="我家约定图片" src="' + url + '"><div class="tip">长按图片保存，或发给家人</div><div class="row">' +
      (navigator.share ? '<button class="btn" data-x="share">分享</button>' : '') + '<button class="btn ghost" data-x="close">关闭</button></div>';
    el.addEventListener('click', function (e) {
      var x = e.target.closest('[data-x]'); if (!x && e.target !== el) return;
      if (x && x.dataset.x === 'share') {
        canvas.toBlob(function (blob) {
          var file = new File([blob], '我家约定.png', { type: 'image/png' });
          var data = navigator.canShare && navigator.canShare({ files: [file] }) ? { files: [file], title: '我家约定' } : { title: '我家约定', text: '我家约定 · 芽芽' };
          navigator.share(data).catch(function () {});
        });
        return;
      }
      el.remove();
    });
    document.body.appendChild(el);
  }

  /* ---------- 路由 ---------- */
  function route() {
    stopSpeak();
    var h = (location.hash || '#/').slice(1).split('/').filter(Boolean);
    var html;
    switch (h[0]) {
      case undefined: html = vHome(); break;
      case 'stage': html = vStage(h[1]); break;
      case 'cards': html = vCards(); break;
      case 'card': html = vCard(h[1]); break;
      case 'ideas': html = vIdeas(); break;
      case 'idea': html = vIdea(h[1]); break;
      case 'pact': html = vPact(); break;
      case 'me': html = vMe(); break;
      default: html = vNotFound();
    }
    app.innerHTML = html;
    var h1 = app.querySelector('h1'); document.title = (h1 && h[0] ? h1.textContent + ' · ' : '') + '芽芽';
  }
  function rerender() { var y = window.scrollY; route(); window.scrollTo(0, y); }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var a = b.dataset.act, parts = (location.hash || '#/').slice(1).split('/').filter(Boolean);
    if (a === 'todo') {
      if (b.tagName !== 'INPUT') e.preventDefault();
      var k = b.dataset.k; if (st.done[k]) delete st.done[k]; else st.done[k] = 1; save(); rerender();
    } else if (a === 'back') { if (history.length > 1) history.back(); else location.hash = '#/'; }
    else if (a === 'elder') { st.elder = !st.elder; save(); applyElder(); rerender(); }
    else if (a === 'mode') { st._draft = b.dataset.v; rerender(); }
    else if (a === 'saveStage') {
      var mode = st._draft || st.mode || 'preg', due = document.getElementById('f-due'), birth = document.getElementById('f-birth');
      if (mode === 'preg') {
        var d = parseDate(due && due.value); if (!d) { toast('请填写预产期'); return; }
        var gd = 280 - dayDiff(today(), d); if (gd < 0 || gd > 300) { toast('预产期看起来不对，请再核对一下'); return; }
        st.due = due.value;
      }
      if (mode === 'born') {
        var bd = parseDate(birth && birth.value); if (!bd) { toast('请填写宝宝生日'); return; }
        if (bd > today()) { toast('生日不能晚于今天'); return; }
        st.birth = birth.value;
      }
      st.mode = mode; delete st._draft; save(); toast('已保存'); location.hash = '#/'; if (!parts.length) rerender();
    }
    else if (a === 'cat') { cardCat = b.dataset.v; rerender(); }
    else if (a === 'speakSay') { speak(byId(CARDS, parts[1]).say, b); }
    else if (a === 'copySay') {
      var t = byId(CARDS, parts[1]).say;
      try { navigator.clipboard.writeText(t).then(function () { toast('已复制'); }, function () { toast('复制失败，可长按文字复制'); }); }
      catch (err) { toast('复制失败，可长按文字复制'); }
    }
    else if (a === 'speakStage') { speak(stageText(byId(NODES, parts[1])), b); }
    else if (a === 'speakIdea') { var x = byId(IDEAS, parts[1]); speak(x.t + '。' + x.p.join(''), b); }
    else if (a === 'pact') { var q = b.dataset.q, v = +b.dataset.v; if (st.pact[q] === v) delete st.pact[q]; else st.pact[q] = v; save(); rerender(); }
    else if (a === 'pactImg') { showSheet(pactImage()); }
    else if (a === 'reset') {
      if (!resetArmed) { resetArmed = true; rerender(); setTimeout(function () { resetArmed = false; }, 4000); return; }
      resetArmed = false; st = { done: {}, pact: {} }; save(); applyElder(); toast('已清除'); location.hash = '#/'; rerender();
    }
  });
  function applyElder() { document.documentElement.classList.toggle('elder', !!st.elder); }

  window.addEventListener('hashchange', function () { delete st._draft; route(); window.scrollTo(0, 0); });
  applyElder(); route();

  /* ---------- PWA：注册 SW，新版本自动刷新 ---------- */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    try {
      var hadCtrl = !!(navigator.serviceWorker && navigator.serviceWorker.controller), reloaded = false;
      navigator.serviceWorker.register('sw.js').then(function (reg) { reg.update && reg.update(); }).catch(function () {});
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!hadCtrl || reloaded) { hadCtrl = true; return; }
        reloaded = true; location.reload();
      });
    } catch (e) {}
  }
})();
