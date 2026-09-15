/**
 * Entrar con Google (src/lib/google.ts), sin red ni base.
 *
 * Lo que se prueba es lo que, si falla, crea cuentas sin autorización o
 * deja el botón inservible:
 *   · sin las DOS llaves el botón no existe;
 *   · la cookie de consentimiento solo la puede fabricar la aplicación:
 *     cambiar el nivel, la fecha o la versión legal la invalida, y otro
 *     secreto también;
 *   · vence a los diez minutos y no vale desde el futuro;
 *   · un consentimiento de OTRA versión de los documentos no sirve;
 *   · la cookie sale httpOnly, lax (para sobrevivir la vuelta desde
 *     Google) y segura en https.
 *
 *   node scripts/probar-google.mjs
 */
import { createHmac } from "node:crypto";

process.env.AUTH_SECRET = "secreto-de-prueba-largo-y-aleatorio-0123456789";

const {
  COOKIE_CONSENTIMIENTO,
  VIGENCIA_CONSENTIMIENTO_SEG,
  firmarConsentimiento,
  googleConfigurado,
  leerConsentimiento,
  opcionesCookieConsentimiento,
  secretoDeFirma,
} = await import("../src/lib/google.ts");
const { VERSION_LEGAL } = await import("../src/lib/legal.ts");

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
};

