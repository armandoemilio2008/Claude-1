// Biblioteca de ejercicios. Cada ejercicio define dos poses clave:
//   k[0] = INICIO (músculo estirado), k[1] = FINAL (músculo contraído).
// Direcciones en coordenadas del mundo: Y arriba, +Z al frente, -X = lado derecho del modelo.
// Solo se escribe el lado derecho (R); el izquierdo se refleja salvo que se indique.
// `rel: true` hace que los brazos se describan respecto al tórax (como si estuviera erguido).
const R = Math.PI / 180;
// plano sagital: a=0 abajo, 90 al frente, 180 arriba; x = componente lateral (negativo = hacia la derecha)
export const sag = (a, x = 0) => [x, -Math.cos(a * R), Math.sin(a * R)];

// giro del antebrazo: palmas al frente / neutras (mirándose) / hacia atrás
const SUP = 90, NEU = 0, PRO = -75;
const FOOT = [-0.06, -0.36, 1];
const STAND = {
  d: { armR: [-0.17, -1, 0.02], foreR: [-0.08, -1, 0.12], thighR: [-0.03, -1, 0], shinR: [-0.02, -1, -0.01], footR: FOOT },
  tw: { foreR: NEU },
};
// sentado en un asiento de altura h (pelvis sobre el asiento), muslos al frente
const SIT = (h = 0.46, z = 0) => ({
  root: { p: [0, h + 0.1, z] },
  d: { thighR: [-0.14, 0.02, 1], shinR: [-0.05, -1, 0.12], footR: FOOT },
});
export function P(base, o = {}) {
  return {
    root: { ...(base.root || {}), ...(o.root || {}) },
    d: { ...(base.d || {}), ...(o.d || {}) },
    pole: { ...(base.pole || {}), ...(o.pole || {}) },
    tw: { ...(base.tw || {}), ...(o.tw || {}) },
    grip: o.grip ?? base.grip ?? 1,
    rel: o.rel ?? base.rel ?? false,
  };
}
const FEET = ['heelR', 'heelL', 'toeR', 'toeL'];
const DB = [{ follow: 'dumbbell', s: 'R' }, { follow: 'dumbbell', s: 'L' }];

export const CATEGORIES = [
  { id: 'pecho', es: 'Pecho' }, { id: 'espalda', es: 'Espalda' }, { id: 'hombro', es: 'Hombro' },
  { id: 'brazos', es: 'Brazos' }, { id: 'piernas', es: 'Piernas' }, { id: 'core', es: 'Core' },
];

// ---------- poses base reutilizadas ----------
const SUPINE_BENCH = {
  root: { p: [0, 0.535, 0.3], r: [-90, 0, 0] },
  d: { thighR: [-0.2, -0.05, 1], shinR: [-0.06, -1, 0.04], footR: FOOT },
};
const INCLINE = {
  root: { p: [0, 0.58, 0.06], r: [-55, 0, 0] },
  d: { thighR: [-0.16, 0.1, 1], shinR: [-0.06, -1, 0.15], footR: FOOT },
};

