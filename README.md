# Anatomía en Movimiento

Visor 3D en el navegador: un modelo anatómico con sus músculos reales ejecuta ejercicios de
gimnasio en bucle y resalta en **rojo** los músculos principales y en **naranja** los secundarios.
Incluye los ejercicios de la rutina *PPL + Torso + Legs* (marcados con su día, series, reps y
descanso) y otros ejercicios comunes de gimnasio.

## Cómo abrirlo

Es una página estática sin compilación. Los módulos JavaScript y el modelo `.glb` necesitan
un servidor local (no funciona abriendo el archivo con doble clic):

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

## Qué hace

- 37 ejercicios en 6 grupos: pecho, espalda, hombro, brazos, piernas y core.
  Filtro **Mi rutina** para ver solo los de la rutina en PDF.
- Cada ejercicio tiene una pose de INICIO (músculo estirado) y una de FINAL (músculo contraído).
  La animación sigue el tempo de la rutina: subida ~1 s, pausa, bajada 2–3 s.
- La intensidad del color sube durante la fase concéntrica.
- Pasa el cursor o toca un músculo de la ficha para aislarlo en el modelo.
- Vistas Frente / Lado / Espalda, velocidad 0,5× a 2× y modelo de hombre o mujer.
- Atajos: espacio = pausa; flechas arriba/abajo = ejercicio anterior/siguiente.

## Estructura

| Archivo | Contenido |
| --- | --- |
| `js/rig.js` | Resuelve poses a partir de direcciones de cada segmento (brazo, antebrazo, muslo…), con control del giro del codo/rodilla, interpolación y apoyo de pies/manos. |
| `js/muscles.js` | Grupos musculares (ids del modelo), nombres en español y latín, resaltado en el shader. |
| `js/exercises.js` | La biblioteca de ejercicios: músculos, consejos, equipo y poses clave. |
| `js/props.js` | Equipo de gimnasio con primitivas (barra, mancuernas, bancos, poleas, máquinas). |
| `js/main.js` | Escena three.js, cámara, bucle de animación e interfaz. |
| `vendor/three/` | three.js r170 (MIT), incluido para funcionar sin conexión. |
| `models/` | Modelos anatómicos (ver `models/LICENSE-models.md`). |

Para añadir un ejercicio, copia una entrada de `js/exercises.js` y ajusta sus dos poses.
Parámetros de depuración: `?ex=<id>&t=0` (o `t=1`) congela la pose de inicio o final.

## Créditos

- Anatomía muscular: [Z-Anatomy](https://www.z-anatomy.com/) / [BodyParts3D](https://lifesciencedb.jp/bp3d/) — CC BY-SA 4.0.
- Cuerpo y esqueleto: MakeHuman — CC0.
- Modelos empaquetados por [ecorche-body](https://github.com/AygunAlpKagan/ecorche-body).
- Render: [three.js](https://threejs.org/) — MIT.

Las animaciones son esquemáticas y no sustituyen la guía de un entrenador.
