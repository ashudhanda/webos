(function () {
"use strict";
var store = NatureOS.store;
var notify = NatureOS.notify;
var getWallpaper = NatureOS.getWallpaper;
var wallpaperStyle = NatureOS.wallpaperStyle;
let ctx = null;
let master = null;
let noiseBuffer = null;
const nodes = { rain: null, wind: null, birds: null };
let birdTimer = null;
let playing = false;

function audio() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = store.get("volume");
    master.connect(ctx.destination);
  }
  return ctx;
}

function makeNoise() {
  if (noiseBuffer) return noiseBuffer;
  const c = audio();
  const length = c.sampleRate * 4;
  noiseBuffer = c.createBuffer(1, length, c.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.2 + white * 0.35;
  }
  return noiseBuffer;
}

function buildRain() {
  const c = audio();
  const src = c.createBufferSource();
  src.buffer = makeNoise();
  src.loop = true;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 900;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2400;
  bp.Q.value = 0.6;
  const gain = c.createGain();
  gain.gain.value = 0;
  src.connect(hp).connect(bp).connect(gain).connect(master);
  src.start();
  return { src, gain, target: 0.32 };
}

function buildWind() {
  const c = audio();
  const src = c.createBufferSource();
  src.buffer = makeNoise();
  src.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 420;
  lp.Q.value = 1.2;
  const gain = c.createGain();
  gain.gain.value = 0;
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 240;
  lfo.connect(lfoGain).connect(lp.frequency);
  const swell = c.createOscillator();
  swell.frequency.value = 0.045;
  const swellGain = c.createGain();
  swellGain.gain.value = 0.16;
  swell.connect(swellGain).connect(gain.gain);
  lfo.start();
  swell.start();
  src.connect(lp).connect(gain).connect(master);
  src.start();
  return { src, gain, lfo, swell, target: 0.28 };
}

function chirp(gainValue) {
  const c = audio();
  const now = c.currentTime;
  const notes = 2 + Math.floor(Math.random() * 4);
  const base = 1800 + Math.random() * 2200;
  for (let i = 0; i < notes; i += 1) {
    const start = now + i * (0.055 + Math.random() * 0.05);
    const osc = c.createOscillator();
    osc.type = Math.random() > 0.6 ? "triangle" : "sine";
    const g = c.createGain();
    const f0 = base * (0.86 + Math.random() * 0.3);
    osc.frequency.setValueAtTime(f0, start);
    osc.frequency.exponentialRampToValueAtTime(f0 * (1.15 + Math.random() * 0.5), start + 0.05);
    osc.frequency.exponentialRampToValueAtTime(f0 * 0.82, start + 0.1);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(start + 0.16);
  }
}

function startBirds() {
  stopBirds();
  const loop = () => {
    if (playing && nodes.birds) chirp(0.05 + Math.random() * 0.06);
    birdTimer = setTimeout(loop, 900 + Math.random() * 3400);
  };
  birdTimer = setTimeout(loop, 700);
}

function stopBirds() {
  if (birdTimer) clearTimeout(birdTimer);
  birdTimer = null;
}

function ramp(node, value) {
  if (!node) return;
  const c = audio();
  node.gain.gain.cancelScheduledValues(c.currentTime);
  node.gain.gain.setTargetAtTime(value, c.currentTime, 0.35);
}

