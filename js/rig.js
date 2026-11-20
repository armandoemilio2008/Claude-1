// Sistema de poses del esqueleto.
// Las poses se describen con direcciones de cada segmento en coordenadas del mundo
// (Y arriba, +Z hacia el frente del cuerpo en reposo, +X a la izquierda del modelo).
// Cada pose se resuelve una vez a cuaterniones locales y luego se interpola con slerp.
import * as THREE from '../vendor/three/three.module.min.js';

const DEG = Math.PI / 180;
const REL_KEYS = new Set(['clavR', 'armR', 'foreR', 'handR', 'clavL', 'armL', 'foreL', 'handL']);

// clave corta -> nombre del hueso del GLB
export const KEYS = {
  pelvis: 'Pelvis', spineL: 'Spine_Lower', spineU: 'Spine_Upper', neck: 'Neck', head: 'Head',
  clavR: 'Clavicle_R', armR: 'UpperArm_R', foreR: 'ForeArm_R', handR: 'Hand_R',
  fingR: 'Fingers_Proximal_R', fing2R: 'Fingers_Distal_R', thumbR: 'Thumb_R',
  clavL: 'Clavicle_L', armL: 'UpperArm_L', foreL: 'ForeArm_L', handL: 'Hand_L',
  fingL: 'Fingers_Proximal_L', fing2L: 'Fingers_Distal_L', thumbL: 'Thumb_L',
  thighR: 'Thigh_R', shinR: 'Shin_R', footR: 'Foot_R',
  thighL: 'Thigh_L', shinL: 'Shin_L', footL: 'Foot_L',
};
const ORDER = ['pelvis', 'spineL', 'spineU', 'neck', 'head',
  'clavR', 'armR', 'foreR', 'handR', 'fingR', 'fing2R', 'thumbR',
  'clavL', 'armL', 'foreL', 'handL', 'fingL', 'fing2L', 'thumbL',
  'thighR', 'shinR', 'footR', 'thighL', 'shinL', 'footL'];
const CHILD = {
  pelvis: 'spineL', spineL: 'spineU', spineU: 'neck', neck: 'head',
  clavR: 'armR', armR: 'foreR', foreR: 'handR', handR: 'fingR', fingR: 'fing2R',
  clavL: 'armL', armL: 'foreL', foreL: 'handL', handL: 'fingL', fingL: 'fing2L',
  thighR: 'shinR', shinR: 'footR', thighL: 'shinL', shinL: 'footL',
};
// direcciones de reposo para huesos terminales (mundo, sin normalizar)
const TERMINAL_DIR = {
  head: [0, 1, 0.12], footR: [0, -0.072, 0.19], footL: [0, -0.072, 0.19],
  fing2R: [-0.3, -0.35, 1], fing2L: [0.3, -0.35, 1], thumbR: [0.1, -0.3, 1], thumbL: [-0.1, -0.3, 1],
};

const mirrorV = (v) => [-v[0], v[1], v[2]];
const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]).normalize();
const perp = (v, axis) => v.clone().sub(axis.clone().multiplyScalar(v.dot(axis)));

