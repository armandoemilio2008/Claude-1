import * as THREE from '../vendor/three/three.module.min.js';
import { GLTFLoader } from '../vendor/three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from '../vendor/three/addons/controls/OrbitControls.js';
import { Rig } from './rig.js';
import { MusclePainter, GROUPS } from './muscles.js';
import { FIXED, FOLLOW, makeMaterials } from './props.js';
import { EXERCISES, CATEGORIES } from './exercises.js';

const params = new URLSearchParams(location.search);
const DEBUG_T = params.has('t') ? parseFloat(params.get('t')) : null;
const $ = (s) => document.querySelector(s);

// ---------------- escena ----------------
const stage = $('#stage');
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: DEBUG_T !== null });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 1.2; controls.maxDistance = 9;
controls.maxPolarAngle = Math.PI * 0.53;

scene.add(new THREE.HemisphereLight(0xf2f5ff, 0x3a3430, 1.1));
const key = new THREE.DirectionalLight(0xffffff, 2.3);
key.position.set(2.2, 4.2, 3.2);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -2.2, right: 2.2, top: 3, bottom: -1.5, near: 0.5, far: 12 });
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
scene.add(key);
const rim = new THREE.DirectionalLight(0xbfd6ff, 1.2);
rim.position.set(-3, 2.5, -3.5);
scene.add(rim);
const fill = new THREE.DirectionalLight(0xffeedd, 0.5);
fill.position.set(-3, 1, 2.5);
scene.add(fill);

