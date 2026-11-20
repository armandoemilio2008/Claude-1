// Equipo de gimnasio con primitivas: fijo (bancos, máquinas) o que sigue al cuerpo (barra, mancuernas, cable).
import * as THREE from '../vendor/three/three.module.min.js';

const DEG = Math.PI / 180;
const UP = new THREE.Vector3(0, 1, 0);

export function makeMaterials() {
  return {
    metal: new THREE.MeshStandardMaterial({ color: 0x8a929c, metalness: 0.75, roughness: 0.32 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2b3038, metalness: 0.35, roughness: 0.55 }),
    pad: new THREE.MeshStandardMaterial({ color: 0x313946, metalness: 0.0, roughness: 0.82 }),
    plate: new THREE.MeshStandardMaterial({ color: 0x1d2026, metalness: 0.2, roughness: 0.6 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x3d4552, metalness: 0.0, roughness: 0.95 }),
    cable: new THREE.MeshStandardMaterial({ color: 0x15171b, metalness: 0.2, roughness: 0.5 }),
    accent: new THREE.MeshStandardMaterial({ color: 0x2f7d77, metalness: 0.1, roughness: 0.6 }),
  };
}

function box(mat, s, p, r = [0, 0, 0]) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(s[0], s[1], s[2]), mat);
  m.position.set(...p); m.rotation.set(r[0] * DEG, r[1] * DEG, r[2] * DEG, 'YXZ');
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
// cilindro entre dos puntos
function rod(mat, a, b, radius) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 16), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, B.clone().sub(A).normalize());
  m.castShadow = true;
  return m;
}
function legs(g, M, cx, cz, w, d, h) {
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.add(box(M.dark, [0.05, h, 0.05], [cx + dx * (w / 2 - 0.04), h / 2, cz + dz * (d / 2 - 0.05)]));
  }
}