const musicApp = {
  id: "music",
  name: "Forest Sounds",
  icon: "🎵",
  tagline: "Ambience",
  keywords: ["music", "sounds", "ambient", "rain", "birds", "wind"],
  width: 420,
  height: 560,
  minWidth: 360,
  minHeight: 480,
  mount(body) {
    const layers = store.get("layers") || { rain: true, wind: true, birds: true };

    const root = document.createElement("div");
    root.className = "music app-scroll";

    const art = document.createElement("div");
    art.className = "music-art";
    art.style.backgroundImage = wallpaperStyle(getWallpaper(store.get("wallpaper")));
    const eq = document.createElement("div");
    eq.className = "eq";
    for (let i = 0; i < 14; i += 1) {
      const bar = document.createElement("i");
      bar.style.animationDelay = (i * 70) % 900 + "ms";
      bar.style.animationDuration = 700 + ((i * 53) % 500) + "ms";
      eq.appendChild(bar);
    }
    art.appendChild(eq);

    const heading = document.createElement("div");
    heading.innerHTML = "";
    const h1 = document.createElement("div");
    h1.style.fontSize = "17px";
    h1.style.fontWeight = "700";
    h1.textContent = "Living Forest";
    const h2 = document.createElement("div");
    h2.style.fontSize = "12px";
    h2.style.opacity = "0.65";
    h2.textContent = "Generated live with the Web Audio API";
    heading.appendChild(h1);
    heading.appendChild(h2);

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "accent-btn";
    playBtn.style.fontSize = "15px";
    playBtn.style.padding = "10px 26px";
    playBtn.textContent = "▶︎  Play";

    const volRow = document.createElement("div");
    volRow.className = "layer-row";
    const volIcon = document.createElement("span");
    volIcon.textContent = "🔊";
    const vol = document.createElement("input");
    vol.type = "range";
    vol.min = "0";
    vol.max = "100";
    vol.style.flex = "1";
    vol.value = String(Math.round(store.get("volume") * 100));
    const volVal = document.createElement("span");
    volVal.style.width = "34px";
    volVal.style.fontSize = "12px";
    volVal.textContent = vol.value + "%";
    volRow.appendChild(volIcon);
    volRow.appendChild(vol);
    volRow.appendChild(volVal);

    root.appendChild(art);
    root.appendChild(heading);
    root.appendChild(playBtn);
    root.appendChild(volRow);

    const defs = [
      { key: "rain", icon: "🌧️", name: "Rain on leaves" },
      { key: "wind", icon: "🍃", name: "Wind through pines" },
      { key: "birds", icon: "🐦", name: "Dawn chorus" },
    ];

    const switches = {};
    defs.forEach((def) => {
      const row = document.createElement("div");
      row.className = "layer-row";
      const ic = document.createElement("span");
      ic.textContent = def.icon;
      const name = document.createElement("span");
      name.className = "lr-name";
      name.textContent = def.name;
      const sw = document.createElement("button");
      sw.type = "button";
      sw.className = "switch" + (layers[def.key] ? " on" : "");
      sw.addEventListener("click", () => {
        layers[def.key] = !layers[def.key];
        sw.classList.toggle("on", layers[def.key]);
        store.set("layers", { ...layers });
        syncLayers();
      });
      switches[def.key] = sw;
      row.appendChild(ic);
      row.appendChild(name);
      row.appendChild(sw);
      root.appendChild(row);
    });

    const hint = document.createElement("div");
    hint.style.fontSize = "11.5px";
    hint.style.opacity = "0.55";
    hint.style.maxWidth = "340px";
    hint.style.lineHeight = "1.6";
    hint.textContent =
      "No audio files are downloaded. Rain is filtered noise, wind is slow-modulated noise, and every bird call is synthesised on the fly, so no two minutes sound the same.";
    root.appendChild(hint);

    body.appendChild(root);

    function syncLayers() {
      if (!playing) return;
      ramp(nodes.rain, layers.rain ? nodes.rain.target : 0);
      ramp(nodes.wind, layers.wind ? nodes.wind.target : 0);
    }

    function start() {
      const c = audio();
      if (c.state === "suspended") c.resume();
      if (!nodes.rain) nodes.rain = buildRain();
      if (!nodes.wind) nodes.wind = buildWind();
      nodes.birds = true;
      playing = true;
      syncLayers();
      startBirds();
      eq.classList.add("playing");
      playBtn.textContent = "⏸  Pause";
      notify("Forest Sounds", "The canopy is alive.", "🎵");
    }

    function stop() {
      playing = false;
      ramp(nodes.rain, 0);
      ramp(nodes.wind, 0);
      stopBirds();
      eq.classList.remove("playing");
      playBtn.textContent = "▶︎  Play";
    }

    playBtn.addEventListener("click", () => {
      if (playing) stop();
      else start();
    });

    vol.addEventListener("input", () => {
      const value = Number(vol.value) / 100;
      volVal.textContent = vol.value + "%";
      store.set("volume", value);
      if (master) master.gain.setTargetAtTime(value, audio().currentTime, 0.1);
    });

    if (playing) {
      eq.classList.add("playing");
      playBtn.textContent = "⏸  Pause";
    }
  },
  onClose() {
    playing = false;
    stopBirds();
    ramp(nodes.rain, 0);
    ramp(nodes.wind, 0);
  },
};
NatureOS.musicApp = musicApp;
})();