export const EXERCISES = [
  // ======================= PECHO =======================
  {
    id: 'press-banca', name: 'Press de banca plano', cat: 'pecho', equip: 'Barra y banco plano', compound: true,
    primary: ['pecho', 'pecho_sup'], secondary: ['triceps', 'delt_ant'],
    cues: ['Omóplatos juntos y pies firmes en el suelo.', 'Baja la barra a la mitad del pecho con los codos a ~45°.', 'Empuja hacia arriba sin bloquear de golpe los codos.'],
    view: [-62, 18, 3.4],
    props: [{ fixed: 'bench', z: -0.05 }, { follow: 'barbell' }],
    k: [
      P(SUPINE_BENCH, { d: { armR: [-0.85, -0.3, 0.3], foreR: [-0.05, 1, 0.06] }, tw: { foreR: PRO } }),
      P(SUPINE_BENCH, { d: { armR: [-0.3, 1, 0.1], foreR: [-0.04, 1, 0.02] }, pole: { armR: [0, 0, 1] }, tw: { foreR: PRO } }),
    ],
  },
  {
    id: 'press-inclinado-barra', name: 'Press inclinado con barra', cat: 'pecho', equip: 'Barra y banco inclinado', compound: true,
    pdf: { day: 'Lun · Push', sets: 3, reps: '6–8', rest: '2–3 min' },
    primary: ['pecho_sup', 'pecho'], secondary: ['delt_ant', 'triceps'],
    cues: ['Banco a 30–40°.', 'Baja la barra a la parte alta del pecho, codos a ~45°.', 'Sube sin bloquear los codos.'],
    view: [-65, 14, 3.4],
    props: [{ fixed: 'incline', angle: 35, z: 0.12 }, { follow: 'barbell' }],
    k: [
      P(INCLINE, { d: { armR: [-0.85, -0.42, -0.3], foreR: [-0.05, 0.85, 0.5] }, tw: { foreR: PRO } }),
      P(INCLINE, { d: { armR: [-0.3, 0.85, 0.45], foreR: [-0.03, 0.85, 0.5] }, pole: { armR: [0, -0.5, 1] }, tw: { foreR: PRO } }),
    ],
  },
  {
    id: 'press-inclinado-mancuernas', name: 'Press inclinado con mancuernas', cat: 'pecho', equip: 'Mancuernas y banco inclinado', compound: true,
    pdf: { day: 'Vie · Torso', sets: 3, reps: '8–10', rest: '2 min' },
    primary: ['pecho_sup', 'pecho'], secondary: ['delt_ant', 'triceps'],
    cues: ['Mancuernas a los lados del pecho.', 'Súbelas juntándolas ligeramente arriba.', 'Baja con control hasta sentir el estiramiento.'],
    view: [-40, 14, 3.4],
    props: [{ fixed: 'incline', angle: 35, z: 0.12 }, ...DB],
    k: [
      P(INCLINE, { d: { armR: [-0.85, -0.45, -0.25], foreR: [-0.08, 0.85, 0.5] }, tw: { foreR: PRO } }),
      P(INCLINE, { d: { armR: [-0.12, 0.85, 0.5], foreR: [0.08, 0.85, 0.5] }, pole: { armR: [0, -0.5, 1] }, tw: { foreR: PRO } }),
    ],
  },
  {
    id: 'aperturas-maquina', name: 'Aperturas en máquina (pec deck)', cat: 'pecho', equip: 'Máquina pec deck',
    pdf: { day: 'Lun · Push', sets: 2, reps: '10–12', rest: '90 s' },
    primary: ['pecho', 'pecho_sup'], secondary: ['delt_ant', 'serrato'],
    cues: ['Espalda pegada al respaldo.', 'Abre con control hasta sentir el estiramiento.', 'Junta las manos sin chocar las pesas.'],
    view: [25, 30, 3.4],
    props: [{ fixed: 'pecdeck' }, { follow: 'handles', z: -0.28 }],
    k: [
      P(SIT(0.48, 0.02), { d: { armR: [-1, 0.0, -0.18], foreR: [-0.85, 0.05, 0.5] }, tw: { foreR: NEU } }),
      P(SIT(0.48, 0.02), { d: { armR: [-0.4, 0.0, 1], foreR: [0.3, 0.05, 1] }, pole: { armR: [0, 0, 1] }, tw: { foreR: NEU } }),
    ],
  },
  {
    id: 'fondos', name: 'Fondos en paralelas', cat: 'pecho', equip: 'Paralelas', compound: true,
    primary: ['pecho', 'triceps'], secondary: ['delt_ant', 'pecho_sup'],
    cues: ['Inclina el torso un poco al frente para cargar el pecho.', 'Baja hasta que los brazos queden paralelos al suelo.', 'Empuja hasta extender los codos.'],
    view: [-58, 10, 3.8],
    props: [{ fixed: 'dipbars', y: 1.28, w: 0.25 }],
    pin: { pt: 'gripR', at: [null, 1.3, 0.02] },
    k: [
      P(STAND, { root: { r: [22, 0, 0] }, d: { armR: [-0.1, -0.55, -0.85], foreR: [-0.06, -1, 0.06], thighR: [-0.04, -0.95, 0.3], shinR: [0, -0.55, -0.85], footR: [0, -0.7, 0.7] }, tw: { foreR: 30 }, grip: 1 }),
      P(STAND, { root: { r: [12, 0, 0] }, d: { armR: [-0.1, -1, 0.0], foreR: [-0.06, -1, 0.04], thighR: [-0.04, -0.95, 0.3], shinR: [0, -0.55, -0.85], footR: [0, -0.7, 0.7] }, tw: { foreR: 30 }, pole: { armR: [0, 0, 1] }, grip: 1 }),
    ],
  },
  {
    id: 'flexiones', name: 'Flexiones de pecho', cat: 'pecho', equip: 'Peso corporal', compound: true,
    primary: ['pecho'], secondary: ['triceps', 'delt_ant', 'abdomen'],
    cues: ['Manos algo más abiertas que los hombros.', 'Cuerpo en línea recta de cabeza a talones.', 'Baja el pecho casi al suelo y empuja.'],
    view: [-80, 10, 3.6],
    props: [{ fixed: 'mat', z: 0.15 }],
    plant: ['palmR', 'palmL', 'toeR', 'toeL'],
    k: [
      P({}, { root: { p: [0, 0.3, -0.3], r: [82, 0, 0] }, d: { armR: [-0.55, 0.4, -0.75], foreR: [0.04, -1, 0.0], handR: [-0.3, -0.1, 1], thighR: [-0.03, -0.14, -1], shinR: [-0.02, -0.14, -1], footR: [0, -1, 0.15] }, tw: { foreR: 0 }, grip: 0 }),
      P({}, { root: { p: [0, 0.6, -0.3], r: [67, 0, 0] }, d: { armR: [-0.18, -1, 0.05], foreR: [-0.02, -1, 0.0], handR: [-0.3, -0.1, 1], thighR: [-0.03, -0.39, -0.92], shinR: [-0.02, -0.39, -0.92], footR: [0, -0.92, 0.4] }, tw: { foreR: 0 }, grip: 0 }),
    ],
  },

  // ======================= ESPALDA =======================
  {
    id: 'dominadas', name: 'Dominadas', cat: 'espalda', equip: 'Barra fija', compound: true,
    primary: ['dorsal'], secondary: ['biceps', 'braquial', 'trap_med', 'delt_post', 'braquiorrad'],
    cues: ['Agarre prono algo más ancho que los hombros.', 'Lleva el pecho a la barra bajando los codos.', 'Baja hasta extender los brazos sin balancearte.'],
    view: [-30, 4, 4.4],
    props: [{ fixed: 'pullbar', y: 2.32, z: 0.02 }],
    include: [[0, 2.42, 0]],
    pin: { pt: 'gripR', at: [null, 2.32, 0.02] },
    k: [
      P(STAND, { d: { armR: [-0.36, 1, 0.02], foreR: [-0.3, 1, 0.0], thighR: [-0.03, -1, 0.12], shinR: [0, -0.9, -0.45], footR: [0, -0.7, 0.7] }, pole: { armR: [0, 0, 1] }, tw: { foreR: PRO } }),
      P(STAND, { root: { r: [-10, 0, 0] }, d: { armR: [-0.85, -0.5, -0.2], foreR: [-0.06, 1, 0.08], thighR: [-0.03, -1, 0.2], shinR: [0, -0.9, -0.45], footR: [0, -0.7, 0.7] }, tw: { foreR: PRO } }),
    ],
  },
  {
    id: 'jalon-neutro', name: 'Jalón al pecho, agarre neutro', cat: 'espalda', equip: 'Polea alta', compound: true,
    pdf: { day: 'Mar · Pull', sets: 3, reps: '6–8', rest: '2–3 min' },
    primary: ['dorsal'], secondary: ['biceps', 'braquial', 'trap_med', 'delt_post'],
    cues: ['Pecho arriba y muslos fijos bajo el soporte.', 'Lleva los codos hacia abajo y atrás.', 'Toca la parte alta del pecho y sube controlando.'],
    view: [-55, 8, 4.0],
    props: [{ fixed: 'stool', h: 0.46, z: 0 }, { fixed: 'tower', z: 0.62, h: 2.45, px: 0, pz: 0.12, py: 2.38 }, { fixed: 'block', p: [0, 0.74, 0.32], s: [0.46, 0.08, 0.12] }, { follow: 'cable', from: [0, 2.36, 0.12], handle: 'v' }],
    k: [
      P(SIT(0.46, 0.02), { root: { r: [-8, 0, 0] }, d: { armR: [0.2, 1, 0.12], foreR: [0.04, 1, 0.05] }, pole: { armR: [-1, 0, 0.3] }, tw: { foreR: NEU } }),
      P(SIT(0.46, 0.02), { root: { r: [-16, 0, 0] }, d: { armR: [-0.25, -0.9, -0.35], foreR: [0.32, 1, 0.12] }, tw: { foreR: NEU } }),
    ],
  },
  {
    id: 'remo-polea', name: 'Remo sentado en polea', cat: 'espalda', equip: 'Polea baja', compound: true,
    pdf: { day: 'Mar · Pull', sets: 3, reps: '8–10', rest: '2 min' },
    primary: ['dorsal', 'trap_med'], secondary: ['delt_post', 'biceps', 'braquiorrad', 'erectores'],
    cues: ['Espalda recta y pecho arriba.', 'Jala hacia el abdomen juntando los omóplatos.', 'Regresa estirando los brazos sin encorvarte.'],
    view: [-75, 12, 3.8],
    props: [{ fixed: 'stool', h: 0.36, z: -0.05 }, { fixed: 'block', p: [0, 0.18, 0.78], s: [0.5, 0.36, 0.06], r: [-20, 0, 0], mat: 'dark' }, { fixed: 'tower', z: 1.25, h: 1.4, py: 0.48 }, { follow: 'cable', from: [0, 0.48, 1.3], handle: 'v' }],
    k: [
      P(SIT(0.36, -0.05), { root: { r: [12, 0, 0] }, d: { thighR: [-0.14, 0.35, 1], shinR: [-0.04, -0.55, 0.85], footR: [0, 0.4, 1], armR: [0.1, -0.12, 1], foreR: [0.08, -0.12, 1] }, pole: { armR: [-1, 0, 0] }, tw: { foreR: NEU } }),
      P(SIT(0.36, -0.05), { root: { r: [-4, 0, 0] }, d: { thighR: [-0.14, 0.35, 1], shinR: [-0.04, -0.55, 0.85], footR: [0, 0.4, 1], armR: [-0.18, -0.65, -0.75], foreR: [0.18, -0.08, 1] }, tw: { foreR: NEU } }),
    ],
  },
  {
    id: 'remo-barra', name: 'Remo con barra', cat: 'espalda', equip: 'Barra', compound: true,
    primary: ['dorsal', 'trap_med'], secondary: ['delt_post', 'biceps', 'erectores', 'isquios'],
    cues: ['Inclina el torso ~45° con la espalda neutra.', 'Lleva la barra al abdomen bajo, codos hacia atrás.', 'Baja controlando sin redondear la espalda.'],
    view: [-70, 10, 3.6],
    plant: FEET,
    props: [{ follow: 'barbell' }],
    k: [
      P(STAND, { root: { r: [52, 0, 0] }, d: { armR: [-0.12, -1, 0.02], foreR: [-0.04, -1, 0.0], thighR: [-0.04, -1, 0.2], shinR: [-0.02, -1, -0.12] }, pole: { armR: [0, 0, 1] }, tw: { foreR: PRO } }),
      P(STAND, { root: { r: [52, 0, 0] }, d: { armR: [-0.28, 0.4, -0.85], foreR: [0.02, -1, 0.12], thighR: [-0.04, -1, 0.2], shinR: [-0.02, -1, -0.12] }, tw: { foreR: PRO } }),
    ],
  },
  {
    id: 'remo-mancuerna', name: 'Remo con mancuerna a una mano', cat: 'espalda', equip: 'Mancuerna y banco', side: 'R',
    pdf: { day: 'Vie · Torso', sets: 2, reps: '10', rest: '90 s' },
    primary: ['dorsal'], secondary: ['trap_med', 'delt_post', 'biceps'],
    cues: ['Mano y rodilla en el banco, espalda plana.', 'Lleva el codo hacia la cadera.', 'No gires el torso al subir.'],
    view: [-80, 12, 3.4],
    plant: ['heelR', 'toeR'],
    props: [{ fixed: 'bench', x: 0.12, z: 0.1, len: 1.2 }, { follow: 'dumbbell', s: 'R', kg: 1.4 }],
    k: [
      P({}, { root: { p: [0, 0.9, -0.1], r: [76, 0, 0] }, d: { armR: [-0.04, -1, 0.06], foreR: [0, -1, 0.04], armL: [0.06, -1, 0.05], foreL: [0.02, -1, 0.0], thighR: [-0.16, -1, -0.12], shinR: [-0.06, -1, 0.02], footR: FOOT, thighL: [0.04, -1, 0.06], shinL: [0, -0.06, -1], footL: [0, -0.8, -0.6] }, tw: { foreR: NEU, foreL: -NEU }, grip: { R: 1, L: 0 } }),
      P({}, { root: { p: [0, 0.9, -0.1], r: [76, 0, 0] }, d: { armR: [-0.12, 0.45, -0.9], foreR: [0.02, -1, 0.1], armL: [0.06, -1, 0.05], foreL: [0.02, -1, 0.0], thighR: [-0.16, -1, -0.12], shinR: [-0.06, -1, 0.02], footR: FOOT, thighL: [0.04, -1, 0.06], shinL: [0, -0.06, -1], footL: [0, -0.8, -0.6] }, tw: { foreR: NEU, foreL: -NEU }, grip: { R: 1, L: 0 } }),
    ],
  },
  {
    id: 'peso-muerto', name: 'Peso muerto convencional', cat: 'espalda', equip: 'Barra', compound: true,
    primary: ['gluteo', 'isquios', 'erectores'], secondary: ['cuadriceps', 'trap_sup', 'dorsal', 'flex_ante', 'aductores'],
    cues: ['Barra sobre el medio del pie, espalda neutra.', 'Empuja el suelo y extiende cadera y rodillas a la vez.', 'Barra pegada a las piernas en todo el recorrido.'],
    view: [-72, 8, 3.8],
    plant: FEET,
    props: [{ follow: 'barbell', plateR: 0.22 }],
    k: [
      P(STAND, { root: { r: [55, 0, 0] }, d: { armR: [-0.1, -1, 0.0], foreR: [-0.03, -1, 0.0], thighR: [-0.2, -0.55, 0.85], shinR: [-0.02, -0.92, -0.35] }, pole: { armR: [0, 0, 1] }, tw: { foreR: PRO } }),
      P(STAND, { root: { r: [-2, 0, 0] }, d: { armR: [-0.1, -1, 0.03], foreR: [-0.03, -1, 0.02] }, pole: { armR: [0, 0, 1] }, tw: { foreR: PRO } }),
    ],
  },

  // ======================= HOMBRO =======================
  {
    id: 'press-militar', name: 'Press militar con mancuernas', cat: 'hombro', equip: 'Mancuernas y banco', compound: true,
    pdf: { day: 'Lun · Push', sets: 3, reps: '8–10', rest: '2 min' },
    primary: ['delt_ant', 'delt_lat'], secondary: ['triceps', 'trap_sup', 'pecho_sup', 'serrato'],
    cues: ['Sentado con la espalda apoyada.', 'Sube las mancuernas sobre la cabeza.', 'Baja hasta la altura de las orejas sin arquear la espalda.'],
    view: [28, 10, 3.6],
    props: [{ fixed: 'seat', h: 0.46, z: 0, backAngle: 85, backLen: 0.8, backZ: -0.17 }, ...DB],
    k: [
      P(SIT(0.46, 0.02), { d: { armR: [-1, -0.08, 0.25], foreR: [-0.02, 1, 0.08] }, tw: { foreR: PRO } }),
      P(SIT(0.46, 0.02), { d: { armR: [-0.3, 1, 0.06], foreR: [0.1, 1, 0.0] }, pole: { armR: [0, 0, 1] }, tw: { foreR: PRO } }),
    ],
  },
  {
    id: 'elevaciones-laterales', name: 'Elevaciones laterales', cat: 'hombro', equip: 'Mancuernas',
    pdf: { day: 'Lun · Push / Vie · Torso', sets: 3, reps: '12–15', rest: '90 s' },
    primary: ['delt_lat'], secondary: ['delt_ant', 'trap_sup', 'serrato'],
    cues: ['Codos ligeramente flexionados.', 'Sube hasta la altura del hombro.', 'Baja en 3 s, sin balanceo.'],
    view: [10, 8, 3.6],
    plant: FEET,
    props: DB,
    k: [
      P(STAND, { d: { armR: [-0.25, -1, 0.08], foreR: [-0.3, -1, 0.25] }, pole: { armR: [0.2, 0, 1] } }),
      P(STAND, { d: { armR: [-1, 0.0, 0.1], foreR: [-1, 0.06, 0.32] }, pole: { armR: [0, -0.3, 1] } }),
    ],
  },
  {
    id: 'elevaciones-frontales', name: 'Elevaciones frontales', cat: 'hombro', equip: 'Mancuernas',
    primary: ['delt_ant'], secondary: ['pecho_sup', 'delt_lat', 'serrato'],
    cues: ['Brazos casi rectos, palmas hacia abajo.', 'Sube al frente hasta la altura de los ojos.', 'Baja despacio sin balancear el torso.'],
    view: [-60, 8, 3.6],
    plant: FEET,
    props: DB,
    k: [
      P(STAND, { d: { armR: [-0.06, -1, 0.15], foreR: [-0.02, -1, 0.25] }, pole: { armR: [1, 0, 0.3] }, tw: { foreR: PRO } }),
      P(STAND, { d: { armR: [-0.08, 0.12, 1], foreR: [-0.03, 0.15, 1] }, pole: { armR: [1, 0, 0] }, tw: { foreR: PRO } }),
    ],
  },
  {
    id: 'pec-deck-inverso', name: 'Pec deck inverso (deltoides posterior)', cat: 'hombro', equip: 'Máquina pec deck',
    pdf: { day: 'Mar · Pull / Vie · Torso', sets: 3, reps: '12–15', rest: '60–90 s' },
    primary: ['delt_post'], secondary: ['trap_med', 'manguito'],
    cues: ['Pecho apoyado en el pad, brazos al frente.', 'Abre con codos ligeramente flexionados hasta la altura de los hombros.', 'Regresa lento.'],
    view: [170, 30, 3.6],
    props: [{ fixed: 'pecdeck', reverse: true }, { follow: 'handles', z: 0.42 }],
    k: [
      P(SIT(0.48, -0.02), { d: { armR: [-0.3, 0.02, 1], foreR: [0.2, 0.02, 1] }, pole: { armR: [-1, 0, 0] }, tw: { foreR: PRO } }),
      P(SIT(0.48, -0.02), { d: { armR: [-1, 0.0, -0.15], foreR: [-0.95, 0.0, 0.3] }, pole: { armR: [0, -1, 0] }, tw: { foreR: PRO } }),
    ],
  },
  {
    id: 'face-pull', name: 'Face pull con cuerda', cat: 'hombro', equip: 'Polea a la altura de la cara',
    primary: ['delt_post', 'manguito'], secondary: ['trap_med', 'trap_sup', 'biceps'],
    cues: ['Polea a la altura de la cara, agarre con los pulgares hacia atrás.', 'Jala la cuerda hacia la frente separando las manos.', 'Codos altos, aprieta los omóplatos.'],
    view: [-130, 18, 3.6],
    plant: FEET,
    props: [{ fixed: 'tower', z: 1.2, h: 2.2, py: 1.58 }, { follow: 'cable', from: [0, 1.58, 1.25], handle: 'rope' }],
    k: [
      P(STAND, { root: { r: [-4, 0, 0] }, d: { armR: [-0.06, 0.18, 1], foreR: [0.06, 0.15, 1] }, pole: { armR: [-1, 0, 0] }, tw: { foreR: NEU } }),
      P(STAND, { root: { r: [-6, 0, 0] }, d: { armR: [-0.95, 0.22, -0.15], foreR: [0.0, 0.65, 0.75] }, tw: { foreR: NEU } }),
    ],
  },
  {
    id: 'encogimientos', name: 'Encogimientos de hombros', cat: 'hombro', equip: 'Mancuernas',
    pdf: { day: 'Mar · Pull', sets: 3, reps: '10–12', rest: '90 s' },
    primary: ['trap_sup'], secondary: ['trap_med', 'flex_ante'],
    cues: ['Mancuernas a los lados, brazos rectos.', 'Sube los hombros hacia las orejas.', 'Pausa 1 s y baja lento, sin rotar.'],
    view: [160, 6, 3.4],
    plant: FEET,
    props: DB.map((d) => ({ ...d, kg: 1.6 })),
    k: [
      P(STAND, { d: { armR: [-0.1, -1, 0.0], foreR: [-0.04, -1, 0.04], clavR: [-0.99, -0.22, -0.04] } }),
      P(STAND, { d: { armR: [-0.1, -1, 0.0], foreR: [-0.04, -1, 0.04], clavR: [-0.93, 0.36, -0.06] } }),
    ],
  },

  // ======================= BRAZOS =======================
  {
    id: 'curl-barra', name: 'Curl de bíceps con barra', cat: 'brazos', equip: 'Barra',
    pdf: { day: 'Vie · Torso', sets: 2, reps: '10–12', rest: '90 s' },
    primary: ['biceps', 'braquial'], secondary: ['braquiorrad', 'flex_ante', 'delt_ant'],
    cues: ['De pie, codos pegados al costado.', 'Sube la barra sin balancear el torso.', 'Baja controlado en 3 s hasta casi extender.'],
    view: [-35, 8],
    plant: FEET,
    props: [{ follow: 'barbell', len: 1.3, plates: 1, plateR: 0.15 }],
    k: [
      P(STAND, { d: { armR: [-0.1, -1, 0.02], foreR: [-0.04, -1, 0.14] }, pole: { armR: [0, 0, 1] }, tw: { foreR: SUP } }),
      P(STAND, { d: { armR: [-0.1, -1, 0.14], foreR: [-0.03, 0.8, 0.6] }, tw: { foreR: SUP } }),
    ],
  },
  {
    id: 'curl-martillo', name: 'Curl martillo', cat: 'brazos', equip: 'Mancuernas',
    pdf: { day: 'Mar · Pull', sets: 2, reps: '10–12', rest: '60–90 s' },
    primary: ['braquiorrad', 'braquial'], secondary: ['biceps', 'ext_ante'],
    cues: ['Palmas mirándose (agarre neutro).', 'Codos fijos a los costados.', 'Sube y baja sin balancear.'],
    view: [-40, 8],
    plant: FEET,
    props: DB,
    k: [
      P(STAND, { d: { armR: [-0.12, -1, 0.0], foreR: [-0.06, -1, 0.12] }, pole: { armR: [0, 0, 1] }, tw: { foreR: NEU } }),
      P(STAND, { d: { armR: [-0.12, -1, 0.12], foreR: [-0.06, 0.8, 0.6] }, tw: { foreR: NEU } }),
    ],
  },
  {
    id: 'curl-predicador', name: 'Curl predicador', cat: 'brazos', equip: 'Banco predicador y barra Z',
    pdf: { day: 'Mar · Pull', sets: 3, reps: '10–12', rest: '90 s' },
    primary: ['biceps', 'braquial'], secondary: ['braquiorrad', 'flex_ante'],
    cues: ['Brazos apoyados en el pad.', 'Sube sin despegar los codos.', 'Baja lento hasta casi extender.'],
    view: [-70, 12, 3.2],
    props: [{ fixed: 'preacher', y: 1.0, z: 0.3, angle: 42, seatH: 0.52, seatZ: -0.02 }, { follow: 'barbell', len: 1.2, plates: 1, plateR: 0.14 }],
    k: [
      P(SIT(0.52, -0.02), { root: { r: [10, 0, 0] }, d: { armR: [-0.08, -0.7, 0.75], foreR: [-0.02, -0.75, 0.6] }, pole: { armR: [0, 0.7, 0.7] }, tw: { foreR: SUP } }),
      P(SIT(0.52, -0.02), { root: { r: [10, 0, 0] }, d: { armR: [-0.08, -0.7, 0.75], foreR: [-0.02, 0.85, 0.5] }, tw: { foreR: SUP } }),
    ],
  },
  {
    id: 'extension-triceps-polea', name: 'Extensión de tríceps en polea', cat: 'brazos', equip: 'Polea alta y cuerda',
    pdf: { day: 'Lun · Push', sets: 3, reps: '10–12', rest: '90 s' },
    primary: ['triceps'], secondary: ['ext_ante'],
    cues: ['Codos pegados a las costillas.', 'Solo se mueven los antebrazos.', 'Extiende y aprieta abajo; sube en 3 s.'],
    view: [-75, 10, 3.6],
    plant: FEET,
    props: [{ fixed: 'tower', z: 0.55, h: 2.3, py: 2.12 }, { follow: 'cable', from: [0, 2.12, 0.6], handle: 'rope' }],
    k: [
      P(STAND, { root: { r: [8, 0, 0] }, d: { armR: [-0.06, -1, 0.1], foreR: [0.1, 0.45, 0.9] }, tw: { foreR: NEU } }),
      P(STAND, { root: { r: [8, 0, 0] }, d: { armR: [-0.06, -1, 0.06], foreR: [-0.12, -1, 0.15] }, pole: { armR: [0, 0, 1] }, tw: { foreR: NEU } }),
    ],
  },
  {
    id: 'extension-triceps-cabeza', name: 'Extensión de tríceps sobre la cabeza', cat: 'brazos', equip: 'Mancuerna',
    pdf: { day: 'Vie · Torso', sets: 3, reps: '10–12', rest: '90 s' },
    primary: ['triceps'], secondary: ['delt_post', 'abdomen'],
    cues: ['Codos apuntando al techo y cerca de la cabeza.', 'Baja la mancuerna detrás de la cabeza.', 'Extiende por completo arriba.'],
    view: [-70, 10, 3.6],
    plant: FEET,
    props: [{ follow: 'dumbbell', s: 'R', kg: 1.6 }],
    k: [
      P(STAND, { d: { armR: [0.12, 1, 0.05], foreR: [0.35, -0.75, -0.55] }, tw: { foreR: NEU } }),
      P(STAND, { d: { armR: [0.12, 1, 0.08], foreR: [0.2, 1, 0.0] }, pole: { armR: [0, 0, -1] }, tw: { foreR: NEU } }),
    ],
  },
  {
    id: 'press-frances', name: 'Press francés', cat: 'brazos', equip: 'Barra Z y banco plano',
    primary: ['triceps'], secondary: ['ext_ante'],
    cues: ['Tumbado, brazos verticales con agarre estrecho.', 'Flexiona los codos y baja la barra hacia la frente.', 'Extiende sin abrir los codos.'],
    view: [-70, 16, 3.4],
    props: [{ fixed: 'bench', z: -0.05 }, { follow: 'barbell', len: 1.2, plates: 1, plateR: 0.14 }],
    k: [
      P(SUPINE_BENCH, { d: { armR: [-0.08, 1, -0.3], foreR: [0.02, -0.35, -1] }, tw: { foreR: PRO } }),
      P(SUPINE_BENCH, { d: { armR: [-0.08, 1, -0.2], foreR: [0.05, 1, -0.05] }, pole: { armR: [0, 0, -1] }, tw: { foreR: PRO } }),
    ],
  },
  {
    id: 'curl-muneca', name: 'Curl de muñeca', cat: 'brazos', equip: 'Mancuernas',
    pdf: { day: 'Vie · Torso', sets: 2, reps: '15', rest: '60 s' },
    primary: ['flex_ante'], secondary: ['braquiorrad'],
    cues: ['Antebrazos apoyados en las piernas, palmas arriba.', 'Deja caer la mancuerna hacia los dedos.', 'Sube flexionando solo la muñeca.'],
    view: [-75, 20, 2.8],
    props: [{ fixed: 'stool', h: 0.46, z: 0 }, ...DB],
    k: [
      P(SIT(0.46, 0.02), { root: { r: [28, 0, 0] }, d: { armR: [0.0, -0.8, 0.6], foreR: [0.02, -0.12, 1], handR: [0, -0.85, 0.55] }, pole: { armR: [0, 0.6, 0.8] }, tw: { foreR: SUP } }),
      P(SIT(0.46, 0.02), { root: { r: [28, 0, 0] }, d: { armR: [0.0, -0.8, 0.6], foreR: [0.02, -0.12, 1], handR: [0, 0.65, 0.75] }, tw: { foreR: SUP } }),
    ],
  },

  // ======================= PIERNAS =======================
  {
    id: 'sentadilla', name: 'Sentadilla libre con barra', cat: 'piernas', equip: 'Barra', compound: true,
    pdf: { day: 'Mié · Legs A', sets: 3, reps: '6–8', rest: '3–4 min' },
    primary: ['cuadriceps', 'gluteo'], secondary: ['aductores', 'erectores', 'isquios', 'soleo'],
    cues: ['Pies al ancho de hombros, pecho arriba.', 'Rodillas siguiendo la punta de los pies.', 'Baja controlando 2 s hasta muslos paralelos y sube.'],
    view: [-55, 8, 4.0],
    plant: FEET,
    props: [{ follow: 'barbell', offset: [0, 0.02, -0.03] }],
    k: [
      P(STAND, { rel: true, root: { r: [38, 0, 0] }, d: { armR: [-0.6, -0.75, -0.32], foreR: [-0.15, 0.5, -0.6], thighR: [-0.3, -0.12, 1], shinR: [-0.08, -0.88, -0.45], footR: [-0.2, -0.3, 1] }, pole: { armR: [0, 1, 0] }, tw: { foreR: PRO } }),
      P(STAND, { rel: true, root: { r: [4, 0, 0] }, d: { armR: [-0.6, -0.75, -0.32], foreR: [-0.15, 0.5, -0.6], thighR: [-0.06, -1, 0.02], shinR: [-0.04, -1, -0.02], footR: [-0.2, -0.3, 1] }, pole: { armR: [0, 1, 0] }, tw: { foreR: PRO } }),
    ],
  },
  {
    id: 'prensa', name: 'Prensa de piernas 45°', cat: 'piernas', equip: 'Máquina de prensa', compound: true,
    pdf: { day: 'Mié · Legs A', sets: 2, reps: '8–10', rest: '2 min' },
    primary: ['cuadriceps', 'gluteo'], secondary: ['aductores', 'isquios'],
    cues: ['Pies al ancho de hombros en la plataforma.', 'Baja hasta ~90° de rodilla sin despegar la cadera.', 'Empuja sin bloquear las rodillas.'],
    view: [-80, 12, 4.2],
    props: [{ fixed: 'legpress' }, { follow: 'platform', normal: [0, -0.62, -0.78] }],
    k: [
      P({}, { root: { p: [0, 0.56, -0.12], r: [-52, 0, 0] }, d: { thighR: [-0.25, 0.85, 0.48], shinR: [-0.05, -0.3, 1], footR: [-0.1, 0.9, -0.45], armR: [-0.3, -0.85, 0.4], foreR: [-0.15, -0.3, 1] }, grip: 1 }),
      P({}, { root: { p: [0, 0.56, -0.12], r: [-52, 0, 0] }, d: { thighR: [-0.17, 0.58, 0.8], shinR: [-0.08, 0.6, 0.8], footR: [-0.1, 0.82, -0.58], armR: [-0.3, -0.85, 0.4], foreR: [-0.15, -0.3, 1] }, grip: 1 }),
    ],
  },
  {
    id: 'zancadas', name: 'Zancadas con mancuernas', cat: 'piernas', equip: 'Mancuernas', compound: true,
    primary: ['cuadriceps', 'gluteo'], secondary: ['isquios', 'aductores', 'gluteo_med', 'soleo'],
    cues: ['Da un paso largo al frente con el torso erguido.', 'Baja hasta que la rodilla de atrás casi toque el suelo.', 'Empuja con el talón de adelante para subir.'],
    view: [-82, 6, 4.0],
    plant: ['heelR', 'toeR', 'toeL'],
    props: DB,
    k: [
      P(STAND, { d: { thighR: [-0.05, -0.05, 1], shinR: [-0.02, -1, -0.02], footR: FOOT, thighL: [0.05, -0.95, -0.3], shinL: [0.02, -0.25, -1], footL: [0, -0.92, 0.4] }, tw: { foreR: NEU } }),
      P(STAND, { d: { thighR: [-0.05, -0.92, 0.38], shinR: [-0.02, -1, -0.04], footR: FOOT, thighL: [0.05, -0.93, -0.37], shinL: [0.02, -0.9, -0.42], footL: [0, -0.7, 0.72] }, tw: { foreR: NEU } }),
    ],
  },
  {
    id: 'peso-muerto-rumano', name: 'Peso muerto rumano', cat: 'piernas', equip: 'Barra', compound: true,
    pdf: { day: 'Sáb · Legs B', sets: 3, reps: '6–8', rest: '2–3 min' },
    primary: ['isquios', 'gluteo'], secondary: ['erectores', 'aductores', 'flex_ante', 'trap_sup'],
    cues: ['Rodillas casi estiradas, cadera hacia atrás.', 'Espalda neutra y barra pegada a las piernas.', 'Baja 2 s hasta sentir el estiramiento femoral y sube apretando glúteos.'],
    view: [-78, 8, 3.8],
    plant: FEET,
    props: [{ follow: 'barbell' }],
    k: [
      P(STAND, { root: { r: [72, 0, 0] }, d: { armR: [-0.1, -1, 0.0], foreR: [-0.04, -1, 0.0], thighR: [-0.04, -1, 0.2], shinR: [-0.02, -1, -0.04] }, pole: { armR: [0, 0, 1] }, tw: { foreR: PRO } }),
      P(STAND, { root: { r: [-2, 0, 0] }, d: { armR: [-0.1, -1, 0.04], foreR: [-0.03, -1, 0.02] }, pole: { armR: [0, 0, 1] }, tw: { foreR: PRO } }),
    ],
  },
  {
    id: 'hip-thrust', name: 'Hip thrust con barra', cat: 'piernas', equip: 'Barra y banco', compound: true,
    pdf: { day: 'Sáb · Legs B', sets: 3, reps: '8–10', rest: '2 min' },
    primary: ['gluteo'], secondary: ['isquios', 'gluteo_med', 'cuadriceps', 'erectores'],
    cues: ['Omóplatos apoyados en el banco.', 'Empuja con los talones y sube la cadera.', 'Aprieta glúteos arriba sin arquear la zona lumbar.'],
    view: [-85, 10, 3.6],
    pin: { pt: 'backTop', at: [null, 0.44, -0.28] },
    props: [{ fixed: 'crossbench', h: 0.42, z: -0.3 }, { follow: 'barbell', plateR: 0.22, offset: [0, 0.03, 0] }],
    k: [
      P({}, { root: { p: [0, 0.3, 0.1], r: [-62, 0, 0] }, d: { thighR: [-0.12, 0.5, 0.86], shinR: [-0.04, -0.98, -0.18], footR: FOOT, armR: [-0.2, -0.3, 1], foreR: [0.1, 0.05, 1] }, pole: { armR: [-1, 0, 0] }, tw: { foreR: PRO } }),
      P({}, { root: { p: [0, 0.3, 0.1], r: [-92, 0, 0] }, d: { thighR: [-0.12, -0.02, 1], shinR: [-0.04, -1, -0.04], footR: FOOT, armR: [-0.2, -0.05, 1], foreR: [0.1, 0.3, 1] }, pole: { armR: [-1, 0, 0] }, tw: { foreR: PRO } }),
    ],
  },
  {
    id: 'extension-cuadriceps', name: 'Extensión de cuádriceps', cat: 'piernas', equip: 'Máquina de extensión',
    pdf: { day: 'Mié · Legs A', sets: 3, reps: '10–12', rest: '90 s' },
    primary: ['cuadriceps'], secondary: ['flex_cadera'],
    cues: ['Espalda pegada al respaldo.', 'Extiende las piernas y aprieta arriba.', 'Baja en 3 s.'],
    view: [-85, 10, 3.4],
    props: [{ fixed: 'legmachine' }, { follow: 'roller', pivot: [0.33, 0.5, 0.3], offset: [0, 0, 0.065] }],
    k: [
      P(SIT(0.5, -0.02), { d: { thighR: [-0.1, 0.0, 1], shinR: [-0.02, -1, -0.15], footR: [0, -0.2, 1], armR: [-0.3, -1, 0.05], foreR: [-0.05, -1, 0.3] } }),
      P(SIT(0.5, -0.02), { d: { thighR: [-0.1, 0.05, 1], shinR: [-0.02, 0.1, 1], footR: [0, 1, 0.3], armR: [-0.3, -1, 0.05], foreR: [-0.05, -1, 0.3] } }),
    ],
  },
  {
    id: 'curl-femoral', name: 'Curl femoral sentado', cat: 'piernas', equip: 'Máquina de curl femoral',
    pdf: { day: 'Sáb · Legs B', sets: 3, reps: '10–12', rest: '90 s' },
    primary: ['isquios'], secondary: ['gemelos'],
    cues: ['Espalda pegada y el rodillo superior sobre los muslos.', 'Flexiona llevando los talones abajo y atrás.', 'Regresa lento.'],
    view: [-85, 10, 3.4],
    props: [{ fixed: 'legmachine' }, { fixed: 'block', p: [0, 0.72, 0.28], s: [0.46, 0.08, 0.14] }, { follow: 'roller', pivot: [0.33, 0.5, 0.3], offset: [0, 0, -0.065] }],
    k: [
      P(SIT(0.5, -0.02), { d: { thighR: [-0.1, 0.03, 1], shinR: [-0.02, 0.05, 1], footR: [0, 1, 0.3], armR: [-0.3, -1, 0.05], foreR: [-0.05, -1, 0.3] } }),
      P(SIT(0.5, -0.02), { d: { thighR: [-0.1, 0.03, 1], shinR: [-0.02, -0.9, -0.42], footR: [0, -0.3, 1], armR: [-0.3, -1, 0.05], foreR: [-0.05, -1, 0.3] } }),
    ],
  },
  {
    id: 'pantorrilla-pie', name: 'Elevación de talones de pie', cat: 'piernas', equip: 'Escalón o máquina',
    pdf: { day: 'Mié · Legs A', sets: 3, reps: '12–15', rest: '60 s' },
    primary: ['gemelos', 'soleo'], secondary: ['tibial'],
    cues: ['Punta de los pies en el borde del escalón.', 'Baja el talón para estirar bien.', 'Sube lo más alto posible y pausa arriba.'],
    view: [-75, 4, 3.0],
    plant: ['toeR', 'toeL'], plantY: 0.12,
    props: [{ fixed: 'step', h: 0.12, z: 0.14 }, ...DB],
    k: [
      P(STAND, { d: { footR: [-0.06, 0.32, 1] } }),
      P(STAND, { d: { footR: [-0.06, -0.85, 0.6] } }),
    ],
  },

  // ======================= CORE =======================
  {
    id: 'crunch-polea', name: 'Crunch en polea de rodillas', cat: 'core', equip: 'Polea alta y cuerda',
    pdf: { day: 'Mié · Legs A', sets: 3, reps: '12–15', rest: '60 s' },
    primary: ['abdomen'], secondary: ['oblicuos', 'serrato'],
    cues: ['De rodillas, cuerda junto a la cabeza.', 'Enrolla el torso llevando las costillas hacia la cadera.', 'No jales con los brazos.'],
    view: [-85, 10, 3.6],
    plant: ['kneeR', 'kneeL', 'toeR', 'toeL'], plantY: 0.03,
    props: [{ fixed: 'mat', z: -0.1 }, { fixed: 'tower', z: 0.85, h: 2.3, py: 2.1 }, { follow: 'cable', from: [0, 2.1, 0.9], handle: 'rope' }],
    k: [
      P({}, { rel: true, root: { p: [0, 0.75, 0], r: [12, 0, 0] }, d: { spineU: [0, 1, 0.12], thighR: [-0.1, -1, 0.15], shinR: [0, -0.05, -1], footR: [0, -0.6, -0.8], armR: [-0.35, 0.1, 1], foreR: [0.3, 0.9, -0.2] }, tw: { foreR: NEU } }),
      P({}, { rel: true, root: { p: [0, 0.75, 0], r: [26, 0, 0] }, d: { spineU: [0, 0.1, 1], neck: [0, -0.2, 1], thighR: [-0.1, -1, 0.15], shinR: [0, -0.05, -1], footR: [0, -0.6, -0.8], armR: [-0.35, 0.1, 1], foreR: [0.3, 0.9, -0.2] }, tw: { foreR: NEU } }),
    ],
  },
  {
    id: 'plancha', name: 'Plancha', cat: 'core', equip: 'Peso corporal', iso: true,
    pdf: { day: 'Vie · Torso', sets: 3, reps: '30–40 s', rest: '60 s' },
    primary: ['abdomen', 'oblicuos'], secondary: ['gluteo', 'delt_ant', 'serrato', 'cuadriceps'],
    cues: ['Antebrazos apoyados bajo los hombros.', 'Cuerpo en línea recta de cabeza a talones.', 'Aprieta abdomen y glúteos; no dejes caer la cadera.'],
    view: [-75, 14, 3.6],
    props: [{ fixed: 'mat', z: 0.15 }],
    plant: ['elbowR', 'elbowL', 'toeR', 'toeL'],
    k: [
      P({}, { root: { p: [0, 0.4, -0.3], r: [80, 0, 0] }, d: { armR: [-0.05, -1, 0.0], foreR: [0.12, -0.05, 1], handR: [0.1, -0.1, 1], thighR: [-0.03, -0.17, -1], shinR: [-0.02, -0.17, -1], footR: [0, -1, 0.18] }, tw: { foreR: 0 }, grip: 0.5 }),
      P({}, { root: { p: [0, 0.4, -0.3], r: [79, 0, 0] }, d: { armR: [-0.05, -1, 0.0], foreR: [0.12, -0.05, 1], handR: [0.1, -0.1, 1], thighR: [-0.03, -0.19, -1], shinR: [-0.02, -0.19, -1], footR: [0, -1, 0.2] }, tw: { foreR: 0 }, grip: 0.5 }),
    ],
  },
  {
    id: 'elevaciones-piernas', name: 'Elevaciones de piernas tumbado', cat: 'core', equip: 'Colchoneta',
    pdf: { day: 'Sáb · Legs B', sets: 3, reps: '12–15', rest: '60 s' },
    primary: ['flex_cadera', 'abdomen'], secondary: ['oblicuos', 'cuadriceps'],
    cues: ['Zona lumbar pegada al suelo.', 'Sube las piernas casi rectas hasta la vertical.', 'Baja sin tocar el piso.'],
    view: [-80, 14, 3.8],
    props: [{ fixed: 'mat', z: 0.0 }],
    plant: ['sacrum', 'backTop'], plantY: 0.03,
    k: [
      P({}, { root: { p: [0, 0.1, 0.1], r: [-90, 0, 0] }, d: { thighR: [-0.04, 0.12, 1], shinR: [-0.03, 0.12, 1], footR: [0, 0.3, 1], armR: [-0.18, -0.1, 1], foreR: [-0.08, -0.08, 1] }, pole: { armR: [0, -1, 0] }, tw: { foreR: PRO }, grip: 0 }),
      P({}, { root: { p: [0, 0.1, 0.1], r: [-90, 0, 0] }, d: { thighR: [-0.04, 1, 0.12], shinR: [-0.03, 1, 0.08], footR: [0, 0.4, -1], armR: [-0.18, -0.1, 1], foreR: [-0.08, -0.08, 1] }, pole: { armR: [0, -1, 0] }, tw: { foreR: PRO }, grip: 0 }),
    ],
  },
  {
    id: 'crunch', name: 'Crunch abdominal', cat: 'core', equip: 'Colchoneta',
    primary: ['abdomen'], secondary: ['oblicuos'],
    cues: ['Rodillas flexionadas y pies apoyados.', 'Despega los omóplatos del suelo enrollando el tronco.', 'Baja despacio sin jalar el cuello.'],
    view: [-80, 14, 3.6],
    props: [{ fixed: 'mat', z: 0.0 }],
    plant: ['sacrum', 'heelR', 'heelL'], plantY: 0.03,
    k: [
      P({}, { rel: true, root: { p: [0, 0.1, 0.1], r: [-90, 0, 0] }, d: { thighR: [-0.12, 0.8, 0.6], shinR: [-0.04, -0.8, 0.6], footR: FOOT, armR: [0.35, -0.3, 0.5], foreR: [0.7, 0.65, 0.05] }, tw: { foreR: NEU }, grip: 0 }),
      P({}, { rel: true, root: { p: [0, 0.1, 0.1], r: [-90, 0, 0] }, d: { spineU: [0, 0.6, -0.8], neck: [0, 0.75, -0.65], thighR: [-0.12, 0.8, 0.6], shinR: [-0.04, -0.8, 0.6], footR: FOOT, armR: [0.35, -0.3, 0.5], foreR: [0.7, 0.65, 0.05] }, tw: { foreR: NEU }, grip: 0 }),
    ],
  },
];