export class Rig {
  constructor(root) {
    this.root = root; // gltf.scene
    this.bones = {};
    root.traverse((o) => { if (o.isBone) this.bones[o.name] = o; });
    this.b = {};
    for (const k of ORDER) this.b[k] = this.bones[KEYS[k]];
    root.updateMatrixWorld(true);
    this.rest = {};
    for (const k of ORDER) {
      const bone = this.b[k];
      const wq = new THREE.Quaternion(); const wp = new THREE.Vector3();
      bone.matrixWorld.decompose(wp, wq, new THREE.Vector3());
      this.rest[k] = { lq: bone.quaternion.clone(), lp: bone.position.clone(), wq, wp };
    }
    for (const k of ORDER) {
      const r = this.rest[k];
      if (CHILD[k]) r.dir = this.rest[CHILD[k]].wp.clone().sub(r.wp).normalize();
      else r.dir = v3(TERMINAL_DIR[k] || [0, 1, 0]);
    }
    // polos de reposo: hacia dónde mira el pliegue del codo (bíceps) / la rodilla
    for (const s of ['R', 'L']) {
      const a = this.rest['arm' + s], f = this.rest['fore' + s];
      a.pole = perp(f.dir, a.dir).normalize();
      this.rest['thigh' + s].pole = perp(new THREE.Vector3(0, 0, 1), this.rest['thigh' + s].dir).normalize();
    }
    // puntos de contacto en coordenadas locales del hueso
    this.points = {};
    const addPt = (name, key, world) => {
      const r = this.rest[key];
      const p = new THREE.Vector3(...world).sub(r.wp).applyQuaternion(r.wq.clone().invert());
      this.points[name] = { key, p };
    };
    addPt('heelR', 'footR', [-0.2, 0.0, -0.035]); addPt('toeR', 'footR', [-0.2, 0.0, 0.205]);
    addPt('heelL', 'footL', [0.2, 0.0, -0.035]); addPt('toeL', 'footL', [0.2, 0.0, 0.205]);
    addPt('gripR', 'handR', [-0.556, 1.022, 0.282]); addPt('gripL', 'handL', [0.556, 1.022, 0.282]);
    addPt('palmR', 'handR', [-0.53, 1.05, 0.25]); addPt('palmL', 'handL', [0.53, 1.05, 0.25]);
    addPt('kneeR', 'shinR', [-0.145, 0.5, 0.07]); addPt('kneeL', 'shinL', [0.145, 0.5, 0.07]);
    addPt('elbowR', 'foreR', [-0.39, 1.2, -0.03]); addPt('elbowL', 'foreL', [0.39, 1.2, -0.03]);
    addPt('ankleR', 'shinR', [-0.19, 0.12, 0.04]); addPt('ankleL', 'shinL', [0.19, 0.12, 0.04]);
    addPt('headTop', 'head', [0, 1.75, 0.06]);
    addPt('backTop', 'spineU', [0, 1.3, -0.1]); addPt('sacrum', 'pelvis', [0, 0.92, -0.09]);
  }

  // Resuelve una pose descriptiva a { q: {key: localQuat}, pos: Vector3 }
  solve(pose) {
    const d = { ...(pose.d || {}) }, pole = { ...(pose.pole || {}) }, tw = { ...(pose.tw || {}) };
    for (const src of [d, pole]) {
      for (const k of Object.keys(src)) {
        if (k.endsWith('R')) { const l = k.slice(0, -1) + 'L'; if (!(l in src)) src[l] = mirrorV(src[k]); }
      }
    }
    for (const k of Object.keys(tw)) {
      if (k.endsWith('R')) { const l = k.slice(0, -1) + 'L'; if (!(l in tw)) tw[l] = -tw[k]; }
    }
    const root = pose.root || {};
    const rr = (root.r || [0, 0, 0]).map((x) => x * DEG);
    const E = new THREE.Quaternion().setFromEuler(new THREE.Euler(rr[0], rr[1], rr[2], 'YXZ'));
    const W = {}, Q = {};
    W.pelvis = E.clone().multiply(this.rest.pelvis.wq);
    // por defecto la columna lumbar toma la mitad de la flexión de la torácica
    if (d.spineU && !d.spineL) d.__halfSpine = true;
    for (const k of ORDER) {
      if (k === 'pelvis') { Q[k] = W[k].clone(); continue; }
      const parent = this.parentKey(k);
      const pr = this.rest[parent], r = this.rest[k];
      const delta = W[parent].clone().multiply(pr.wq.clone().invert());
      let q = delta.clone().multiply(r.wq);
      let target = d[k] ? v3(d[k]) : null;
      // direcciones relativas al tórax (brazos que acompañan la inclinación del torso)
      const relQ = (pose.rel && REL_KEYS.has(k)) ? W.spineU.clone().multiply(this.rest.spineU.wq.clone().invert()) : null;
      if (target && relQ) target.applyQuaternion(relQ);
      if (k === 'spineL' && d.__halfSpine) {
        const cd = r.dir.clone().applyQuaternion(delta);
        const full = new THREE.Quaternion().setFromUnitVectors(cd, v3(d.spineU));
        const half = new THREE.Quaternion().slerp(full, 0.45);
        target = cd.clone().applyQuaternion(half);
      }
      if (target) {
        const cd = r.dir.clone().applyQuaternion(delta);
        q = new THREE.Quaternion().setFromUnitVectors(cd, target).multiply(q);
        // polo (rotación axial) para brazo y muslo
        let want = null;
        if (r.pole) {
          const childK = CHILD[k];
          const ct = d[childK] ? v3(d[childK]) : null;
          if (ct && relQ) ct.applyQuaternion(relQ);
          if (ct && ct.angleTo(target) > 14 * DEG) {
            want = perp(ct, target);
            if (k.startsWith('thigh')) want.negate(); // la rodilla mira al lado opuesto del pliegue
          } else if (pole[k]) want = perp(relQ ? v3(pole[k]).applyQuaternion(relQ) : v3(pole[k]), target);
          else {
            const def = k.startsWith('thigh') ? [0, 0, 1] : [0, 0, 1];
            want = perp(v3(def), target);
            if (want.lengthSq() < 0.05) want = perp(v3(k.startsWith('thigh') ? [0, 1, 0] : [0, 1, 0]), target);
          }
          if (want && want.lengthSq() > 1e-6) {
            want.normalize();
            const cur = perp(r.pole.clone().applyQuaternion(q.clone().multiply(r.wq.clone().invert())), target).normalize();
            const ang = Math.atan2(cur.clone().cross(want).dot(target), cur.dot(want));
            q = new THREE.Quaternion().setFromAxisAngle(target, ang).multiply(q);
          }
        }
        if (tw[k]) q = new THREE.Quaternion().setFromAxisAngle(target, tw[k] * DEG).multiply(q);
      } else if (tw[k]) {
        const axis = r.dir.clone().applyQuaternion(delta);
        q = new THREE.Quaternion().setFromAxisAngle(axis, tw[k] * DEG).multiply(q);
      }
      W[k] = q;
      Q[k] = W[parent].clone().invert().multiply(q);
    }
    // agarre: flexión de dedos alrededor del eje transversal de la mano
    const grip = pose.grip ?? 0;
    for (const s of ['R', 'L']) {
      const g = typeof grip === 'object' ? (grip[s] ?? 0) : grip;
      if (!g) continue;
      for (const [fk, ang] of [['fing' + s, 75], ['fing2' + s, 80]]) {
        const axis = this.gripAxis(s);
        Q[fk] = Q[fk].clone().multiply(new THREE.Quaternion().setFromAxisAngle(axis, ang * g * DEG));
      }
    }
    const pos = new THREE.Vector3(...(root.p || this.rest.pelvis.wp.toArray()));
    return { q: Q, pos };
  }

