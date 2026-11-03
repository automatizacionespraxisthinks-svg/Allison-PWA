# Pausas por signos en el servicio de voz

Especificación de los cambios en el servicio de voz de Praxis
(`tts-api.praxisia.org`, Kokoro-82M) para que las explicaciones mixtas de
Allison (español con palabras en inglés) suenen naturales. Elegido de oído
por el usuario el 2 de noviembre de 2026 (variante «A2»).

## El problema, medido

La app manda cada respuesta mixta en una sola petición, con un segmento por
idioma (`POST /v1/tts` con `segments`, `voice: af_heart`, `stream: true`):

```
[es] Como fue ayer, se dice | [en] 'played', | [es] con | [en] 'ed' | [es] al final. | [en] You played soccer! Who did you play with?
```

Silencios medidos en el audio que devuelve el servicio (WAV, voz `af_heart`, velocidad 0,9):

| Dónde | Signo | Silencio |
|---|---|---|
| «ayer, se dice» | coma | 140 ms (bien) |
| «se dice · played» | ninguno, cambio de idioma | 250 ms |
| «played, · con» | coma + cambio | 500 ms |
| «con · ed» | ninguno, cambio | 460 ms |
| «ed · al final» | ninguno, cambio | 390 ms |
| «al final. · You» | punto + cambio | 690 ms |

En español, entre oraciones, casi no hay pausa: tras «¡Muy bien!» quedaron
60 ms. En inglés el servicio sí respeta los signos (unos 300 ms en
`.`/`!`/`?` y 130 ms en comas).

El silencio de más sale de cada segmento: el servicio genera cada uno por
separado, con silencio al principio y al final, y los pega tal cual. Cuanto
más corto el segmento («con», «'ed'»), más se nota.

**Por qué no se arregla desde la app.** La app lo probó pidiendo cada
pedazo por separado, recortando y uniendo. Suena bien, pero como el servicio
genera más o menos a velocidad real y la app tiene que esperar cada pedazo,
la explicación tendría que empezar entre 4 y 9 segundos después (hoy empieza
a los 2 o 3 segundos), o sonar con cortes. Además, la velocidad distinta
por idioma necesita un `speed` por segmento, que hoy no existe.

## Los cambios pedidos

### 1. `speed` por segmento

`TTSSegment` acepta `speed` (opcional). Sin él, el segmento usa el `speed`
de la petición, como hoy.

### 2. Unir los segmentos por sus signos

Con `"pausas": "signos"` en la petición (opcional, para no cambiar nada a
los demás clientes):

1. A cada segmento generado se le recorta el silencio del principio y del
   final (umbral ~400 sobre 32768 en PCM de 16 bits; dejar 15 ms de margen).
2. Entre un segmento y el siguiente va una pausa según cómo termina el
   primero:

| El segmento termina en | Pausa |
|---|---|
| `.` `!` `?` `…` (con o sin comilla de cierre) | 420 ms |
| `,` `;` `:` | 200 ms |
| Sin signo | 60 ms |

3. **Comillas.** Si el segmento anterior o el siguiente va entre comillas
   (empieza con `'` `"` `“` `‘` `«` o termina con su cierre), la pausa es
   de al menos 160 ms: la cita se oye aparte, como la dice un profesor. Las
   comillas no se pronuncian.
4. **Oraciones en español.** Dentro de un segmento `es`, cada oración (corte
   tras `.` `!` `?` `…` seguido de espacio) se genera aparte y se une con
   420 ms. Ojo con «p. ej.», «Sr.», horas («6:30») y números («3.5»): no
   son fin de oración.
5. **Apóstrofos.** Un `'` entre dos letras («don't», «I'm») es parte de la
   palabra, no una comilla: no se quita ni cuenta como cita.

### 3. Seguir en streaming

Cada segmento, ya recortado y con su pausa, se emite en cuanto está listo,
en orden. La primera parte no debe tardar más que hoy.

## Los valores que usará la app

Elegidos de oído (variante A2):

- Toda la respuesta mixta con la voz de Allison, `af_heart` (también el
  español; con `ef_dora` para el español se distinguían menos).
- Velocidad: el inglés, la del nivel (A1 0,7 · A2 0,8 · B1 y B2 0,9 · C1 y C2 1; «lento»
  A1 0,6 · desde A2 0,7). El español, un poco más ágil: la del nivel +
  0,15, hasta 1.

Ejemplo de petición:

```json
{
  "voice": "af_heart",
  "format": "mp3",
  "stream": true,
  "pausas": "signos",
  "segments": [
    { "text": "Como fue ayer, se dice", "lang": "es", "speed": 0.85 },
    { "text": "'played',", "lang": "en-US", "speed": 0.7 },
    { "text": "con", "lang": "es", "speed": 0.85 },
    { "text": "'ed'", "lang": "en-US", "speed": 0.7 },
    { "text": "al final.", "lang": "es", "speed": 0.85 },
    { "text": "You played soccer! Who did you play with?", "lang": "en-US", "speed": 0.7 }
  ]
}
```

Cuando el servicio lo tenga, en la app solo cambia `src/lib/tts.ts`: mandar
`speed` en cada segmento y `"pausas": "signos"` cuando hay los dos idiomas.
La puntuación del texto ya la cuida la app: los signos de apertura del
español (`conSignosDeApertura` en `src/lib/habla.ts`) y las comillas en la
palabra en inglés que se explica.

## Prueba de aceptación

Pedir en WAV estas cuatro explicaciones y medir los silencios internos (más
de 60 ms):

1. `[es] Como fue ayer, se dice 'played', con 'ed' al final. [en-US] You played soccer! Who did you play with?`
2. `[es] ¡Muy bien! 'People' es plural, por eso va con 'are', no con 'is'. [en-US] The people in your city are very happy! What do you like there?`
3. `[es] Para la edad se usa 'to be', no 'to have'. ¿Ves la diferencia? [en-US] You are fifteen years old! What do you like to do?`
4. `[es] Con 'she', en presente el verbo lleva 's': 'cooks'. [en-US] Your mom cooks very well! What is her best dish?`

Se cumple si:

- ningún silencio sin signo pasa de 120 ms (hoy, hasta 460 ms);
- cada `,` `;` `:` deja entre 150 y 300 ms;
- cada `.` `!` `?` deja entre 350 y 550 ms, también en español (hoy, 60 ms
  tras «¡Muy bien!»);
- lo citado tiene al menos 140 ms antes y después;
- la primera parte del audio llega en el mismo tiempo que hoy (2-3 s sin
  caché);
- sin `"pausas": "signos"`, el audio sale idéntico al de hoy.

Las muestras «antes» y «A2» con las que se eligió están en la carpeta local
`.muestras-voz` del equipo de desarrollo (no van al repositorio).