/** Corre fn con variables de entorno puestas, y las deja como estaban. */
function con(variables, fn) {
  const antes = {};
  for (const [k, v] of Object.entries(variables)) {
    antes[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(antes)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

const SECRETO = process.env.AUTH_SECRET;
const OTRO = "otro-secreto-que-no-es-el-de-la-app";

/** Una cookie armada a mano, con la carga que se quiera y la firma real. */
const fabricar = (carga, secreto = SECRETO) => {
  const b64 = Buffer.from(JSON.stringify(carga)).toString("base64url");
  return `${b64}.${createHmac("sha256", secreto).update(b64).digest("base64url")}`;
};
const ahora = new Date("2026-09-14T15:00:00Z");
const segundos = (d) => Math.floor(d.getTime() / 1000);

// ---------------------------------------------------------------------
console.log("El botón de Google:");

con({ GOOGLE_CLIENT_ID: undefined, GOOGLE_CLIENT_SECRET: undefined }, () =>
  probar("sin llaves, no hay botón", googleConfigurado() === false)
);
con({ GOOGLE_CLIENT_ID: "id.apps.googleusercontent.com", GOOGLE_CLIENT_SECRET: undefined }, () =>
  probar("con el ID solo, tampoco (Google recibiría y el regreso fallaría)", googleConfigurado() === false)
);
con({ GOOGLE_CLIENT_ID: "id.apps.googleusercontent.com", GOOGLE_CLIENT_SECRET: "GOCSPX-x" }, () =>
  probar("con las dos llaves, sí", googleConfigurado() === true)
);

con({ AUTH_SECRET: undefined }, () => {
  let lanzo = false;
  try {
    secretoDeFirma();
  } catch {
    lanzo = true;
  }
  probar("sin AUTH_SECRET se niega a firmar", lanzo);
});

// ---------------------------------------------------------------------
console.log("\nLa cookie de consentimiento:");

const valor = firmarConsentimiento({ nivel: "B1", en: ahora }, SECRETO);
const leido = leerConsentimiento(valor, SECRETO, ahora);
probar(
  "lo que se firma se lee igual: nivel, fecha de aceptación y versión legal",
  leido?.nivel === "B1" &&
    leido.en.getTime() === ahora.getTime() &&
    leido.version === VERSION_LEGAL,
  JSON.stringify(leido)
);
probar(
  "el valor cabe en una cookie tal cual (solo base64url y un punto)",
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(valor),
  valor
);
probar(
  "el nombre de la cookie es válido para Set-Cookie",
  /^[A-Za-z0-9._-]+$/.test(COOKIE_CONSENTIMIENTO),
  COOKIE_CONSENTIMIENTO
);
probar(
  "sin fecha explícita firma con la de ahora",
  Math.abs(leerConsentimiento(firmarConsentimiento({ nivel: "A1" }, SECRETO), SECRETO)?.en - Date.now()) < 2000
);

// El ataque que importa: cambiar la carga y conservar la firma.
const [carga, firma] = valor.split(".");
const cargaC2 = Buffer.from(
  JSON.stringify({ v: VERSION_LEGAL, n: "C2", e: segundos(ahora) })
).toString("base64url");
probar(
  "cambiar el nivel conservando la firma la invalida",
  leerConsentimiento(`${cargaC2}.${firma}`, SECRETO, ahora) === null
);
probar(
  "una firma hecha con otro secreto no vale",
  leerConsentimiento(fabricar({ v: VERSION_LEGAL, n: "B1", e: segundos(ahora) }, OTRO), SECRETO, ahora) === null
);
probar(
  "y la misma cookie leída con otro secreto tampoco",
  leerConsentimiento(valor, OTRO, ahora) === null
);
probar(
  "un consentimiento de OTRA versión de los documentos no sirve para estos",
  leerConsentimiento(fabricar({ v: "2020-01-01", n: "B1", e: segundos(ahora) }), SECRETO, ahora) === null
);
probar(
  "un nivel inventado no pasa",
  leerConsentimiento(fabricar({ v: VERSION_LEGAL, n: "Z9", e: segundos(ahora) }), SECRETO, ahora) === null
);
probar(
  "una fecha que no es un entero no pasa",
  leerConsentimiento(fabricar({ v: VERSION_LEGAL, n: "B1", e: "ayer" }), SECRETO, ahora) === null &&
    leerConsentimiento(fabricar({ v: VERSION_LEGAL, n: "B1", e: 1.5 }), SECRETO, ahora) === null
);
probar(
  "una carga que no es JSON, aunque venga bien firmada, no pasa",
  (() => {
    const rota = Buffer.from("esto no es json").toString("base64url");
    const f = createHmac("sha256", SECRETO).update(rota).digest("base64url");
    return leerConsentimiento(`${rota}.${f}`, SECRETO, ahora) === null;
  })()
);
for (const basura of [undefined, null, "", "abc", "a.b.c", ".", `${carga}.`, `.${firma}`, 42]) {
  probar(`basura ${JSON.stringify(basura)} vale nada`, leerConsentimiento(basura, SECRETO, ahora) === null);
}

// ---------------------------------------------------------------------
console.log("\nCuánto vive:");

const enUnRato = (seg) => new Date(ahora.getTime() + seg * 1000);
probar(
  `sirve justo al cumplir los ${VIGENCIA_CONSENTIMIENTO_SEG / 60} minutos`,
  leerConsentimiento(valor, SECRETO, enUnRato(VIGENCIA_CONSENTIMIENTO_SEG)) !== null
);
probar(
  "un segundo después, ya no",
  leerConsentimiento(valor, SECRETO, enUnRato(VIGENCIA_CONSENTIMIENTO_SEG + 1)) === null
);
probar(
  "tolera un reloj adelantado hasta un minuto",
  leerConsentimiento(valor, SECRETO, enUnRato(-30)) !== null
);
probar(
  "pero una cookie 'del futuro' no vale",
  leerConsentimiento(valor, SECRETO, enUnRato(-61)) === null
);

// ---------------------------------------------------------------------
console.log("\nCómo se guarda:");

con({ AUTH_URL: "https://allison.ejemplo.co", NODE_ENV: "production" }, () => {
  const o = opcionesCookieConsentimiento();
  probar(
    "httpOnly, lax (sobrevive la vuelta desde Google) y vence con el consentimiento",
    o.httpOnly === true && o.sameSite === "lax" && o.path === "/" && o.maxAge === VIGENCIA_CONSENTIMIENTO_SEG,
    JSON.stringify(o)
  );
  probar("segura en producción", o.secure === true);
});
con({ AUTH_URL: "http://localhost:3000", NODE_ENV: "development" }, () =>
  probar(
    "en http://localhost no puede ser segura (el navegador la descartaría)",
    opcionesCookieConsentimiento().secure === false
  )
);
con({ AUTH_URL: "https://allison.ejemplo.co", NODE_ENV: "development" }, () =>
  probar("con AUTH_URL https es segura aunque no sea producción", opcionesCookieConsentimiento().secure === true)
);
con({ AUTH_URL: "http://allison.ejemplo.co", NODE_ENV: "production" }, () =>
  probar("en producción es segura aunque alguien ponga AUTH_URL en http", opcionesCookieConsentimiento().secure === true)
);

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nEntrada con Google correcta.");