  // eje local (del hueso de los dedos) para cerrar la mano
  gripAxis(s) {
    return new THREE.Vector3(0, 0, 1); // validado visualmente en ambas manos
  }

  parentKey(k) {
    const n = this.b[k].parent.name;
    return Object.keys(KEYS).find((x) => KEYS[x] === n);
  }

  apply(a, b, t) {
    for (const k of ORDER) {
      if (k === 'pelvis') continue;
      this.b[k].quaternion.slerpQuaternions(a.q[k], b.q[k], t);
    }
    this.b.pelvis.quaternion.slerpQuaternions(a.q.pelvis, b.q.pelvis, t);
    this.b.pelvis.position.lerpVectors(a.pos, b.pos, t);
    this.root.updateMatrixWorld(true);
  }

  point(name, out = new THREE.Vector3()) {
    const pt = this.points[name];
    return out.copy(pt.p).applyMatrix4(this.b[pt.key].matrixWorld);
  }
  bonePos(key, out = new THREE.Vector3()) { return out.setFromMatrixPosition(this.b[key].matrixWorld); }

  // desplaza el cuerpo para que el punto más bajo de los indicados quede a la altura y
  plant(names, y) {
    let min = Infinity;
    const v = new THREE.Vector3();
    for (const n of names) min = Math.min(min, this.point(n, v).y);
    if (!isFinite(min)) return;
    this.b.pelvis.position.y += y - min;
    this.root.updateMatrixWorld(true);
  }
  // fija un punto del cuerpo en una posición (x/y/z opcionales)
  pin(name, target) {
    const v = this.point(name, new THREE.Vector3());
    const p = this.b.pelvis.position;
    if (target[0] != null) p.x += target[0] - v.x;
    if (target[1] != null) p.y += target[1] - v.y;
    if (target[2] != null) p.z += target[2] - v.z;
    this.root.updateMatrixWorld(true);
  }
}
