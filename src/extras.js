// extras.js: the optional delight layer. Loaded after app.js; the site works without it.
// No network requests, no tracking. Achievements and sound volume live only in this browser.
(() => {
  "use strict";
  const doc = document, root = doc.documentElement;
  const $ = (s, el = doc) => el.querySelector(s);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* blocked */ } },
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const simple = () => root.dataset.lane === "simple";
  const base = doc.body.dataset.root || "";
  let idx = { pages: [], projects: [], mail: null };
  try { idx = JSON.parse($("#site-index").textContent); } catch (e) { /* palette still works with fewer commands */ }
  const click = (id) => { const b = doc.getElementById(id); if (b) b.click(); };

  // ---------- Achievements (local only) ----------
  const ACH = {
    palette: "Opened the command palette", work: "Looked at the work", research: "Read the research", about: "Visited About",
    resume: "Opened the resume", theme: "Changed the theme", lane: "Found the Fast lane", sound: "Turned the sound on",
    darts: "Threw 100 darts", konami: "Entered the Konami code", hire: "Ran sudo hire dhairya", rain: "Made it rain",
  };
  let got = []; try { got = JSON.parse(store.get("ach") || "[]"); } catch (e) { got = []; }
  const toastEl = doc.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); doc.body.append(toastEl);
  let toastT;
  const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("on"), 3200); };
  const award = (id) => { if (got.includes(id) || !ACH[id]) return; got.push(id); store.set("ach", JSON.stringify(got)); toast(`Achievement: ${ACH[id]} (${got.length}/${Object.keys(ACH).length})`); };
  const here = location.pathname.replace(/index\.html$/, "");
  if (/\/work\//.test(here)) award("work"); else if (/\/research\/$/.test(here)) award("research"); else if (/\/about\/$/.test(here)) award("about"); else if (/\/resume\/$/.test(here)) award("resume");
  doc.addEventListener("click", (e) => { const t = e.target.closest("#theme,#lane"); if (t) award(t.id); });

  // ---------- Scroll reveal and cursor (motion only: transform and opacity) ----------
  const fx = () => !reduce.matches && !simple();
  if (fx() && "IntersectionObserver" in window) {
    root.classList.add("fx");
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    doc.querySelectorAll(".block,.card,.proof,.flow li,.tier,.rproj").forEach((el) => { el.classList.add("rv"); io.observe(el); });
    setTimeout(() => doc.querySelectorAll(".rv:not(.in)").forEach((el) => el.classList.add("in")), 4000);
  }
  if (fx() && fine.matches) {
    const ring = doc.createElement("div"), dot = doc.createElement("div");
    ring.className = "cur-ring"; dot.className = "cur-dot"; ring.setAttribute("aria-hidden", "true"); dot.setAttribute("aria-hidden", "true");
    doc.body.append(ring, dot);
    let mx = -100, my = -100, rx = -100, ry = -100, vx = 0, vy = 0, active = false, raf = 0;
    const tick = () => {
      // spring toward the pointer
      vx += (mx - rx) * 0.18; vy += (my - ry) * 0.18; vx *= 0.62; vy *= 0.62; rx += vx; ry += vy;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
      dot.style.transform = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`;
      if (Math.abs(mx - rx) + Math.abs(my - ry) > 0.2 || Math.abs(vx) + Math.abs(vy) > 0.05) raf = requestAnimationFrame(tick); else { raf = 0; }
    };
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY; if (!active) { active = true; rx = mx; ry = my; root.classList.add("cur-on"); }
      const t = e.target.closest && e.target.closest("a,button,[data-video],summary,input,select,textarea");
      ring.classList.toggle("hot", !!t);
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    doc.addEventListener("pointerleave", () => root.classList.remove("cur-on"));
    doc.addEventListener("lanechange", () => { if (simple()) root.classList.remove("cur-on"); });
  }

  // ---------- Ambient sound: generated live with Web Audio. Off by default. No files, no autoplay. ----------
  const snd = { ctx: null, master: null, on: false, timer: 0, vol: Math.min(1, Math.max(0, parseFloat(store.get("vol")) || 0.5)) };
  const NOTES = [146.83, 174.61, 196, 220, 261.63, 293.66, 349.23, 440]; // D minor pentatonic-ish, calm
  function startSound() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    if (!snd.ctx) {
      const c = snd.ctx = new AC();
      snd.master = c.createGain(); snd.master.gain.value = 0;
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1500;
      const dly = c.createDelay(1); dly.delayTime.value = 0.46; const fb = c.createGain(); fb.gain.value = 0.42;
      dly.connect(fb); fb.connect(dly); dly.connect(lp); lp.connect(snd.master); snd.master.connect(c.destination);
      snd.bus = c.createGain(); snd.bus.connect(lp); snd.bus.connect(dly);
      const drone = c.createOscillator(); drone.frequency.value = 73.42; const dg = c.createGain(); dg.gain.value = 0.06; drone.connect(dg); dg.connect(lp); drone.start();
    }
    snd.ctx.resume(); snd.on = true;
    snd.master.gain.cancelScheduledValues(snd.ctx.currentTime); snd.master.gain.linearRampToValueAtTime(snd.vol * 0.5, snd.ctx.currentTime + 2.5);
    const next = () => {
      if (!snd.on) return;
      const c = snd.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime, f = NOTES[Math.floor(Math.random() * NOTES.length)];
      o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 1.6); g.gain.linearRampToValueAtTime(0, t + 6);
      o.connect(g); g.connect(snd.bus); o.start(t); o.stop(t + 6.2);
      snd.timer = setTimeout(next, 2200 + Math.random() * 3200);
    };
    next(); return true;
  }
  function stopSound() {
    snd.on = false; clearTimeout(snd.timer);
    if (snd.ctx) { const t = snd.ctx.currentTime; snd.master.gain.cancelScheduledValues(t); snd.master.gain.linearRampToValueAtTime(0, t + 1.2); setTimeout(() => { if (!snd.on) snd.ctx.suspend(); }, 1400); }
  }
  const sBtn = doc.getElementById("sound"), vol = doc.getElementById("vol");
  function syncSound() { if (sBtn) { sBtn.setAttribute("aria-pressed", String(snd.on)); } if (vol) vol.hidden = !snd.on; }
  function toggleSound() { if (snd.on) stopSound(); else if (startSound()) award("sound"); else toast("This browser cannot play sound."); syncSound(); }
  if (sBtn) sBtn.addEventListener("click", toggleSound);
  if (vol) { vol.value = String(snd.vol); vol.addEventListener("input", () => { snd.vol = +vol.value; store.set("vol", vol.value); if (snd.on) snd.master.gain.linearRampToValueAtTime(snd.vol * 0.5, snd.ctx.currentTime + 0.1); }); }
  const tick = () => { // tiny UI tick, only when sound is on
    if (!snd.on) return; const c = snd.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.frequency.value = 880; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05 * snd.vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.13);
  };
  syncSound();

  // ---------- Tab title when hidden, and pause sound ----------
  const title = doc.title;
  doc.addEventListener("visibilitychange", () => {
    if (doc.hidden) { doc.title = "A ball is mid-fall..."; if (snd.on && snd.ctx) snd.ctx.suspend(); }
    else { doc.title = title; if (snd.on && snd.ctx) snd.ctx.resume(); }
  });

  // ---------- Dialog helper ----------
  const dlg = (cls, html, name) => {
    const d = doc.createElement("dialog"); d.className = "dlg " + cls; d.setAttribute("aria-label", name); d.innerHTML = html; doc.body.append(d);
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
    return d;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- Confetti: a few coloured dots, then gone ----------
  function rain() {
    award("rain");
    if (reduce.matches) { toast("Dots would be falling right now."); return; }
    const cv = doc.createElement("canvas"); cv.className = "rain"; cv.setAttribute("aria-hidden", "true"); doc.body.append(cv);
    const dpr = Math.min(devicePixelRatio || 1, 2), W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr, c = cv.getContext("2d");
    const cs = getComputedStyle(root), cols = [cs.getPropertyValue("--dot"), cs.getPropertyValue("--deep"), cs.getPropertyValue("--ink")];
    const ps = Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: -Math.random() * H * 0.5, v: (2 + Math.random() * 4) * dpr, r: (2 + Math.random() * 4) * dpr, c: cols[Math.floor(Math.random() * 3)] }));
    let t0 = performance.now();
    (function f(t) { c.clearRect(0, 0, W, H); for (const p of ps) { p.y += p.v; c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); } if (t - t0 < 2600) requestAnimationFrame(f); else cv.remove(); })(t0);
  }

  // ---------- Monte Carlo darts (a small game about the idea behind the hero) ----------
  let darts;
  function openDarts() {
    if (!darts) {
      darts = dlg("game", `<h2>Monte Carlo darts</h2>
<p>Throw darts at random into the square. The quarter circle takes up pi/4 of it, so four times the share of darts that land inside should drift toward pi.</p>
<canvas width="280" height="280" aria-label="A square with a quarter circle. Darts appear as dots; those inside the circle are one colour." role="img"></canvas>
<p class="stat" aria-live="polite"></p>
<div class="actions"><button class="btn" data-n="1">Throw 1</button><button class="btn ghost" data-n="100">Throw 100</button><button class="btn ghost" data-close>Close</button></div>
<p class="note" hidden></p>`, "Monte Carlo darts game");
      const cv = $("canvas", darts), c = cv.getContext("2d"), stat = $(".stat", darts), note = $(".note", darts);
      let n = 0, inside = 0;
      const paint = () => { c.clearRect(0, 0, 280, 280); const cs = getComputedStyle(root); c.strokeStyle = cs.getPropertyValue("--ink"); c.lineWidth = 2; c.strokeRect(1, 1, 278, 278); c.beginPath(); c.arc(0, 280, 280, -Math.PI / 2, 0); c.stroke(); };
      const throwOne = () => { const x = Math.random(), y = Math.random(), ok = x * x + y * y <= 1; n++; inside += ok; const cs = getComputedStyle(root); c.fillStyle = cs.getPropertyValue(ok ? "--dot" : "--deep"); c.beginPath(); c.arc(x * 280, 280 - y * 280, 2.6, 0, 7); c.fill(); };
      const show = () => { stat.textContent = n ? `${n} darts, ${inside} inside. Estimate of pi: ${(4 * inside / n).toFixed(3)} (true value 3.142)` : "No darts yet."; if (n >= 100) { note.hidden = false; note.textContent = "How it works: each dart is an independent random trial. The estimate's error shrinks roughly like 1 over the square root of the dart count, so 100 times more darts buys about 10 times more accuracy. It is the same bell curve the hero board draws. This game is separate from every project on this site."; award("darts"); } };
      darts.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; if (b.hasAttribute("data-close")) { darts.close(); return; } for (let i = 0; i < +b.dataset.n; i++) throwOne(); tick(); show(); });
      paint(); show();
    }
    darts.showModal();
  }

  // ---------- Debug HUD (Konami code) ----------
  let hud, hudOn = false, hudRaf = 0;
  function toggleHud() {
    if (!hud) { hud = doc.createElement("div"); hud.className = "hud"; hud.setAttribute("role", "status"); doc.body.append(hud); }
    hudOn = !hudOn; hud.hidden = !hudOn; if (!hudOn) { cancelAnimationFrame(hudRaf); return; }
    const nav = performance.getEntriesByType("navigation")[0], res = performance.getEntriesByType("resource");
    const bytes = (nav ? nav.transferSize : 0) + res.reduce((a, r) => a + (r.transferSize || 0), 0);
    let frames = 0, t0 = performance.now(), fps = 0;
    const loop = (t) => { frames++; if (t - t0 >= 500) { fps = Math.round(frames * 1000 / (t - t0)); frames = 0; t0 = t; hud.textContent = `debug hud\nload: ${nav ? Math.round(nav.loadEventEnd) : "?"} ms\ntransferred: ${(bytes / 1024).toFixed(0)} KB (${res.length + 1} requests)\nfps: ${fps}\ncores: ${navigator.hardwareConcurrency || "?"}  dpr: ${devicePixelRatio}\ntheme: ${root.dataset.theme || "system"}  lane: ${root.dataset.lane || "full"}`; } hudRaf = requestAnimationFrame(loop); };
    hudRaf = requestAnimationFrame(loop);
  }
  const KON = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]; let kp = 0;

  // ---------- sudo hire ----------
  function hire() {
    award("hire"); rain();
    if (idx.mail) location.href = `mailto:${idx.mail.u}@${idx.mail.d}?subject=${encodeURIComponent("Let's talk")}&body=${encodeURIComponent("Hi Dhairya,\n\nI saw your portfolio and would like to talk about ")}`;
  }

  // ---------- Info panel: shortcuts, site map, credits, achievements ----------
  let info;
  function openInfo() {
    if (!info) {
      const pages = idx.pages.concat(idx.projects).map((p) => `<li><a href="${base}${p[1]}">${esc(p[0])}</a></li>`).join("");
      info = dlg("info", `<h2>Shortcuts and site map</h2>
<div class="cols"><div><h3>Keys</h3><dl>
<dt><kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>K</kbd></dt><dd>Command palette</dd>
<dt>Palette: "shortcuts"</dt><dd>This panel</dd>
<dt>Optional: <kbd>?</kbd></dt><dd>This panel</dd>
<dt>Optional: <kbd>g</kbd> then <kbd>h</kbd> <kbd>w</kbd> <kbd>r</kbd> <kbd>a</kbd></dt><dd>Go to home, work, research, about</dd>
<dt>Optional: <kbd>t</kbd> <kbd>f</kbd> <kbd>m</kbd></dt><dd>Theme, Fast lane, sound</dd>
<dt><kbd>Esc</kbd></dt><dd>Close any panel</dd></dl></div>
<div><h3>Site map</h3><ul class="plain">${pages}</ul></div></div>
<h3>Achievements <span class="achn"></span></h3><ul class="plain ach"></ul>
<h3>Credits</h3><p class="small">Sound is generated live in your browser with the Web Audio API, so there are no audio files to credit. Fonts: Bricolage Grotesque and JetBrains Mono, SIL Open Font Licence. Achievements and volume are stored only in this browser.</p>
<label class="keyopt"><input type="checkbox" id="keyopt"> Turn on single-key shortcuts (? g t f m)</label>
<div class="actions"><button class="btn ghost" data-close>Close</button></div>`, "Shortcuts, site map and achievements");
      const ko = $("#keyopt", info); ko.checked = keys; ko.addEventListener("change", () => { keys = ko.checked; store.set("keys", keys ? "1" : "0"); });
      info.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) info.close(); });
    }
    $(".ach", info).innerHTML = Object.entries(ACH).map(([k, v]) => `<li>${got.includes(k) ? "&#10003; " : "&#9675; "}${esc(v)}</li>`).join("");
    $(".achn", info).textContent = `(${got.length}/${Object.keys(ACH).length})`;
    info.showModal();
  }

  // ---------- Command palette ----------
  const cmds = [];
  idx.pages.forEach((p) => cmds.push({ t: "Go to " + p[0], k: p[0], run: () => { location.href = base + p[1]; } }));
  idx.projects.forEach((p) => cmds.push({ t: "Project: " + p[0], k: p[0] + " work case study", run: () => { location.href = base + p[1]; } }));
  cmds.push(
    { t: "Open resume (PDF)", k: "resume cv download", run: () => { location.href = base + "Dhairya_Shah_Resume.pdf"; } },
    { t: "Toggle light / dark theme", k: "theme dark light", run: () => click("theme") },
    { t: "Toggle Fast lane (plain version)", k: "fast simple plain accessible", run: () => click("lane") },
    { t: "Toggle ambient sound", k: "music sound audio", run: toggleSound },
    { t: "Play Monte Carlo darts", k: "game pi random", run: openDarts },
    { t: "Make it rain dots", k: "fun confetti", run: rain },
    { t: "Shortcuts, site map and achievements", k: "help keys achievements credits", run: openInfo },
    { t: "sudo hire dhairya", k: "email hire contact", run: hire },
  );
  let pal, list, input, sel = 0, shown = [];
  function draw() {
    const q = input.value.trim().toLowerCase();
    shown = cmds.filter((c) => !q || (c.t + " " + c.k).toLowerCase().includes(q));
    if (/^sudo hire/.test(q) && !shown.some((c) => c.t === "sudo hire dhairya")) shown = [cmds[cmds.length - 1]];
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = shown.length ? shown.map((c, i) => `<li role="option" id="o${i}" aria-selected="${i === sel}" data-i="${i}">${esc(c.t)}</li>`).join("") : `<li class="none">Nothing matches. Try "work" or "theme".</li>`;
    input.setAttribute("aria-activedescendant", shown.length ? "o" + sel : "");
    const cur = $(`#o${sel}`, list); if (cur) cur.scrollIntoView({ block: "nearest" });
  }
  function openPalette() {
    if (!pal) {
      const h = new Date().getHours(), hi = h < 5 ? "Burning the midnight oil?" : h < 12 ? "Good morning." : h < 18 ? "Good afternoon." : "Good evening.";
      pal = dlg("pal", `<label for="pq" class="hi">${hi} Where to?</label><input id="pq" type="text" role="combobox" aria-expanded="true" aria-controls="pl" autocomplete="off" spellcheck="false" placeholder="Type a command or page"><ul id="pl" role="listbox" aria-label="Commands"></ul><p class="small">Up and down to move, Enter to run, Esc to close.</p>`, "Command palette");
      input = $("input", pal); list = $("ul", pal);
      input.addEventListener("input", () => { sel = 0; draw(); });
      input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") { sel = Math.min(shown.length - 1, sel + 1); draw(); e.preventDefault(); }
        else if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); }
        else if (e.key === "Enter" && shown[sel]) { e.preventDefault(); const c = shown[sel]; pal.close(); tick(); c.run(); }
      });
      list.addEventListener("click", (e) => { const li = e.target.closest("[data-i]"); if (li) { const c = shown[+li.dataset.i]; pal.close(); tick(); c.run(); } });
    }
    input.value = ""; sel = 0; draw(); pal.showModal(); input.focus(); award("palette");
  }
  const pbtn = doc.getElementById("pal"); if (pbtn) pbtn.addEventListener("click", openPalette);

  // ---------- Keyboard ----------
  let g = 0, keys = store.get("keys") === "1"; // single-key shortcuts are opt-in (WCAG 2.1.4)
  addEventListener("keydown", (e) => {
    const kk = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (kk === KON[kp]) { kp++; if (kp === KON.length) { kp = 0; award("konami"); toggleHud(); } } else kp = kk === KON[0] ? 1 : 0;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || doc.querySelector("dialog[open]")) return;
    const tg = e.target; if (tg && (/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName) || tg.isContentEditable)) return;
    if (!keys) return;
    if (e.key === "?") { openInfo(); return; }
    if (g && Date.now() - g < 1200) { g = 0; const m = { h: "", w: "work/", r: "research/", a: "about/" }[e.key]; if (m !== undefined) location.href = base + m; return; }
    if (e.key === "g") { g = Date.now(); return; }
    if (e.key === "t") click("theme"); else if (e.key === "f") click("lane"); else if (e.key === "m") toggleSound();
  });

  // ---------- For people who view source ----------
  console.log("%cHello, developer.", "font:700 16px sans-serif", "\nThis site is a small dependency-free Node generator, plain CSS and JS. Press Ctrl+K, or try the Konami code. Source: github.com/Dhairya233/Dhairya233.github.io");
})();
