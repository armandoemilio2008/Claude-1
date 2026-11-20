# Licencia de los modelos 3D

Los archivos `male_anatomy_mobile.glb`, `female_anatomy_mobile.glb` y `muscles.json`
provienen del paquete npm [`ecorche-body`](https://github.com/AygunAlpKagan/ecorche-body) v0.3.2
y se usan sin modificar el archivo. La app cambia en tiempo de ejecución los colores de los
vértices y la pose del esqueleto.

- Cuerpo, malla y pesos del esqueleto: **MakeHuman** (CC0 1.0).
- Mapa muscular por vértice (`_MUSCLE`, `muscles.json`): derivado de **Z-Anatomy / BodyParts3D**,
  licenciado bajo **Creative Commons Attribución-CompartirIgual 4.0 (CC BY-SA 4.0)**:
  https://creativecommons.org/licenses/by-sa/4.0/

Si redistribuyes estos modelos o un mapa muscular derivado, mantén la licencia CC BY-SA 4.0 y
esta atribución:

> Anatomía muscular: Z-Anatomy / BodyParts3D, CC BY-SA 4.0. Cuerpo: MakeHuman, CC0.

Nota: en este mapa las etiquetas de las porciones ascendente y descendente del trapecio
(ids 203/204 y 206/207) están invertidas respecto a su posición real; `js/muscles.js` usa
los ids según su posición en la malla.
