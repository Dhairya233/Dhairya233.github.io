// app.js: small, dependency-free. Everything here is progressive: the site works without it.
(() => {
  "use strict";
  const doc = document, root = doc.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage may be blocked */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };
  const dark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;

  // ---- Theme toggle (follows the system until the visitor chooses) ----
  const themeBtn = doc.getElementById("theme");
  if (themeBtn) {
    const label = () => themeBtn.firstElementChild.textContent = dark() ? "Light" : "Dark";
    label();
    themeBtn.addEventListener("click", () => {
      const next = dark() ? "light" : "dark";
      root.dataset.theme = next; store.set("theme", next); label();
      doc.dispatchEvent(new Event("themechange"));
    });
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { label(); doc.dispatchEvent(new Event("themechange")); });
  }

  // ---- Fast lane (plain version) ----
  const laneBtn = doc.getElementById("lane");
  if (laneBtn) {
    const sync = () => laneBtn.setAttribute("aria-pressed", String(root.dataset.lane === "simple"));
    sync();
    laneBtn.addEventListener("click", () => {
      if (root.dataset.lane === "simple") { delete root.dataset.lane; store.del("lane"); }
      else { root.dataset.lane = "simple"; store.set("lane", "simple"); }
      sync(); doc.dispatchEvent(new Event("lanechange"));
    });
  }

  // ---- Email: assembled here so scrapers reading the HTML do not see a plain address ----
  doc.querySelectorAll("[data-mail]").forEach((a) => {
    const addr = a.dataset.u + "@" + a.dataset.d;
    a.href = "mailto:" + addr; a.textContent = addr;
  });

  // ---- Print button ----
  const pr = doc.getElementById("print");
  if (pr) pr.addEventListener("click", () => window.print());

  // ---- Click-to-load video: nothing heavy loads until the visitor asks ----
  doc.querySelectorAll("[data-video]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = doc.createElement("video");
      v.src = btn.dataset.video; v.controls = true; v.autoplay = true; v.playsInline = true; v.preload = "auto";
      v.setAttribute("aria-label", btn.getAttribute("aria-label"));
      btn.replaceWith(v); v.focus();
    });
  });

  // ---- Galton board (hero) ----
  const cv = doc.getElementById("galton");
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const ROWS = 10, BINS = ROWS + 1, MAXSTACK = 26;
  let W = 0, H = 0, dpr = 1, dx = 0, dy = 0, r = 0, topY = 0, floorY = 0;
  let p = 0.5, target = 0.5, counts = new Array(BINS).fill(0), balls = [], total = 0, last = 0;
  let running = false, onScreen = true, colors = {}, slowFrames = 0, seen = 0;
  const note = doc.querySelector("[data-board-p]");

  const readColors = () => {
    const s = getComputedStyle(root);
    colors = { ink: s.getPropertyValue("--ink").trim(), dot: s.getPropertyValue("--dot").trim(), deep: s.getPropertyValue("--deep").trim(), line: s.getPropertyValue("--line").trim() };
  };
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const b = cv.getBoundingClientRect(); if (!b.width) return;
    W = cv.width = Math.round(b.width * dpr); H = cv.height = Math.round(b.height * dpr);
    dx = W / (BINS + 1); dy = (H * 0.6) / ROWS; r = dx * 0.17; topY = H * 0.06; floorY = H * 0.97;
  };
  const px = (row, k) => W / 2 + (k - row / 2) * dx;
  const py = (row) => topY + row * dy;
  const comb = (n, k) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return c; };
  const spawn = () => balls.push({ row: 0, k: 0, t: 0, fall: 0, path: Array.from({ length: ROWS }, () => (Math.random() < p ? 1 : 0)) });

  function step(dt) {
    p += (target - p) * Math.min(1, dt * 3);
    for (const b of balls) {
      if (b.row < ROWS) { b.t += dt / 0.16; if (b.t >= 1) { b.t = 0; b.k += b.path[b.row]; b.row++; } }
      else { b.fall += dt / 0.28; if (b.fall >= 1) { b.done = true; counts[b.k]++; total++; if (counts[b.k] > MAXSTACK) counts.fill(0); } }
    }
    balls = balls.filter((b) => !b.done);
  }
  function pos(b) {
    if (b.row < ROWS) {
      const nk = b.k + b.path[b.row], e = b.t * b.t * (3 - 2 * b.t);
      return [px(b.row, b.k) + (px(b.row + 1, nk) - px(b.row, b.k)) * e, py(b.row) + (py(b.row + 1) - py(b.row)) * e - Math.sin(Math.PI * b.t) * r * 1.6];
    }
    const e = b.fall * b.fall;
    return [px(ROWS, b.k), py(ROWS) + (floorY - r - counts[b.k] * r * 2.1 - py(ROWS)) * e];
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = colors.ink;
    for (let i = 0; i < ROWS; i++) for (let k = 0; k <= i; k++) { ctx.beginPath(); ctx.arc(px(i, k), py(i) + dy * 0.5, r * 0.7, 0, 7); ctx.fill(); }
    ctx.strokeStyle = colors.ink; ctx.lineWidth = 2 * dpr; ctx.globalAlpha = 0.5;
    for (let k = 0; k <= BINS; k++) { const x = px(ROWS, k) - dx / 2; ctx.beginPath(); ctx.moveTo(x, py(ROWS) + dy * 0.6); ctx.lineTo(x, floorY); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.fillStyle = colors.deep;
    for (let k = 0; k < BINS; k++) for (let j = 0; j < counts[k]; j++) { ctx.beginPath(); ctx.arc(px(ROWS, k), floorY - r - j * r * 2.1, r * 0.95, 0, 7); ctx.fill(); }
    ctx.fillStyle = colors.dot;
    for (const b of balls) { const [x, y] = pos(b); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
    ctx.strokeStyle = colors.dot; ctx.lineWidth = 2 * dpr; ctx.setLineDash([6 * dpr, 6 * dpr]); ctx.beginPath();
    for (let k = 0; k < BINS; k++) { const c = comb(ROWS, k) * Math.pow(p, k) * Math.pow(1 - p, ROWS - k), y = floorY - c * MAXSTACK * r * 2.1 * 3.1; k ? ctx.lineTo(px(ROWS, k), y) : ctx.moveTo(px(ROWS, k), y); }
    ctx.stroke(); ctx.setLineDash([]);
  }
  function frame(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    if (Math.random() < dt * 9 && balls.length < 40) spawn();
    step(dt); draw();
    // Frame-time probe: on a weak device (sustained slow frames) settle into the calm still pile.
    if (++seen > 20 && seen <= 140) { slowFrames += dt > 0.034 ? 1 : 0; if (seen === 140 && slowFrames > 45) { running = false; still(); return; } }
    if (note) note.textContent = "p(right) = " + p.toFixed(2);
    requestAnimationFrame(frame);
  }
  const shouldRun = () => !reduce.matches && root.dataset.lane !== "simple" && onScreen && !doc.hidden;
  function update() {
    const want = shouldRun();
    if (want && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    else if (!want) { running = false; }
  }
  function still() {
    // Calm alternative: the settled pile, drawn once (reduced motion or Fast lane).
    counts = new Array(BINS).fill(0);
    for (let i = 0; i < 260; i++) { let k = 0; for (let j = 0; j < ROWS; j++) k += Math.random() < 0.5; if (counts[k] < MAXSTACK) counts[k]++; }
    balls = []; p = target = 0.5; draw();
    if (note) note.textContent = "p(right) = 0.50";
  }
  function setup() { size(); readColors(); if (reduce.matches) still(); else draw(); update(); }
  addEventListener("resize", () => { size(); readColors(); if (!running) draw(); });
  doc.addEventListener("themechange", () => { readColors(); if (!running) draw(); });
  doc.addEventListener("lanechange", () => { readColors(); update(); });
  doc.addEventListener("visibilitychange", update);
  reduce.addEventListener("change", () => { counts = new Array(BINS).fill(0); setup(); });
  if ("IntersectionObserver" in window) new IntersectionObserver((e) => { onScreen = e[0].isIntersecting; update(); }).observe(cv);
  // Pointer tilts the odds, but only over the board
  const board = cv.parentElement;
  board.addEventListener("pointermove", (e) => { const b = cv.getBoundingClientRect(); target = Math.min(0.85, Math.max(0.15, (e.clientX - b.left) / b.width)); });
  board.addEventListener("pointerleave", () => { target = 0.5; });
  setup();
})();
