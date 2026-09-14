/**
 * El adaptador de Bold (src/lib/pasarela.ts), sin tocar la red.
 *
 * Lo que se prueba es lo que, si falla, cuesta plata o la regala:
 *   · la firma del aviso — si se calcula distinto que Bold, TODOS los
 *     pagos reales se rechazan y el alumno paga sin recibir nada;
 *   · el candado de pruebas — Bold firma los avisos de pruebas con una
 *     llave vacía, y aceptar eso en producción regalaría saldo;
 *   · el link — monto cerrado, referencia, vencimiento en la unidad
 *     correcta, y que no se cree un cobro que después no se pueda
 *     acreditar;
 *   · la consulta del estado — que solo un link PAGADO, de ESTA orden y
 *     de dinero real acredite.
 *
 * La firma se contrasta además con el fragmento de Python de la
 * documentación de Bold, ejecutado tal cual, si hay Python instalado:
 * así la prueba no depende de haber entendido bien el algoritmo.
 *
 *   node scripts/probar-bold.mjs
 */
import { spawnSync } from "node:child_process";
import { createHmac } from "node:crypto";

const { pasarela } = await import("../src/lib/pasarela.ts");

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
};

/** Corre fn con variables de entorno puestas, y las deja como estaban. */
async function con(variables, fn) {
  const antes = {};
  for (const [k, v] of Object.entries(variables)) {
    antes[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return await fn();
  } finally {
    for (const [k, v] of Object.entries(antes)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

const REAL = {
  PASARELA: "bold",
  NODE_ENV: "production",
  BOLD_LLAVE_IDENTIDAD: "identidad-de-prueba",
  BOLD_LLAVE_SECRETA: "secreta-de-prueba",
  BOLD_PRUEBAS: undefined,
  BOLD_MEDIOS: undefined,
};
const PRUEBAS = { ...REAL, NODE_ENV: "development", BOLD_PRUEBAS: "true" };

/** Firma como documenta Bold: HMAC-SHA256 del cuerpo en base64, en hex. */
const firmar = (cuerpo, llave) =>
  createHmac("sha256", llave).update(Buffer.from(cuerpo, "utf8").toString("base64")).digest("hex");

const cabeceras = (firma) => new Headers(firma === null ? {} : { "x-bold-signature": firma });

/** Un aviso como el del ejemplo oficial de un pago con link. */
const aviso = (cambios = {}) =>
  JSON.stringify({
    id: "a9c1d0f5-3b7e-4d2a-9f6c-8e4b5d2f0a1b",
    type: "SALE_APPROVED",
    subject: "CNPCGSPS2WBA8",
    source: "/payments/links",
    spec_version: "1.0",
    time: 1761063334000000000,
    data: {
      payment_id: "CNPCGSPS2WBA8",
      amount: { currency: "COP", total: 35000, taxes: [], tip: 0 },
      metadata: { reference: "ALL-PRUEBA-BOLD-01" },
      payment_method: "PSE",
      integration: "LINK",
      ...cambios.data,
    },
    ...cambios.raiz,
  });

// ---------------------------------------------------------------------
console.log("Firma del aviso de Bold:");

await con(REAL, () => {
  const via = pasarela();
  const cuerpo = aviso();
  const buena = firmar(cuerpo, "secreta-de-prueba");

  probar("acepta un aviso firmado con la llave secreta", via.verificarFirma(cuerpo, cabeceras(buena)));
  probar(
    "acepta la firma en mayúsculas o con espacios",
    via.verificarFirma(cuerpo, cabeceras(` ${buena.toUpperCase()} `))
  );
  probar(
    "rechaza si cambian el monto en el cuerpo",
    !via.verificarFirma(cuerpo.replace("35000", "350000"), cabeceras(buena))
  );
  // El ataque que importa: tomar un rechazo auténtico y volverlo aprobación.
  const rechazo = aviso({ raiz: { type: "SALE_REJECTED" } });
  probar(
    "rechaza un rechazo auténtico convertido en aprobación",
    !via.verificarFirma(
      rechazo.replace("SALE_REJECTED", "SALE_APPROVED"),
      cabeceras(firmar(rechazo, "secreta-de-prueba"))
    )
  );
  probar(
    "rechaza una firma hecha con otra llave",
    !via.verificarFirma(cuerpo, cabeceras(firmar(cuerpo, "otra-llave")))
  );
  probar(
    "rechaza la firma del cuerpo SIN base64 (el error fácil)",
    !via.verificarFirma(cuerpo, cabeceras(createHmac("sha256", "secreta-de-prueba").update(cuerpo).digest("hex")))
  );
  probar("rechaza un aviso sin cabecera de firma", !via.verificarFirma(cuerpo, cabeceras(null)));

  const conTildes = aviso({ data: { metadata: { reference: "ALL-PRUEBA-BOLD-01" }, nota: "Educación · inglés 🎓" } });
  probar(
    "firma bien un cuerpo con tildes y emoji (UTF-8)",
    via.verificarFirma(conTildes, cabeceras(firmar(conTildes, "secreta-de-prueba")))
  );
});

await con({ ...REAL, BOLD_LLAVE_SECRETA: undefined }, () => {
  const cuerpo = aviso();
  probar(
    "sin llave secreta no acepta ningún aviso",
    !pasarela().verificarFirma(cuerpo, cabeceras(firmar(cuerpo, "")))
  );
});

await con({ ...REAL, BOLD_PRUEBAS: "true" }, () => {
  const cuerpo = aviso();
  probar(
    "EN PRODUCCIÓN, BOLD_PRUEBAS no abre la puerta a la llave vacía",
    !pasarela().verificarFirma(cuerpo, cabeceras(firmar(cuerpo, "")))
  );
});

await con(PRUEBAS, () => {
  const cuerpo = aviso();
  probar(
    "en desarrollo con BOLD_PRUEBAS acepta la llave vacía (como documenta Bold)",
    pasarela().verificarFirma(cuerpo, cabeceras(firmar(cuerpo, "")))
  );
  probar(
    "y en ese modo rechaza la firma con la llave real",
    !pasarela().verificarFirma(cuerpo, cabeceras(firmar(cuerpo, "secreta-de-prueba")))
  );
});

// El oráculo: el fragmento de Python de developers.bold.co/webhook.
const PYTHON_BOLD = [
  "import sys, json, hmac, hashlib, base64",
  "d = json.loads(sys.stdin.read())",
  "str_message = d['cuerpo']",
  "encoded = base64.b64encode(str_message.encode('utf-8'))",
  "print(hmac.new(key=d['llave'].encode(), digestmod=hashlib.sha256, msg=encoded).hexdigest())",
].join("\n");

const cuerpoOraculo = aviso({ data: { metadata: { reference: "ALL-ORÁCULO" }, nota: "ñandú 🎓" } });
let firmaPython = null;
for (const ejecutable of ["python", "python3"]) {
  const r = spawnSync(ejecutable, ["-c", PYTHON_BOLD], {
    input: JSON.stringify({ cuerpo: cuerpoOraculo, llave: "secreta-de-prueba" }),
    encoding: "utf8",
  });
  if (r.status === 0 && /^[0-9a-f]{64}\s*$/.test(r.stdout)) {
    firmaPython = r.stdout.trim();
    break;
  }
}
if (firmaPython === null) {
  console.log("  OMITIDA  el contraste con el Python de la documentación (no hay Python aquí)");
} else {
  await con(REAL, () =>
    probar(
      "coincide con el fragmento de Python de la documentación de Bold",
      pasarela().verificarFirma(cuerpoOraculo, cabeceras(firmaPython))
    )
  );
}

// ---------------------------------------------------------------------
console.log("\nLectura del aviso:");

await con(REAL, () => {
  const via = pasarela();
  const leer = (texto) => via.interpretarEvento(JSON.parse(texto));

  const aprobado = leer(aviso());
  probar(
    "venta aprobada: referencia, aprobado y monto en pesos",
    aprobado?.referencia === "ALL-PRUEBA-BOLD-01" && aprobado.aprobado === true && aprobado.montoCop === 35000,
    JSON.stringify(aprobado)
  );
  probar("venta rechazada: no aprobado", leer(aviso({ raiz: { type: "SALE_REJECTED" } }))?.aprobado === false);
  probar("una anulación no es un cobro que procesar", leer(aviso({ raiz: { type: "VOID_APPROVED" } })) === null);
  probar(
    "un aviso sin referencia (como el del QR presencial) no se ata a nada",
    leer(aviso({ data: { metadata: { reference: null } } })) === null
  );
  probar(
    "un pago en otra moneda no puede pasar por el monto de la orden",
    Number.isNaN(leer(aviso({ data: { amount: { currency: "USD", total: 35000 } } }))?.montoCop)
  );
  probar(
    "sin monto en el aviso queda undefined, no cero",
    leer(aviso({ data: { amount: undefined } }))?.montoCop === undefined
  );
});

// ---------------------------------------------------------------------
//  Red simulada: se registra cada llamada y se responde lo que se pida.
// ---------------------------------------------------------------------
const llamadas = [];
let responder = () => ({ status: 200, cuerpo: {} });
globalThis.fetch = async (url, opciones = {}) => {
  llamadas.push({ url: String(url), opciones });
  const { status, cuerpo } = responder(String(url), opciones);
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
};
const ultima = () => llamadas[llamadas.length - 1];
const ORDEN = {
  transaccionId: "5f0c1d8e-1111-4222-8333-944455556666",
  referencia: "ALL-PRUEBA-BOLD-01",
  montoCop: 35000,
  concepto: "Plan mensual",
  correo: null,
  origen: "https://allison.ejemplo.co",
};
const LINK_CREADO = {
  status: 200,
  cuerpo: { payload: { payment_link: "LNK_PRUEBA1", url: "https://checkout.bold.co/LNK_PRUEBA1" }, errors: [] },
};

console.log("\nCreación del link de pago:");

await con(REAL, async () => {
  responder = () => LINK_CREADO;
  const antes = Date.now();
  const pago = await pasarela().crearPago(ORDEN);
  const { url, opciones } = ultima();
  const cuerpo = JSON.parse(opciones.body);

  probar("llama a POST /online/link/v1 de Bold", url === "https://integrations.api.bold.co/online/link/v1" && opciones.method === "POST", url);
  probar(
    "se identifica con la llave de identidad",
    new Headers(opciones.headers).get("authorization") === "x-api-key identidad-de-prueba"
  );
  probar("la llave SECRETA nunca viaja en la petición", !opciones.body.includes("secreta-de-prueba") && !JSON.stringify(opciones.headers).includes("secreta"));
  probar(
    "monto CERRADO, en pesos, sin propina",
    cuerpo.amount_type === "CLOSE" && cuerpo.amount.total_amount === 35000 && cuerpo.amount.currency === "COP" && cuerpo.amount.tip_amount === 0,
    JSON.stringify(cuerpo.amount)
  );
  probar("lleva nuestra referencia", cuerpo.reference === "ALL-PRUEBA-BOLD-01");
  probar(
    "la descripción cabe en los 100 caracteres de Bold",
    typeof cuerpo.description === "string" && cuerpo.description.length >= 2 && cuerpo.description.length <= 100
  );

  const segundos = cuerpo.expiration_date / 1e9;
  probar(
    "vence en 60 minutos, expresado en NANOSEGUNDOS",
    Math.abs(segundos - (antes / 1000 + 3600)) < 5,
    String(cuerpo.expiration_date)
  );
  probar(
    "el vencimiento viaja como entero exacto (sin exponente ni decimales)",
    /"expiration_date":\d{19},/.test(opciones.body),
    opciones.body.match(/"expiration_date":[^,]*/)?.[0]
  );
  probar("vuelve a la página de la orden", cuerpo.callback_url === `https://allison.ejemplo.co/pagar/${ORDEN.transaccionId}`);
  probar("sin BOLD_MEDIOS, no restringe los medios (el QR incluido)", !("payment_methods" in cuerpo));
  probar(
    "devuelve la URL del checkout y el id del link",
    pago.urlPago === "https://checkout.bold.co/LNK_PRUEBA1" && pago.idExterno === "LNK_PRUEBA1",
    JSON.stringify(pago)
  );
});

await con(REAL, async () => {
  responder = () => LINK_CREADO;
  await pasarela().crearPago({ ...ORDEN, origen: "http://localhost:3000" });
  const cuerpo = JSON.parse(ultima().opciones.body);
  probar(
    "con un origen http no manda URL de regreso (Bold solo acepta https)",
    !("callback_url" in cuerpo) && !("image_url" in cuerpo)
  );
});

await con({ ...REAL, BOLD_MEDIOS: " qr, pse,,nequi ; DROP TABLE" }, async () => {
  responder = () => LINK_CREADO;
  await pasarela().crearPago(ORDEN);
  const cuerpo = JSON.parse(ultima().opciones.body);
  probar(
    "BOLD_MEDIOS se limpia: mayúsculas, sin vacíos ni basura",
    JSON.stringify(cuerpo.payment_methods) === JSON.stringify(["QR", "PSE"]),
    JSON.stringify(cuerpo.payment_methods)
  );
});

/** Espera que fn lance, y que no se haya llamado a Bold. */
async function lanzaSinLlamar(nombre, variables, patron) {
  await con(variables, async () => {
    const n = llamadas.length;
    let error = null;
    try {
      await pasarela().crearPago(ORDEN);
    } catch (e) {
      error = e;
    }
    probar(
      nombre,
      error !== null && patron.test(error.message) && llamadas.length === n,
      error ? `${error.message} (llamadas: ${llamadas.length - n})` : "no lanzó"
    );
  });
}

await lanzaSinLlamar(
  "sin llave secreta NO crea el link (se cobraría sin poder acreditar)",
  { ...REAL, BOLD_LLAVE_SECRETA: undefined },
  /BOLD_LLAVE_SECRETA/
);
await lanzaSinLlamar(
  "sin llave de identidad no crea el link",
  { ...REAL, BOLD_LLAVE_IDENTIDAD: undefined },
  /BOLD_LLAVE_IDENTIDAD/
);
await lanzaSinLlamar(
  "EN PRODUCCIÓN con BOLD_PRUEBAS=true se niega a cobrar",
  { ...REAL, BOLD_PRUEBAS: "true" },
  /no puede correr en producción/
);

await con(REAL, async () => {
  responder = () => ({ status: 401, cuerpo: { errors: [{ message: "Unauthorized" }] } });
  let error = null;
  try {
    await pasarela().crearPago(ORDEN);
  } catch (e) {
    error = e;
  }
  probar(
    "si Bold rechaza la petición, lanza con el código y sin exponer las llaves",
    error !== null && /401/.test(error.message) && !/identidad-de-prueba|secreta-de-prueba/.test(error.message),
    error?.message
  );

  responder = () => ({ status: 200, cuerpo: { payload: {}, errors: [] } });
  error = null;
  try {
    await pasarela().crearPago(ORDEN);
  } catch (e) {
    error = e;
  }
  probar("si Bold responde sin URL de pago, lanza en vez de mandar al alumno a la nada", error !== null);
});

// ---------------------------------------------------------------------
console.log("\nConsulta del estado del link:");

const estadoLink = (cambios = {}) => ({
  status: 200,
  cuerpo: {
    api_version: 1,
    id: "LNK_PRUEBA1",
    total: 35000,
    status: "PAID",
    reference: "ALL-PRUEBA-BOLD-01",
    is_sandbox: false,
    ...cambios,
  },
});
const consultar = () =>
  pasarela().consultarEstado({ referencia: "ALL-PRUEBA-BOLD-01", idExterno: "LNK_PRUEBA1" });

await con(REAL, async () => {
  responder = () => estadoLink();
  const pagado = await consultar();
  probar(
    "un link PAGADO de esta orden: aprobado, con su monto",
    pagado.estado === "aprobado" && pagado.montoCop === 35000,
    JSON.stringify(pagado)
  );
  probar(
    "pregunta a GET /online/link/v1/<link> con la llave de identidad",
    ultima().url === "https://integrations.api.bold.co/online/link/v1/LNK_PRUEBA1" &&
      new Headers(ultima().opciones.headers).get("authorization") === "x-api-key identidad-de-prueba",
    ultima().url
  );

  const avisos = [];
  const errorOriginal = console.error;
  console.error = (m) => avisos.push(String(m));
  try {
    responder = () => estadoLink({ reference: "OTRA-ORDEN" });
    probar("un link pagado de OTRA orden no aprueba esta", (await consultar()).estado === "pendiente");

    responder = () => estadoLink({ is_sandbox: true });
    probar("un pago de PRUEBAS no aprueba nada cobrando de verdad", (await consultar()).estado === "pendiente");
  } finally {
    console.error = errorOriginal;
  }
  probar("y los dos casos quedan en el log", avisos.length === 2, String(avisos.length));

  for (const [status, esperado] of [
    ["REJECTED", "rechazado"],
    ["CANCELLED", "rechazado"],
    ["EXPIRED", "rechazado"],
    ["ACTIVE", "pendiente"],
    ["PROCESSING", "pendiente"],
  ]) {
    responder = () => estadoLink({ status });
    probar(`${status.padEnd(10)} → ${esperado}`, (await consultar()).estado === esperado);
  }

  responder = () => ({ status: 200, cuerpo: { payload: estadoLink().cuerpo } });
  probar("acepta la respuesta envuelta en payload", (await consultar()).estado === "aprobado");

  responder = () => estadoLink({ total: undefined });
  probar("pagado sin total legible: monto NaN, nunca 'sin comparar'", Number.isNaN((await consultar()).montoCop));

  responder = () => ({ status: 401, cuerpo: {} });
  let error = null;
  try {
    await consultar();
  } catch (e) {
    error = e;
  }
  probar("si Bold no responde bien, lanza (y la orden no cambia)", error !== null && /401/.test(error.message));
});

await con(PRUEBAS, async () => {
  responder = () => estadoLink({ is_sandbox: true });
  probar("en desarrollo con BOLD_PRUEBAS, el link de pruebas sí aprueba", (await consultar()).estado === "aprobado");
});

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nAdaptador de Bold correcto.");