// ---------- equipo fijo ----------
export const FIXED = {
  // banco plano a lo largo de Z
  bench(M, o = {}) {
    const g = new THREE.Group();
    const h = o.h ?? 0.44, len = o.len ?? 1.2, z = o.z ?? 0, x = o.x ?? 0;
    g.add(box(M.pad, [0.3, 0.07, len], [x, h - 0.035, z]));
    g.add(box(M.dark, [0.08, 0.06, len - 0.1], [x, h - 0.1, z]));
    legs(g, M, x, z, 0.3, len, h - 0.07);
    return g;
  },
  // banco inclinado: asiento + respaldo con ángulo (grados respecto al suelo), respaldo hacia -Z
  incline(M, o = {}) {
    const g = new THREE.Group();
    const a = o.angle ?? 35, h = o.h ?? 0.46, z0 = o.z ?? 0, x = o.x ?? 0, back = o.back ?? 0.95;
    g.add(box(M.pad, [0.3, 0.07, 0.36], [x, h, z0 + 0.12], [0, 0, 0]));
    const cz = z0 - 0.06 - Math.cos(a * DEG) * back / 2, cy = h + 0.03 + Math.sin(a * DEG) * back / 2;
    g.add(box(M.pad, [0.3, 0.07, back], [x, cy, cz], [a, 0, 0]));
    g.add(box(M.dark, [0.08, h - 0.05, 0.08], [x, (h - 0.05) / 2, z0]));
    g.add(box(M.dark, [0.08, cy, 0.08], [x, cy / 2, cz]));
    g.add(box(M.dark, [0.5, 0.05, 0.08], [x, 0.025, z0 + 0.2]));
    g.add(box(M.dark, [0.5, 0.05, 0.08], [x, 0.025, cz - 0.3]));
    return g;
  },
  // asiento de máquina con respaldo vertical (o inclinado hacia atrás)
  seat(M, o = {}) {
    const g = new THREE.Group();
    const h = o.h ?? 0.46, z = o.z ?? 0, x = o.x ?? 0, a = o.backAngle ?? 85, bz = o.backZ ?? (z - 0.2);
    g.add(box(M.pad, [0.42, 0.08, 0.42], [x, h, z]));
    if (o.back !== false) {
      const len = o.backLen ?? 0.62;
      g.add(box(M.pad, [0.38, 0.07, len], [x, h + 0.04 + Math.sin(a * DEG) * len / 2, bz - Math.cos(a * DEG) * len / 2], [a, 0, 0]));
    }
    g.add(box(M.dark, [0.1, h - 0.04, 0.1], [x, (h - 0.04) / 2, z - 0.05]));
    g.add(box(M.dark, [0.6, 0.05, 0.6], [x, 0.025, z - 0.05]));
    return g;
  },
  stool(M, o = {}) { return FIXED.seat(M, { ...o, back: false }); },
  // torre de poleas en (x,z) con polea a altura y
  tower(M, o = {}) {
    const g = new THREE.Group();
    const x = o.x ?? 0, z = o.z ?? -0.8, h = o.h ?? 2.2;
    g.add(box(M.dark, [0.09, h, 0.09], [x - 0.22, h / 2, z]));
    g.add(box(M.dark, [0.09, h, 0.09], [x + 0.22, h / 2, z]));
    g.add(box(M.dark, [0.53, 0.09, 0.09], [x, h, z]));
    g.add(box(M.dark, [0.7, 0.05, 0.5], [x, 0.025, z]));
    // pila de pesas
    for (let i = 0; i < 9; i++) g.add(box(M.plate, [0.3, 0.035, 0.12], [x, 0.08 + i * 0.04, z]));
    if (o.pz != null && Math.abs(o.pz - z) > 0.1) {
      const py = o.py ?? h - 0.1;
      g.add(box(M.dark, [0.08, 0.08, Math.abs(o.pz - z) + 0.1], [o.px ?? x, py + 0.08, (o.pz + z) / 2]));
    }
    for (const y of o.pulleys ?? [o.py ?? h - 0.1]) {
      const p = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.014, 8, 20), M.metal);
      p.position.set(o.px ?? x, y, (o.pz ?? z) + 0.06);
      p.rotation.y = Math.PI / 2;
      g.add(p);
    }
    return g;
  },
  // barra de dominadas a altura y, a lo largo de X
  pullbar(M, o = {}) {
    const g = new THREE.Group();
    const y = o.y ?? 2.3, z = o.z ?? 0;
    g.add(rod(M.metal, [-0.75, y, z], [0.75, y, z], 0.016));
    g.add(box(M.dark, [0.08, y + 0.05, 0.08], [-0.8, (y + 0.05) / 2, z]));
    g.add(box(M.dark, [0.08, y + 0.05, 0.08], [0.8, (y + 0.05) / 2, z]));
    g.add(box(M.dark, [0.1, 0.05, 0.7], [-0.8, 0.025, z]));
    g.add(box(M.dark, [0.1, 0.05, 0.7], [0.8, 0.025, z]));
    return g;
  },
  // paralelas para fondos, a lo largo de Z
  dipbars(M, o = {}) {
    const g = new THREE.Group();
    const y = o.y ?? 1.25, w = o.w ?? 0.27, z = o.z ?? 0.02;
    for (const sx of [-1, 1]) {
      g.add(rod(M.metal, [sx * w, y, z - 0.45], [sx * w, y, z + 0.45], 0.02));
      g.add(box(M.dark, [0.06, y, 0.06], [sx * w, y / 2, z - 0.4]));
      g.add(box(M.dark, [0.06, y, 0.06], [sx * w, y / 2, z + 0.4]));
    }
    return g;
  },
  mat(M, o = {}) {
    const m = box(M.rubber, [o.w ?? 0.62, 0.012, o.len ?? 1.85], [o.x ?? 0, 0.006, o.z ?? 0], [0, o.ry ?? 0, 0]);
    return m;
  },
  // pupitre de curl predicador: almohadilla inclinada frente al pecho
  preacher(M, o = {}) {
    const g = FIXED.seat(M, { h: o.seatH ?? 0.52, z: o.seatZ ?? -0.05, back: false });
    const y = o.y ?? 1.08, z = o.z ?? 0.2, a = o.angle ?? 45;
    g.add(box(M.pad, [0.55, 0.06, 0.34], [0, y, z], [a, 0, 0]));
    g.add(box(M.dark, [0.08, y - 0.1, 0.08], [0, (y - 0.1) / 2, z + 0.12]));
    return g;
  },
  // prensa de piernas 45°: respaldo reclinado; el carro lo mueve un seguidor
  legpress(M, o = {}) {
    const g = new THREE.Group();
    g.add(box(M.pad, [0.46, 0.08, 0.5], [0, 0.42, -0.05], [12, 0, 0]));
    g.add(box(M.pad, [0.46, 0.07, 0.8], [0, 0.68, -0.48], [62, 0, 0]));
    g.add(box(M.dark, [0.6, 0.1, 2.2], [0, 0.05, 0.4]));
    // raíles a 45°
    for (const sx of [-1, 1]) g.add(rod(M.metal, [sx * 0.3, 0.3, 0.2], [sx * 0.3, 1.6, 1.5], 0.025));
    return g;
  },
  // máquina de extensión/curl de piernas: asiento + respaldo
  legmachine(M, o = {}) {
    const g = FIXED.seat(M, { h: 0.5, z: 0, backZ: -0.24, backAngle: 80, backLen: 0.65 });
    g.add(box(M.dark, [0.08, 0.5, 0.08], [0.32, 0.25, 0.28]));
    const axle = rod(M.metal, [-0.34, 0.5, 0.3], [0.34, 0.5, 0.3], 0.02);
    g.add(axle);
    return g;
  },
  // máquina de pec deck / aperturas
  pecdeck(M, o = {}) {
    const g = FIXED.seat(M, { h: 0.48, z: 0, backZ: o.reverse ? 0.24 : -0.2, backAngle: o.reverse ? 95 : 88, backLen: 0.7 });
    g.add(box(M.dark, [0.12, 2.0, 0.12], [0, 1.0, o.reverse ? 0.35 : -0.38]));
    g.add(box(M.dark, [0.9, 0.08, 0.1], [0, 1.95, o.reverse ? 0.35 : -0.38]));
    return g;
  },
  // máquina de pantorrilla de pie: escalón
  step(M, o = {}) {
    const g = new THREE.Group();
    g.add(box(M.dark, [0.6, o.h ?? 0.1, 0.24], [0, (o.h ?? 0.1) / 2, o.z ?? 0.1]));
    return g;
  },
  // rack de sentadilla (decorativo)
  rack(M, o = {}) {
    const g = new THREE.Group();
    const z = o.z ?? -0.35;
    for (const sx of [-1, 1]) for (const dz of [0, -0.6]) g.add(box(M.dark, [0.07, 2.3, 0.07], [sx * 0.65, 1.15, z + dz]));
    g.add(box(M.dark, [1.37, 0.07, 0.07], [0, 2.3, z]));
    g.add(box(M.dark, [1.37, 0.07, 0.07], [0, 2.3, z - 0.6]));
    return g;
  },
  // caja o plataforma genérica
  block(M, o = {}) {
    return box(o.mat === 'dark' ? M.dark : M.pad, o.s ?? [0.5, 0.1, 0.3], o.p ?? [0, 0.05, 0], o.r ?? [0, 0, 0]);
  },
  // anillas de seguridad para hip thrust: banco a lo ancho (eje X)
  crossbench(M, o = {}) {
    const g = new THREE.Group();
    const h = o.h ?? 0.42, z = o.z ?? -0.25;
    g.add(box(M.pad, [1.1, 0.08, 0.32], [0, h - 0.04, z]));
    g.add(box(M.dark, [0.06, h - 0.08, 0.26], [-0.45, (h - 0.08) / 2, z]));
    g.add(box(M.dark, [0.06, h - 0.08, 0.26], [0.45, (h - 0.08) / 2, z]));
    return g;
  },
};

