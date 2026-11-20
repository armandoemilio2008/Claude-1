// Grupos musculares (ids del atributo _MUSCLE del modelo, de Z-Anatomy / BodyParts3D)
// y pintura por vértice con resaltado animado en el shader.
import * as THREE from '../vendor/three/three.module.min.js';

export const GROUPS = {
  pecho_sup:   { es: 'Pectoral mayor (porción clavicular)', la: 'Pars clavicularis m. pectoralis majoris', ids: [225, 228] },
  pecho:       { es: 'Pectoral mayor (porción esternocostal)', la: 'Pars sternocostalis m. pectoralis majoris', ids: [226, 227, 229, 230] },
  delt_ant:    { es: 'Deltoides anterior', la: 'Pars clavicularis m. deltoidei', ids: [280, 283] },
  delt_lat:    { es: 'Deltoides lateral', la: 'Pars acromialis m. deltoidei', ids: [279, 282] },
  delt_post:   { es: 'Deltoides posterior', la: 'Pars spinalis m. deltoidei', ids: [281, 284] },
  trap_sup:    { es: 'Trapecio superior', la: 'Pars descendens m. trapezii', ids: [203, 206] },
  trap_med:    { es: 'Trapecio medio e inferior', la: 'Pars transversa et ascendens m. trapezii', ids: [205, 208, 204, 207] },
  dorsal:      { es: 'Dorsal ancho y redondo mayor', la: 'M. latissimus dorsi, m. teres major', ids: [216, 222, 293, 294] },
  manguito:    { es: 'Infraespinoso y redondo menor', la: 'M. infraspinatus, m. teres minor', ids: [287, 288, 291, 292] },
  serrato:     { es: 'Serrato anterior', la: 'M. serratus anterior', ids: [238, 245] },
  biceps:      { es: 'Bíceps braquial', la: 'M. biceps brachii', ids: [295, 296, 297, 298] },
  braquial:    { es: 'Braquial', la: 'M. brachialis', ids: [299, 301] },
  braquiorrad: { es: 'Braquiorradial', la: 'M. brachioradialis', ids: [337, 342] },
  triceps:     { es: 'Tríceps braquial', la: 'M. triceps brachii', ids: [304, 305, 307, 308] },
  flex_ante:   { es: 'Flexores del antebrazo', la: 'Mm. flexores carpi', ids: [313, 315, 319, 320, 321, 322] },
  ext_ante:    { es: 'Extensores del antebrazo', la: 'Mm. extensores carpi et digitorum', ids: [331, 332, 334, 336, 338, 339, 343, 344] },
  abdomen:     { es: 'Recto abdominal', la: 'M. rectus abdominis', ids: [252, 253] },
  oblicuos:    { es: 'Oblicuo externo', la: 'M. obliquus externus abdominis', ids: [256, 257] },
  erectores:   { es: 'Erectores de la columna', la: 'M. erector spinae', ids: [163, 166, 169, 170] },
  gluteo:      { es: 'Glúteo mayor', la: 'M. gluteus maximus', ids: [406, 410] },
  gluteo_med:  { es: 'Glúteo medio', la: 'M. gluteus medius', ids: [405, 409] },
  cuadriceps:  { es: 'Cuádriceps', la: 'M. quadriceps femoris', ids: [426, 427, 428, 430, 431, 432] },
  flex_cadera: { es: 'Flexores de cadera', la: 'M. rectus femoris, m. sartorius, m. tensor fasciae latae', ids: [408, 412, 426, 430, 434, 435] },
  isquios:     { es: 'Isquiotibiales', la: 'M. biceps femoris, m. semitendinosus, m. semimembranosus', ids: [450, 452, 454, 455, 456, 457] },
  aductores:   { es: 'Aductores', la: 'Mm. adductores', ids: [436, 437, 438, 441, 443, 444, 445, 448] },
  gemelos:     { es: 'Gastrocnemio', la: 'M. gastrocnemius', ids: [472, 473, 475, 476] },
  soleo:       { es: 'Sóleo', la: 'M. soleus', ids: [478, 479] },
  tibial:      { es: 'Tibial anterior', la: 'M. tibialis anterior', ids: [462, 465] },
  ecm:         { es: 'Esternocleidomastoideo', la: 'M. sternocleidomastoideus', ids: [86, 87] },
};