const floor = new THREE.Mesh(new THREE.CircleGeometry(3.2, 64), new THREE.ShadowMaterial({ opacity: 0.22 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
scene.add(floor);
const ring = new THREE.Mesh(new THREE.RingGeometry(1.55, 1.57, 96), new THREE.MeshBasicMaterial({ color: 0x8892a0, transparent: true, opacity: 0.35 }));
ring.rotation.x = -Math.PI / 2; ring.position.y = 0.001;
scene.add(ring);

const M = makeMaterials();
const propsGroup = new THREE.Group();
scene.add(propsGroup);

// ---------------- modelos ----------------
const loader = new GLTFLoader();
let musclesJson = null;
const models = {};
let model = null;
const MODEL_FILES = { m: 'models/male_anatomy_mobile.glb', f: 'models/female_anatomy_mobile.glb' };

async function loadModel(sex) {
  if (models[sex]) return models[sex];
  if (!musclesJson) musclesJson = await (await fetch('models/muscles.json')).json();
  const gltf = await loader.loadAsync(MODEL_FILES[sex], (e) => {
    if (e.total) setLoading(`Cargando modelo anatómico… ${Math.round((e.loaded / e.total) * 100)} %`);
  });
  let mesh = null;
  gltf.scene.traverse((o) => { if (o.isSkinnedMesh) mesh = o; });
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  const rig = new Rig(gltf.scene);
  const painter = new MusclePainter(mesh, musclesJson);
  models[sex] = { sex, root: gltf.scene, rig, painter, mesh, cache: {} };
  return models[sex];
}

// ---------------- estado ----------------
const state = {
  ex: null, playing: DEBUG_T === null, speed: 1, time: 0, sex: 'm',
  keys: null, followers: [], focus: null,
};

function phaseTimes(ex) {
  const t = ex.tempo || (ex.compound ? [1.2, 0.3, 2.2, 0.5] : [1, 0.4, 3, 0.5]);
  return { up: t[0], top: t[1], down: t[2], bottom: t[3], total: t[0] + t[1] + t[2] + t[3] };
}
const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(Math.max(x, 0), 1));

// posición del ciclo -> {s: 0..1 (inicio→final), phase, pulse}
function cycle(ex, time) {
  const p = phaseTimes(ex);
  if (ex.iso) {
    const s = 0.5 + 0.5 * Math.sin(time * 1.6);
    return { s: s * 0.15, phase: 'iso', pulse: 0.75 + 0.25 * s, frac: (time % 4) / 4 };
  }
  let t = time % p.total;
  const frac = t / p.total;
  if (t < p.bottom) return { s: 0, phase: 'bottom', pulse: 0.2, frac };
  t -= p.bottom;
  if (t < p.up) { const s = ease(t / p.up); return { s, phase: 'up', pulse: 0.35 + 0.65 * s, frac }; }
  t -= p.up;
  if (t < p.top) return { s: 1, phase: 'top', pulse: 1, frac };
  t -= p.top;
  const s = 1 - ease(t / p.down);
  return { s, phase: 'down', pulse: 0.3 + 0.55 * s, frac };
}

function solveKeys(m, ex) {
  if (!m.cache[ex.id]) m.cache[ex.id] = ex.k.map((k) => m.rig.solve(k));
  return m.cache[ex.id];
}

function poseAt(s) {
  const ex = state.ex, rig = model.rig;
  const [a, b] = state.keys;
  rig.apply(a, b, s);
  if (ex.plant) rig.plant(ex.plant, ex.plantY ?? 0);
  if (ex.pin) for (const pn of [].concat(ex.pin)) rig.pin(pn.pt, pn.at);
  for (const f of state.followers) f.update();
}

function buildProps(ex) {
  propsGroup.clear();
  state.followers = [];
  for (const p of ex.props || []) {
    if (p.fixed) propsGroup.add(FIXED[p.fixed](M, p));
    else if (p.follow) {
      const f = FOLLOW[p.follow](M, model.rig, p);
      propsGroup.add(f.mesh);
      state.followers.push(f);
    }
  }
}

const FRAME_PTS = ['headTop', 'heelR', 'heelL', 'toeR', 'toeL', 'gripR', 'gripL', 'kneeR', 'kneeL', 'elbowR', 'elbowL', 'sacrum', 'backTop'];
function frameCamera(ex, view) {
  const rig = model.rig;
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  for (const s of [0, 1]) {
    poseAt(s);
    for (const n of FRAME_PTS) box.expandByPoint(rig.point(n, v));
  }
  for (const p of ex.include || []) box.expandByPoint(v.set(...p));
  const target = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  if (ex.target) target.set(...ex.target);
  const [az, el] = view || ex.view || [25, 8];
  const azr = az * Math.PI / 180, elr = el * Math.PI / 180;
  const dir = new THREE.Vector3(Math.sin(azr) * Math.cos(elr), Math.sin(elr), Math.cos(azr) * Math.cos(elr));
  // ancho visible: proyección de la caja sobre el eje horizontal de la cámara
  const right = new THREE.Vector3(Math.cos(azr), 0, -Math.sin(azr));
  const w = Math.abs(right.x) * size.x + Math.abs(right.z) * size.z + 0.25;
  const h = size.y * Math.cos(elr) + (Math.abs(dir.x) * size.x + Math.abs(dir.z) * size.z) * Math.sin(elr) + 0.25;
  const vf = camera.fov * Math.PI / 180;
  const tanV = Math.tan(vf / 2), tanH = tanV * camera.aspect;
  // margen extra arriba y abajo para el título y los controles superpuestos
  let d = Math.max((h * 0.5 * 1.3) / tanV, (w * 0.5 * 1.12) / tanH);
  d = Math.min(Math.max(d * (ex.zoom || 1), 1.6), 8) + Math.max(w, size.z) * 0.15;
  target.y += h * 0.04;
  camera.position.copy(target).addScaledVector(dir, d);
  controls.target.copy(target);
  controls.update();
  poseAt(0);
}

async function selectExercise(id, opts = {}) {
  const ex = EXERCISES.find((e) => e.id === id) || EXERCISES[0];
  state.ex = ex;
  state.time = 0;
  if (!model || model.sex !== state.sex) await setModel(state.sex);
  state.keys = solveKeys(model, ex);
  buildProps(ex);
  model.painter.set(ex.primary, ex.secondary, ex.side);
  frameCamera(ex);
  renderInfo(ex);
  markActive(ex.id);
  if (!opts.silent) try { localStorage.setItem('anat-ex', ex.id); } catch (e) { /* sin almacenamiento */ }
  if (location.hash.slice(1) !== ex.id && !opts.fromHash) {
    try { history.replaceState(null, '', location.pathname + location.search + '#' + ex.id); } catch (e) { /* marco restringido */ }
  }
}

async function setModel(sex) {
  setLoading('Cargando modelo anatómico…');
  const m = await loadModel(sex);
  if (model) scene.remove(model.root);
  model = m;
  scene.add(model.root);
  setLoading(null);
}

// ---------------- UI ----------------
function setLoading(msg) {
  const el = $('#loading');
  el.hidden = !msg;
  if (msg) el.textContent = msg;
}

const listEl = $('#list');
let filter = 'todos';
let query = '';

function chipsFor(keys, cls) {
  return keys.map((k) => `<span class="dot ${cls}" title="${GROUPS[k].es}"></span>`).join('');
}

function renderList() {
  const q = query.trim().toLowerCase();
  const items = EXERCISES.filter((e) => {
    if (filter === 'rutina' && !e.pdf) return false;
    if (filter !== 'todos' && filter !== 'rutina' && e.cat !== filter) return false;
    if (q) {
      const hay = (e.name + ' ' + e.equip + ' ' + [...e.primary, ...e.secondary].map((k) => GROUPS[k].es).join(' ')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const cats = filter === 'todos' || filter === 'rutina' ? CATEGORIES : CATEGORIES.filter((c) => c.id === filter);
  let html = '';
  for (const c of cats) {
    const its = items.filter((e) => e.cat === c.id);
    if (!its.length) continue;
    html += `<li class="cat">${c.es}<span>${its.length}</span></li>`;
    for (const e of its) {
      html += `<li><button class="ex" data-id="${e.id}" type="button">
        <span class="ex-name">${e.name}</span>
        <span class="ex-meta">${e.pdf ? `<span class="tag">${e.pdf.day}</span>` : '<span class="tag add">Común</span>'}<span class="muscle-names">${e.primary.map((k) => GROUPS[k].es).slice(0, 2).join(' · ')}</span></span>
      </button></li>`;
    }
  }
  if (!html) html = '<li class="empty">Ningún ejercicio coincide con la búsqueda.</li>';
  listEl.innerHTML = html;
  if (state.ex) markActive(state.ex.id);
  $('#count').textContent = `${items.length} de ${EXERCISES.length}`;
}

function markActive(id) {
  listEl.querySelectorAll('.ex').forEach((b) => b.setAttribute('aria-current', b.dataset.id === id ? 'true' : 'false'));
}

function muscleRow(k, cls) {
  const g = GROUPS[k];
  return `<li><button type="button" class="muscle ${cls}" data-k="${k}" data-cls="${cls}"><span class="sw"></span><span class="mn">${g.es}</span><span class="ml">${g.la}</span></button></li>`;
}

function renderInfo(ex) {
  $('#ex-title').textContent = ex.name;
  $('#ex-equip').textContent = ex.equip;
  $('#ex-cat').textContent = CATEGORIES.find((c) => c.id === ex.cat).es;
  $('#ex-src').textContent = ex.pdf ? 'De tu rutina' : 'Ejercicio común añadido';
  $('#ex-src').className = 'src ' + (ex.pdf ? 'pdf' : 'add');
  $('#prim').innerHTML = ex.primary.map((k) => muscleRow(k, 'p')).join('');
  $('#sec').innerHTML = ex.secondary.length ? ex.secondary.map((k) => muscleRow(k, 's')).join('') : '<li class="none">—</li>';
  $('#cues').innerHTML = ex.cues.map((c) => `<li>${c}</li>`).join('');
  const rx = $('#rx');
  if (ex.pdf) {
    rx.hidden = false;
    rx.innerHTML = `<div><b>${ex.pdf.sets}</b><span>series</span></div><div><b>${ex.pdf.reps}</b><span>reps</span></div><div><b>${ex.pdf.rest}</b><span>descanso</span></div><div><b>${ex.pdf.day.split(' · ')[0]}</b><span>${ex.pdf.day.split(' · ')[1] || ''}</span></div>`;
  } else rx.hidden = true;
  const p = phaseTimes(ex);
  $('#tempo').textContent = ex.iso ? 'Isométrico: mantén la posición' : `Tempo ${fmt(p.up)} s subir · ${fmt(p.top)} s pausa · ${fmt(p.down)} s bajar`;
  $('#side-note').hidden = !ex.side;
  if (ex.side) $('#side-note').textContent = 'Se muestra el lado derecho trabajando; cambia de lado en la siguiente serie.';
}
const fmt = (x) => (Math.round(x * 10) / 10).toString().replace('.', ',');

listEl.addEventListener('click', (e) => {
  const b = e.target.closest('.ex');
  if (!b) return;
  selectExercise(b.dataset.id);
  if (window.matchMedia('(max-width: 760px)').matches) stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#filters').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-f]');
  if (!b) return;
  filter = b.dataset.f;
  $('#filters').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
  renderList();
});
$('#search').addEventListener('input', (e) => { query = e.target.value; renderList(); });

// aislar un músculo al pasar o tocar
function focusMuscle(btn) {
  if (!btn) { state.focus = null; model.painter.set(state.ex.primary, state.ex.secondary, state.ex.side); model.painter.uniforms.uDim.value = 0; return; }
  const k = btn.dataset.k;
  state.focus = k;
  if (btn.dataset.cls === 'p') model.painter.set([k], [], state.ex.side); else model.painter.set([], [k], state.ex.side);
  model.painter.uniforms.uDim.value = 1;
}
for (const id of ['#prim', '#sec']) {
  const el = $(id);
  el.addEventListener('pointerover', (e) => { const b = e.target.closest('.muscle'); if (b) focusMuscle(b); });
  el.addEventListener('pointerout', (e) => { if (e.pointerType === 'mouse' && e.target.closest('.muscle')) focusMuscle(null); });
  el.addEventListener('focusin', (e) => { const b = e.target.closest('.muscle'); if (b) focusMuscle(b); });
  el.addEventListener('focusout', () => focusMuscle(null));
  el.addEventListener('click', (e) => {
    const b = e.target.closest('.muscle');
    if (!b) return;
    if (state.focus === b.dataset.k) focusMuscle(null); else focusMuscle(b);
  });
}

const playBtn = $('#play');
function setPlaying(v) {
  state.playing = v;
  playBtn.setAttribute('aria-pressed', v ? 'true' : 'false');
  playBtn.querySelector('.lbl').textContent = v ? 'Pausa' : 'Reproducir';
  playBtn.querySelector('.ico').textContent = v ? '❚❚' : '▶';
}
playBtn.addEventListener('click', () => setPlaying(!state.playing));
$('#speed').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-s]');
  if (!b) return;
  state.speed = parseFloat(b.dataset.s);
  $('#speed').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
});
$('#views').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-v]');
  if (!b || !state.ex) return;
  const v = { front: [0, 6], side: [-90, 6], back: [180, 6], auto: null }[b.dataset.v];
  frameCamera(state.ex, v);
});
$('#sex').addEventListener('click', async (e) => {
  const b = e.target.closest('button[data-sex]');
  if (!b || b.dataset.sex === state.sex) return;
  state.sex = b.dataset.sex;
  $('#sex').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
  await setModel(state.sex);
  await selectExercise(state.ex.id, { silent: true });
});
window.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea')) return;
  if (e.code === 'Space') { e.preventDefault(); setPlaying(!state.playing); }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const i = EXERCISES.indexOf(state.ex) + (e.key === 'ArrowDown' ? 1 : -1);
    if (EXERCISES[i]) { e.preventDefault(); selectExercise(EXERCISES[i].id); }
  }
});
window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (id && (!state.ex || id !== state.ex.id) && EXERCISES.some((e) => e.id === id)) selectExercise(id, { fromHash: true });
});

