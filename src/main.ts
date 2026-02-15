import './style.css'

import { PHRASE, PHRASE_LEN } from "./phrase";
import { TonePlayer } from "./audio";
import { MicPitch, hzToMidi, centsError } from "./pitch";
import { CanvasViz } from "./viz";

// ================= DOM =================

const btnStart = document.getElementById("btnStart") as HTMLButtonElement;
const btnPlay = document.getElementById("btnPlay") as HTMLButtonElement;
const btnStop = document.getElementById("btnStop") as HTMLButtonElement;

const micFill = document.getElementById("micFill") as HTMLDivElement;
const targetMidiEl = document.getElementById("targetMidi") as HTMLElement;
const userMidiEl = document.getElementById("userMidi") as HTMLElement;
const centsEl = document.getElementById("cents") as HTMLElement;
const voicedEl = document.getElementById("voiced") as HTMLElement;
const canvas = document.getElementById("viz") as HTMLCanvasElement;

let hint = document.getElementById("hint") as HTMLDivElement | null;

// If hint doesn't exist, create it safely
if (!hint) {
  hint = document.createElement("div");
  hint.id = "hint";
  hint.style.marginTop = "10px";
  hint.style.fontSize = "13px";
  hint.style.color = "#666";
  btnStart.parentElement?.appendChild(hint);
}

// ================= AUDIO / VIZ =================

const player = new TonePlayer();
const mic = new MicPitch(2048);
const viz = new CanvasViz(canvas, PHRASE);

let running = false;

// Mic thresholds
let noiseFloor = 0.01;
const rmsMargin = 0.01;
const minConfidence = 0.45;
const inTuneCents = 50;

// ================= THEME =================

const toggleBtn = document.getElementById("themeToggle") as HTMLButtonElement;

function setTheme(isDark: boolean) {
  if (isDark) {
    document.body.classList.add("dark");
    toggleBtn.textContent = "☀️ Light Mode";
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("dark");
    toggleBtn.textContent = "🌙 Dark Mode";
    localStorage.setItem("theme", "light");
  }
}

toggleBtn?.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark");
  setTheme(!isDark);
});

if (localStorage.getItem("theme") === "dark") {
  setTheme(true);
}

// ================= HELPERS =================

function getTargetMidiAtTime(t: number): number | null {
  for (const e of PHRASE) {
    if (t >= e.t0 && t < e.t1) return e.midi;
  }
  return t >= PHRASE_LEN ? PHRASE[PHRASE.length - 1].midi : null;
}

async function calibrateNoise(): Promise<void> {
  const start = performance.now();
  let sum = 0;
  let n = 0;

  while (performance.now() - start < 800) {
    const r = mic.read();
    sum += r.rms;
    n += 1;
    await new Promise(res => setTimeout(res, 16));
  }

  noiseFloor = sum / Math.max(1, n);
}

// ================= BUTTON EVENTS =================

btnStart.onclick = async () => {
  btnStart.disabled = true;
  if (hint) hint.textContent = "Requesting permissions…";

  await player.init();
  await mic.init();
  await calibrateNoise();

  player.loadPhrase(PHRASE);

  btnPlay.disabled = false;
  btnStop.disabled = false;

  if (hint) hint.textContent = "Ready. Put on headphones, then press Play Phrase.";
};

btnPlay.onclick = () => {
  player.stop();
  player.loadPhrase(PHRASE);
  player.play();
  running = true;
};

btnStop.onclick = () => {
  player.stop();
  running = false;
};

// ================= MAIN LOOP =================

function loop() {
  const t = player.nowSeconds();
  const targetMidi = getTargetMidiAtTime(t);
  const reading = mic.read();

  // Mic meter
  const micPct = Math.min(
    100,
    Math.max(0, (reading.rms / Math.max(0.02, noiseFloor * 4)) * 100)
  );
  micFill.style.width = `${micPct}%`;

  const voiced = reading.rms > (noiseFloor + rmsMargin);
  let userMidi: number | null = null;

  if (voiced && reading.hz && reading.confidence >= minConfidence) {
    userMidi = hzToMidi(reading.hz);
  }

  let err = NaN;
  let inTune = false;

  if (userMidi !== null && targetMidi !== null) {
    err = centsError(userMidi, targetMidi);
    inTune = Math.abs(err) <= inTuneCents;
  }

  // UI text
  targetMidiEl.textContent = targetMidi !== null ? targetMidi.toFixed(0) : "—";
  userMidiEl.textContent = userMidi !== null ? userMidi.toFixed(1) : "—";
  centsEl.textContent = Number.isFinite(err) ? err.toFixed(0) : "—";
  voicedEl.textContent = voiced ? "yes" : "no";

  if (!btnPlay.disabled && hint) {
    if (!voiced)
      hint.textContent = "Sing a little louder than the room…";
    else if (userMidi === null)
      hint.textContent = "Pitch not stable yet—try a steady vowel like 'ahhh'.";
    else
      hint.textContent = inTune
        ? "✅ On pitch!"
        : err > 0
        ? "⬇️ Too high — go lower"
        : "⬆️ Too low — go higher";
  }

  viz.draw({
    t: running ? t : 0,
    targetMidi,
    userMidi,
    inTune,
  });

  requestAnimationFrame(loop);
}

loop();