const NON_MUSCLE = new Set([881, 724, 808, 474, 477]); // piel, rótulas, tendón de Aquiles

function hash(n) { let x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }

export class MusclePainter {
  constructor(mesh, musclesJson) {
    this.mesh = mesh;
    const g = mesh.geometry;
    this.ids = g.getAttribute('_muscle');
    const n = this.ids.count;
    this.side = {};
    for (const m of musclesJson.muscles) this.side[m.id] = m.side;

    // color base: écorché neutro con leve variación por músculo y costuras oscuras
    const base = new Float32Array(n * 3);
    const edge = new Uint8Array(n);
    const idx = g.index ? g.index.array : null;
    if (idx) {
      for (let i = 0; i < idx.length; i += 3) {
        const a = idx[i], b = idx[i + 1], c = idx[i + 2];
        const ia = this.ids.getX(a), ib = this.ids.getX(b), ic = this.ids.getX(c);
        if (ia !== ib || ib !== ic || ia !== ic) { edge[a] = edge[b] = edge[c] = 1; }
      }
    }
    for (let i = 0; i < n; i++) {
      const id = Math.round(this.ids.getX(i));
      let r, gg, bb;
      if (NON_MUSCLE.has(id)) { r = 0.82; gg = 0.81; bb = 0.82; }
      else {
        const v = 0.96 + hash(id) * 0.04;
        r = 0.80 * v; gg = 0.79 * v; bb = 0.81 * v;
      }
      if (edge[i]) { r *= 0.86; gg *= 0.85; bb *= 0.86; }
      base[i * 3] = r; base[i * 3 + 1] = gg; base[i * 3 + 2] = bb;
    }
    g.setAttribute('color', new THREE.BufferAttribute(base, 3));
    this.act = new Float32Array(n);
    this.actAttr = new THREE.BufferAttribute(this.act, 1);
    g.setAttribute('aAct', this.actAttr);

    this.uniforms = {
      uPulse: { value: 0.5 },
      uPrim: { value: new THREE.Color('#e0312b') },
      uSec: { value: new THREE.Color('#f39a2b') },
      uDim: { value: 0 },
    };
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.0 });
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.uniforms);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aAct;\nvarying float vAct;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAct = aAct;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vAct;\nuniform float uPulse;\nuniform vec3 uPrim;\nuniform vec3 uSec;\nuniform float uDim;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float prim = smoothstep(0.75, 0.95, vAct);
          float sec = smoothstep(0.3, 0.5, vAct) * (1.0 - prim);
          float lum = dot(diffuseColor.rgb, vec3(0.333));
          vec3 hp = uPrim * mix(0.78, 1.12, uPulse) * (0.55 + 0.6 * lum);
          vec3 hs = uSec * mix(0.85, 1.05, uPulse) * (0.55 + 0.6 * lum);
          diffuseColor.rgb = mix(diffuseColor.rgb, hp, prim);
          diffuseColor.rgb = mix(diffuseColor.rgb, hs, sec);
          float none = 1.0 - max(prim, sec);
          diffuseColor.rgb *= mix(1.0, 0.55, uDim * none);`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
          totalEmissiveRadiance += uPrim * prim * uPulse * 0.22;`);
    };
    mesh.material = mat;
  }

  // primary / secondary: listas de claves de GROUPS; side: 'R' | 'L' | undefined
  set(primary = [], secondary = [], side) {
    const val = new Map();
    const add = (keys, v) => {
      for (const k of keys) {
        const gr = GROUPS[k]; if (!gr) { console.warn('grupo desconocido', k); continue; }
        for (const id of gr.ids) {
          if (side && this.side[id] && this.side[id] !== side) continue;
          val.set(id, Math.max(val.get(id) || 0, v));
        }
      }
    };
    add(secondary, 0.6); add(primary, 1);
    for (let i = 0; i < this.act.length; i++) this.act[i] = val.get(Math.round(this.ids.getX(i))) || 0;
    this.actAttr.needsUpdate = true;
  }
}