// ---------------- bucle ----------------
const phaseEl = $('#phase'), barEl = $('#bar');
const PHASE_TXT = {
  bottom: ['Inicio', 'Músculo estirado'], up: ['Concéntrica', 'El músculo se acorta'],
  top: ['Contracción máxima', 'Aprieta 1 s'], down: ['Excéntrica', 'Baja con control'], iso: ['Isométrico', 'Mantén la tensión'],
};
let last = performance.now();
let debugT = DEBUG_T;
window.__show = async (id, t, view) => { debugT = t; await selectExercise(id, { silent: true }); if (view) frameCamera(state.ex, view); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); };
let lastPhase = '';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function resize() {
  const r = stage.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / Math.max(r.height, 1);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (model && state.ex && state.keys) {
    if (state.playing) state.time += dt * state.speed * (reduceMotion.matches ? 0.6 : 1);
    let c;
    if (debugT !== null) c = { s: debugT, phase: debugT > 0.5 ? 'top' : 'bottom', pulse: debugT > 0.5 ? 1 : 0.3, frac: debugT };
    else c = cycle(state.ex, state.time);
    poseAt(c.s);
    model.painter.uniforms.uPulse.value = c.pulse;
    if (c.phase !== lastPhase) {
      lastPhase = c.phase;
      const [a, b] = PHASE_TXT[c.phase];
      phaseEl.innerHTML = `<b>${a}</b> ${b}`;
      phaseEl.dataset.phase = c.phase;
    }
    barEl.style.transform = `scaleX(${c.frac})`;
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// ---------------- arranque ----------------
(async function start() {
  renderList();
  resize();
  requestAnimationFrame(tick);
  let id = params.get('ex') || location.hash.slice(1);
  if (!id) try { id = localStorage.getItem('anat-ex'); } catch (e) { /* sin almacenamiento */ }
  if (params.get('sex') === 'f') {
    state.sex = 'f';
    $('#sex').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x.dataset.sex === 'f' ? 'true' : 'false'));
  }
  try {
    await selectExercise(id || EXERCISES[0].id, { silent: true, fromHash: true });
    if (params.get('view')) {
      const v = { front: [0, 6], side: [-90, 6], back: [180, 6] }[params.get('view')];
      if (v) frameCamera(state.ex, v);
    }
    if (params.get('cam')) { // depuración: cam=x,y,z,tx,ty,tz
      const c = params.get('cam').split(',').map(Number);
      camera.position.set(c[0], c[1], c[2]); controls.target.set(c[3], c[4], c[5]); controls.update();
    }
    setPlaying(state.playing);
    window.__ready = true;
  } catch (err) {
    console.error(err);
    setLoading('No se pudo cargar el modelo 3D. Recarga la página para intentarlo de nuevo.');
  }
})();