// ---------- equipo que sigue al cuerpo ----------
function barbellMesh(M, len = 1.9, plates = 2, plateR = 0.2) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.0135, 0.0135, len, 14), M.metal));
  for (const s of [-1, 1]) {
    for (let i = 0; i < plates; i++) {
      const r = plateR - i * 0.04;
      const pl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.035, 32), M.plate);
      pl.position.y = s * (len / 2 - 0.27 + i * 0.04);
      g.add(pl);
    }
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 12), M.metal);
    col.position.y = s * (len / 2 - 0.31);
    g.add(col);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function dumbbellMesh(M, kg = 1) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.15, 12), M.metal));
  const r = 0.05 + 0.02 * kg, w = 0.05 + 0.02 * kg;
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 6), M.plate);
    h.position.y = s * (0.075 + w / 2);
    g.add(h);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export const FOLLOW = {
  // barra entre ambas manos
  barbell(M, rig, o = {}) {
    const mesh = barbellMesh(M, o.len ?? 1.9, o.plates ?? 2, o.plateR ?? 0.2);
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    return { mesh, update() {
      rig.point('gripR', a); rig.point('gripL', b);
      mesh.position.copy(a).add(b).multiplyScalar(0.5);
      if (o.offset) mesh.position.add(new THREE.Vector3(...o.offset));
      mesh.quaternion.setFromUnitVectors(UP, b.sub(a).normalize());
    } };
  },
  // mancuerna en una mano (s = 'R' | 'L')
  dumbbell(M, rig, o = {}) {
    const s = o.s ?? 'R';
    const mesh = dumbbellMesh(M, o.kg ?? 1);
    const p = new THREE.Vector3(), q = new THREE.Quaternion();
    const axisLocal = rig.gripAxis(s).clone();
    return { mesh, update() {
      rig.point('grip' + s, p);
      mesh.position.copy(p);
      rig.b['fing' + s].getWorldQuaternion(q);
      const ax = axisLocal.clone().applyQuaternion(q).normalize();
      mesh.quaternion.setFromUnitVectors(UP, ax);
    } };
  },
  // cable desde una polea fija hasta la(s) mano(s) con agarre
  cable(M, rig, o = {}) {
    const g = new THREE.Group();
    const from = new THREE.Vector3(...o.from);
    const hands = o.hands ?? 'both';
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1, 6), M.cable);
    g.add(line);
    let handle = null;
    if (o.handle === 'bar') handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, o.barLen ?? 0.5, 12), M.metal);
    else if (o.handle === 'rope') {
      handle = new THREE.Group();
      handle.userData.rope = [0, 1].map(() => {
        const r = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 8), M.cable); handle.add(r); return r;
      });
    } else if (o.handle === 'v') handle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.04), M.metal);
    else handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 16), M.metal);
    g.add(handle);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), mid = new THREE.Vector3();
    const setRod = (m, p1, p2) => {
      const len = p1.distanceTo(p2);
      m.position.copy(p1).add(p2).multiplyScalar(0.5);
      m.scale.set(1, Math.max(len, 0.001), 1);
      m.quaternion.setFromUnitVectors(UP, p2.clone().sub(p1).normalize());
    };
    return { mesh: g, update() {
      if (hands === 'both') { rig.point('gripR', a); rig.point('gripL', b); mid.copy(a).add(b).multiplyScalar(0.5); }
      else { rig.point('grip' + hands, mid); a.copy(mid); b.copy(mid); }
      if (o.handleOffset) mid.add(new THREE.Vector3(...o.handleOffset));
      let anchor = mid.clone();
      if (o.handle === 'rope') {
        anchor = mid.clone().add(from.clone().sub(mid).normalize().multiplyScalar(0.12));
        setRod(handle.userData.rope[0], anchor, a);
        setRod(handle.userData.rope[1], anchor, b);
      } else if (o.handle === 'bar') {
        handle.position.copy(mid);
        handle.quaternion.setFromUnitVectors(UP, hands === 'both' ? b.clone().sub(a).normalize() : new THREE.Vector3(1, 0, 0));
      } else {
        handle.position.copy(mid);
      }
      setRod(line, from, anchor);
    } };
  },
  // plataforma que sigue la planta de los pies (prensa); normal fija
  platform(M, rig, o = {}) {
    const g = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.5), M.dark);
    plate.castShadow = true; g.add(plate);
    const n = new THREE.Vector3(...(o.normal ?? [0, -0.7, -0.7])).normalize();
    const pts = ['heelR', 'toeR', 'heelL', 'toeL'];
    const v = new THREE.Vector3(), c = new THREE.Vector3();
    return { mesh: g, update() {
      c.set(0, 0, 0);
      for (const p of pts) c.add(rig.point(p, v));
      c.multiplyScalar(0.25);
      g.position.copy(c).add(n.clone().multiplyScalar(-0.04));
      g.quaternion.setFromUnitVectors(UP, n);
    } };
  },
  // rodillo acolchado que sigue un punto (tobillo) con eje X
  roller(M, rig, o = {}) {
    const g = new THREE.Group();
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.42, 16), M.pad);
    r.rotation.z = Math.PI / 2; g.add(r);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1, 0.04), M.dark);
    g.add(arm);
    const piv = new THREE.Vector3(...(o.pivot ?? [0.3, 0.5, 0.3]));
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    const offs = new THREE.Vector3(...(o.offset ?? [0, 0, 0.07]));
    return { mesh: g, update() {
      rig.point('ankleR', a); rig.point('ankleL', b);
      const c = a.add(b).multiplyScalar(0.5);
      // desplazamiento perpendicular a la tibia (delante o detrás)
      const shin = rig.bonePos('shinR', new THREE.Vector3()).sub(rig.point('ankleR', new THREE.Vector3())).normalize();
      const side = new THREE.Vector3(1, 0, 0);
      const fwd = side.clone().cross(shin).normalize().multiplyScalar(offs.z);
      r.position.copy(c).add(fwd);
      r.position.x = 0;
      const p2 = new THREE.Vector3(piv.x, piv.y, piv.z);
      const end = new THREE.Vector3(piv.x, r.position.y, r.position.z);
      arm.position.copy(p2).add(end).multiplyScalar(0.5);
      arm.scale.y = Math.max(p2.distanceTo(end), 0.01);
      arm.quaternion.setFromUnitVectors(UP, end.clone().sub(p2).normalize());
    } };
  },
  // brazos móviles de pec deck: almohadillas que siguen los antebrazos / manos
  handles(M, rig, o = {}) {
    const g = new THREE.Group();
    const parts = ['R', 'L'].map((s) => {
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 10), M.metal);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1, 0.03), M.dark);
      g.add(h); g.add(arm);
      return { s, h, arm };
    });
    const piv = o.pivots ?? { R: [-0.12, 1.9, o.z ?? -0.3], L: [0.12, 1.9, o.z ?? -0.3] };
    const p = new THREE.Vector3();
    return { mesh: g, update() {
      for (const { s, h, arm } of parts) {
        rig.point('grip' + s, p);
        h.position.copy(p);
        const top = new THREE.Vector3(p.x, p.y + 0.09, p.z);
        const P = new THREE.Vector3(...piv[s]);
        arm.position.copy(top).add(P).multiplyScalar(0.5);
        arm.scale.y = top.distanceTo(P);
        arm.quaternion.setFromUnitVectors(UP, P.clone().sub(top).normalize());
      }
    } };
  },
};
