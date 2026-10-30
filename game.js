(() => {
  "use strict";

  const STORAGE_KEY = "market-god-engine-save";
  const zones = [
    { id: "new-york", label: "New York", multiplier: 1.1 },
    { id: "london", label: "London", multiplier: 1.0 },
    { id: "tokyo", label: "Tokyo", multiplier: 1.2 },
    { id: "hong-kong", label: "Hong Kong", multiplier: 1.15 },
    { id: "dubai", label: "Dubai", multiplier: 1.3 }
  ];
  const builds = [
    { id: "Scalper", label: "Scalper", description: "Fast combo gain", theme: "⚡", speed: 1.4, risk: .85 },
    { id: "Swing Trader", label: "Swing Trader", description: "Balanced gameplay", theme: "🌊", speed: 1, risk: 1 },
    { id: "Whale", label: "Whale", description: "Huge price movement", theme: "🐋", speed: .7, risk: 1.6 }
  ];
  const events = [
    { id: "Bull", icon: "📈", label: "Bull", description: "A rally pushes the market upward." },
    { id: "Bear", icon: "📉", label: "Bear", description: "Bear pressure pulls the market down." },
    { id: "Liquidity Raid", icon: "⚠️", label: "Liquidity Raid", description: "Market depth collapses abruptly." },
    { id: "Black Swan", icon: "🌑", label: "Black Swan", description: "An unexpected shock hits the system." }
  ];
  const tradersSeed = [
    { name: "Alex", style: "FAST EXECUTION", icon: "⚡", memory: [] },
    { name: "Mina", style: "DATA SPECIALIST", icon: "◈", memory: [] },
    { name: "Rex", style: "HIGH RISK", icon: "🐺", memory: [] },
    { name: "Yuki", style: "CALM STRATEGIST", icon: "❄️", memory: [] }
  ];
  const dialogues = {
    Bull: ["FOMO is real.", "Feels like green all the way.", "This bull run is addictive."],
    Bear: ["Too many bears.", "Market PTSD kicking in.", "I am seeing red everywhere."],
    "Liquidity Raid": ["Watch the depth dry up.", "Banks are hunting liquidity.", "This raid is brutal."],
    "Black Swan": ["That was not in the model.", "The algorithm is broken.", "Risk is everywhere."]
  };
  const leaders = {
    Bull: ["Beautiful economy!", "WEEEEEEEEEEEE 📈", "📈"],
    Bear: ["Total disaster!", "Market panic wave 🌪️", "📉"],
    "Liquidity Raid": ["We are monitoring the situation.", "Central bank pressure ⚡", "⚠️"],
    "Black Swan": ["Unexpected global event...", "System shock detected 🐋", "🌑"]
  };
  const impacts = {
    Bull: { price: 180, combo: 1, score: 1 },
    Bear: { price: -160, combo: 1, score: -1 },
    "Liquidity Raid": { price: -240, combo: 2, score: -2 },
    "Black Swan": { price: -360, combo: -1, score: -3 }
  };
  const achievements = [
    { id: "Market God", icon: "👑", desc: "Reach a score of 10 or more." },
    { id: "Combo Master", icon: "⚡", desc: "Build a combo of 12 or more." },
    { id: "Bull King", icon: "📈", desc: "Reach a score of 5 or more." },
    { id: "Survivor", icon: "🛡️", desc: "Finish an event with a positive score." },
    { id: "Whale", icon: "🐋", desc: "Select the Whale trader build." }
  ];
  const initial = () => ({
    price: 2000, combo: 0, score: 0, zoneId: "new-york", buildId: "Swing Trader",
    history: [{ price: 2000, label: "Start" }], eventLog: [], unlockedAchievements: [],
    activeTraderIndex: 0, leaderEvent: "Bull",
    traders: tradersSeed.map(t => ({ ...t, memory: [] }))
  });
  let state = initial();
  let toastTimer = null;
  let bossTimer = null;

  const $ = id => document.getElementById(id);
  const number = value => Math.round(value).toLocaleString("en-US");
  const money = value => "$" + number(value);
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const currentZone = () => zones.find(z => z.id === state.zoneId) || zones[0];
  const currentBuild = () => builds.find(b => b.id === state.buildId) || builds[1];
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object" || !Number.isFinite(saved.price) || !Array.isArray(saved.history)) return;
      const base = initial();
      state = {
        ...base,
        price: clamp(saved.price, 100, 9999),
        combo: Number.isFinite(saved.combo) ? Math.max(0, saved.combo) : 0,
        score: Number.isFinite(saved.score) ? saved.score : 0,
        zoneId: zones.some(z => z.id === saved.zoneId) ? saved.zoneId : base.zoneId,
        buildId: builds.some(b => b.id === saved.buildId) ? saved.buildId : base.buildId,
        history: saved.history.filter(p => p && Number.isFinite(p.price)).slice(-20).length ? saved.history.filter(p => p && Number.isFinite(p.price)).slice(-20) : base.history,
        eventLog: Array.isArray(saved.eventLog) ? saved.eventLog.filter(e => e && typeof e.type === "string" && e.impact).slice(0, 5) : [],
        unlockedAchievements: Array.isArray(saved.unlockedAchievements) ? saved.unlockedAchievements.filter(a => achievements.some(x => x.id === a)) : [],
        activeTraderIndex: Number.isInteger(saved.activeTraderIndex) ? ((saved.activeTraderIndex % tradersSeed.length) + tradersSeed.length) % tradersSeed.length : 0,
        leaderEvent: leaders[saved.leaderEvent] ? saved.leaderEvent : "Bull",
        traders: tradersSeed.map((trader, i) => ({
          ...trader,
          memory: Array.isArray(saved.traders?.[i]?.memory) ? saved.traders[i].memory.filter(e => Object.hasOwn(impacts, e)).slice(0, 5) : []
        }))
      };
    } catch (_) {
      // A damaged or unavailable save must never prevent a new session.
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        price: state.price, combo: state.combo, score: state.score,
        zoneId: state.zoneId, buildId: state.buildId, history: state.history,
        eventLog: state.eventLog, unlockedAchievements: state.unlockedAchievements,
        activeTraderIndex: state.activeTraderIndex, leaderEvent: state.leaderEvent, traders: state.traders
      }));
    } catch (_) {
      showToast("Local save unavailable — session is still playable.");
    }
  }

  function dialogueFor(trader) {
    const m = trader.memory;
    const count = key => m.filter(e => e === key).length;
    if (count("Bull") >= 3) return "FOMO has taken over.";
    if (count("Bear") >= 2) return "Too many bears, market PTSD.";
    if (count("Liquidity Raid") >= 2) return "Liquidity is being hunted.";
    if (count("Black Swan") >= 1) return "The model did not see that coming.";
    if (m[0]) {
      const options = dialogues[m[0]];
      return options[m.length % options.length];
    }
    return "Watching the data stream.";
  }

  function awardAchievements() {
    const earned = [];
    const checks = {
      "Market God": state.score >= 10,
      "Combo Master": state.combo >= 12,
      "Bull King": state.score >= 5,
      "Survivor": state.score > 0,
      "Whale": state.buildId === "Whale"
    };
    achievements.forEach(a => {
      if (checks[a.id] && !state.unlockedAchievements.includes(a.id)) {
        state.unlockedAchievements.push(a.id);
        earned.push(a.id);
      }
    });
    if (earned.length) showToast("Achievement unlocked: " + earned.join(" · "));
  }

  function showToast(message) {
    const node = $("toast");
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("show"), 2600);
  }

  function showBoss(type) {
    const boss = type === "Liquidity Raid"
      ? { title: "JPOW", subtitle: "THE FED OVERLORD", description: "Liquidity Raid is on. Brace for systemic force." }
      : { title: "BLACK SWAN", subtitle: "GLOBAL SHOCK", description: "An unexpected world event crashed the market." };
    $("boss-title").textContent = boss.title;
    $("boss-subtitle").textContent = boss.subtitle;
    $("boss-description").textContent = boss.description + " Market shock is active. This event will reshape every indicator.";
    $("boss-overlay").hidden = false;
    clearTimeout(bossTimer);
    bossTimer = setTimeout(() => { $("boss-overlay").hidden = true; }, 2600);
  }

  function showEnding() {
    let ending = null;
    if (state.score >= 10) ending = { title: "GOD", subtitle: "You control the market.", icon: "👑" };
    else if (state.score >= 5) ending = { title: "RICH", subtitle: "You mastered profit.", icon: "💰" };
    else if (state.score <= -10) ending = { title: "CORRUPTED", subtitle: "You became the manipulation.", icon: "🐋" };
    else if (state.score <= -5) ending = { title: "BROKE", subtitle: "Market destroyed you.", icon: "📉" };
    if (!ending) { $("ending-overlay").hidden = true; return; }
    $("ending-icon").textContent = ending.icon;
    $("ending-title").textContent = ending.title;
    $("ending-subtitle").textContent = ending.subtitle;
    $("ending-overlay").hidden = false;
  }

  function triggerEvent(type) {
    const base = impacts[type];
    if (!base) return;
    const build = currentBuild();
    const zone = currentZone();
    const random = () => .92 + Math.random() * .16;
    const adjusted = {
      price: Math.round(Math.round(base.price * zone.multiplier * build.risk) * random()),
      combo: Math.round(Math.round(base.combo * build.speed) * random()),
      score: Math.round(Math.round(base.score * build.risk) * random())
    };
    state.price = clamp(state.price + adjusted.price, 100, 9999);
    state.combo = Math.max(0, state.combo + adjusted.combo);
    state.score += adjusted.score;
    state.history.push({ price: state.price, label: type });
    state.history = state.history.slice(-20);
    state.eventLog.unshift({ type, impact: adjusted, time: Date.now() });
    state.eventLog = state.eventLog.slice(0, 5);
    state.leaderEvent = type;
    state.activeTraderIndex = (state.activeTraderIndex + 1) % state.traders.length;
    state.traders = state.traders.map(t => ({ ...t, memory: [type, ...t.memory].slice(0, 5) }));
    awardAchievements();
    save();
    render();
    if (type === "Liquidity Raid" || type === "Black Swan") showBoss(type);
    showEnding();
  }

  function selectZone(id) {
    if (!zones.some(z => z.id === id)) return;
    state.zoneId = id; save(); render();
  }
  function selectBuild(id) {
    if (!builds.some(b => b.id === id)) return;
    state.buildId = id; awardAchievements(); save(); render();
  }
  function resetGame() {
    if (!window.confirm("Reset the simulation and clear your saved progress?")) return;
    state = initial();
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    $("boss-overlay").hidden = true;
    $("ending-overlay").hidden = true;
    render();
    showToast("Simulation reset. Fresh market, fresh start.");
  }

  function renderChoices() {
    $("zone-options").innerHTML = zones.map(z => {
      const selected = z.id === state.zoneId;
      return '<button class="choice-button' + (selected ? ' selected' : '') + '" type="button" data-zone="' + z.id + '" aria-pressed="' + selected + '"><span class="choice-name">' + z.label + (selected ? '<span class="check">✓</span>' : '') + '</span><span class="choice-detail">×' + z.multiplier.toFixed(2) + ' IMPACT</span></button>';
    }).join("");
    $("build-options").innerHTML = builds.map(b => {
      const selected = b.id === state.buildId;
      return '<button class="choice-button' + (selected ? ' selected' : '') + '" type="button" data-build="' + escapeHTML(b.id) + '" aria-pressed="' + selected + '"><span class="choice-name">' + b.theme + ' ' + b.label + (selected ? '<span class="check">✓</span>' : '') + '</span><span class="choice-detail">' + b.description + '</span></button>';
    }).join("");
    $("event-options").innerHTML = events.map(e => '<button class="event-button ' + (e.id === "Black Swan" ? "black-swan" : "") + '" type="button" data-event="' + e.id + '"><span class="event-icon">' + e.icon + '</span><strong>' + e.label + '</strong><small>' + e.description + '</small></button>').join("");
  }

  function renderStats() {
    $("price-value").textContent = money(state.price);
    $("combo-value").textContent = number(state.combo);
    $("score-value").textContent = state.score > 0 ? "+" + number(state.score) : number(state.score);
    $("price-foot").textContent = state.price >= 2000 ? "Above market baseline" : "Below market baseline";
    $("combo-foot").textContent = state.combo >= 10 ? "STREAK MODE ACTIVE" : state.combo > 0 ? "Momentum building" : "Build your momentum";
    $("score-foot").textContent = state.score > 0 ? "Profit territory" : state.score < 0 ? "Loss territory" : "No position yet";
    $("chart-last").textContent = "LATEST · " + money(state.price);
  }

  function renderLeader() {
    const info = leaders[state.leaderEvent] || leaders.Bull;
    $("leader-card").innerHTML = '<div class="leader-icon">' + info[2] + '</div><div><div class="leader-label">WORLD LEADER / MARKET RESPONSE</div><div class="leader-title">' + info[0] + '</div><div class="leader-reaction">' + info[1] + '</div></div>';
  }

  function renderTrader() {
    const trader = state.traders[state.activeTraderIndex];
    $("trader-card").innerHTML = '<div class="trader-card"><div class="trader-avatar">' + trader.icon + '</div><div class="trader-info"><div class="trader-name">' + trader.name + '</div><div class="trader-style">' + trader.style + '</div><div class="trader-quote">“' + dialogueFor(trader) + '”</div></div><span class="trader-pulse">' + (trader.memory[0] || "CALIBRATING").toUpperCase() + '</span></div>';
  }

  function renderLog() {
    if (!state.eventLog.length) {
      $("event-log").innerHTML = '<div class="log-empty">No market pulses recorded. Trigger an event to begin.</div>';
      return;
    }
    $("event-log").innerHTML = state.eventLog.map(log => {
      const p = log.impact.price, s = log.impact.score;
      return '<article class="log-item"><div class="log-type">' + escapeHTML(log.type) + '</div><div class="log-impact"><span class="' + (p >= 0 ? "positive" : "negative") + '">PRICE ' + (p > 0 ? "+" : "") + p + '</span><span class="' + (s >= 0 ? "positive" : "negative") + '">SCORE ' + (s > 0 ? "+" : "") + s + '</span></div></article>';
    }).join("");
  }

  function renderAchievements() {
    const unlocked = state.unlockedAchievements;
    $("achievement-count").textContent = unlocked.length + " / " + achievements.length;
    $("achievement-list").innerHTML = achievements.map(a => {
      const done = unlocked.includes(a.id);
      return '<div class="achievement-item' + (done ? " unlocked" : "") + '"><span class="achievement-icon">' + a.icon + '</span><div><div class="achievement-name">' + a.id + '</div><div class="achievement-desc">' + a.desc + '</div></div><span class="achievement-status">' + (done ? "UNLOCKED" : "LOCKED") + '</span></div>';
    }).join("");
  }

  function drawChart() {
    const canvas = $("price-chart");
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    const pad = { l: 12, r: 12, t: 18, b: 22 };
    const points = state.history.slice(-20);
    const values = points.map(p => p.price);
    let min = Math.min(...values), max = Math.max(...values);
    if (max - min < 100) { min -= 60; max += 60; }
    const range = max - min || 1;
    const x = i => pad.l + (points.length < 2 ? (w - pad.l - pad.r) / 2 : i * (w - pad.l - pad.r) / (points.length - 1));
    const y = value => pad.t + (max - value) / range * (h - pad.t - pad.b);
    ctx.clearRect(0, 0, w, h);
    ctx.font = "9px DM Mono, monospace";
    ctx.fillStyle = "rgba(128,146,172,.65)";
    ctx.strokeStyle = "rgba(151,177,216,.10)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const yy = pad.t + i * (h - pad.t - pad.b) / 3;
      ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(w - pad.r, yy); ctx.stroke();
      const val = max - i * range / 3;
      ctx.fillText("$" + Math.round(val).toLocaleString("en-US"), pad.l + 3, yy - 5);
    }
    if (points.length === 1) {
      ctx.fillStyle = "#42d9f5"; ctx.beginPath(); ctx.arc(x(0), y(points[0].price), 4, 0, Math.PI * 2); ctx.fill();
      return;
    }
    const gradient = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
    gradient.addColorStop(0, "rgba(66,217,245,.22)");
    gradient.addColorStop(1, "rgba(66,217,245,0)");
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(x(i), y(p.price)) : ctx.moveTo(x(i), y(p.price)));
    ctx.lineTo(x(points.length - 1), h - pad.b); ctx.lineTo(x(0), h - pad.b); ctx.closePath();
    ctx.fillStyle = gradient; ctx.fill();
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(x(i), y(p.price)) : ctx.moveTo(x(i), y(p.price)));
    ctx.strokeStyle = "#42d9f5"; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.shadowColor = "rgba(66,217,245,.45)"; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;
    const last = points.length - 1;
    ctx.beginPath(); ctx.arc(x(last), y(points[last].price), 4, 0, Math.PI * 2); ctx.fillStyle = "#dffaff"; ctx.fill();
    ctx.beginPath(); ctx.arc(x(last), y(points[last].price), 8, 0, Math.PI * 2); ctx.strokeStyle = "rgba(66,217,245,.4)"; ctx.lineWidth = 1; ctx.stroke();
  }

  function render() {
    renderChoices(); renderStats(); renderLeader(); renderTrader(); renderLog(); renderAchievements();
    requestAnimationFrame(drawChart);
  }

  document.addEventListener("click", event => {
    const zone = event.target.closest("[data-zone]");
    const build = event.target.closest("[data-build]");
    const marketEvent = event.target.closest("[data-event]");
    if (zone) selectZone(zone.dataset.zone);
    if (build) selectBuild(build.dataset.build);
    if (marketEvent) triggerEvent(marketEvent.dataset.event);
    if (event.target.closest("[data-close-overlay]")) $("boss-overlay").hidden = true;
  });
  $("reset-button").addEventListener("click", resetGame);
  $("ending-reset").addEventListener("click", resetGame);
  window.addEventListener("resize", () => requestAnimationFrame(drawChart));
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

  load();
  render();
})();