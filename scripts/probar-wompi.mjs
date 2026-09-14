/**
 * La firma de los eventos de Wompi.
 *
 * Existe por un fallo real: la verificación usaba un HMAC sobre el
 * cuerpo, y Wompi firma de otra manera. Dos algoritmos distintos nunca
 * coinciden, así que TODOS los avisos reales se habrían rechazado —
 * el alumno paga por QR y no recibe una sola intervención, en silencio,
 * porque los pagos sí se cobran.
 *
 * El algoritmo, de docs.wompi.co ("Eventos"):
 *   sha256( valores de signature.properties en orden + timestamp + secreto )
 *
 * Ojo: el ejemplo numérico de esa documentación NO reproduce (dicen
 * "se obtiene por ejemplo"), así que no sirve como vector de prueba.
 * Aquí se firma un evento igual que Wompi y se comprueba que la
 * verificación lo acepte y rechace cualquier manipulación.
 *
 *   node scripts/probar-wompi.mjs
 */
import { createHash } from "node:crypto";

process.env.PASARELA = "wompi";
process.env.WOMPI_EVENTS_SECRET = "prod_events_secreto_de_prueba";
process.env.WOMPI_PUBLIC_KEY = "pub_prod_x";
process.env.WOMPI_INTEGRITY_SECRET = "integridad_x";

const { pasarela } = await import("../src/lib/pasarela.ts");
const via = pasarela();

let fallos = 0;
const probar = (nombre, ok) => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}`);
  if (!ok) fallos++;
};

/** Firma un evento exactamente como lo hace Wompi. */
function firmar(evento, secreto = process.env.WOMPI_EVENTS_SECRET) {
  const valor = (ruta) =>
    ruta.split(".").reduce((o, k) => (o == null ? o : o[k]), evento.data);
  const cadena =
    evento.signature.properties.map((p) => String(valor(p))).join("") +
    String(evento.timestamp) +
    secreto;
  return createHash("sha256").update(cadena).digest("hex");
}

const base = () => ({
  event: "transaction.updated",
  data: {
    transaction: {
      id: "1234-1610641025-49201",
      reference: "ALL-PRUEBA-01",
      status: "APPROVED",
      amount_in_cents: 400000,
    },
  },
  environment: "prod",
  signature: {
    properties: ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
    checksum: "",
  },
  timestamp: 1530291411,
});

const cabeceras = (checksum) => new Headers({ "x-event-checksum": checksum });

console.log("Firma de eventos de Wompi:");

// 1. Un evento bien firmado se acepta
const bueno = base();
const firmaBuena = firmar(bueno);
probar(
  "acepta un evento firmado como lo firma Wompi",
  via.verificarFirma(JSON.stringify(bueno), cabeceras(firmaBuena))
);

// 2. En MAYÚSCULAS también: Wompi lo entrega así en su documentación
probar(
  "acepta el checksum en mayúsculas",
  via.verificarFirma(JSON.stringify(bueno), cabeceras(firmaBuena.toUpperCase()))
);

// 3. Sin cabecera, vale el checksum del cuerpo
const enCuerpo = base();
enCuerpo.signature.checksum = firmar(enCuerpo);
probar(
  "acepta el checksum que viene dentro del cuerpo",
  via.verificarFirma(JSON.stringify(enCuerpo), new Headers())
);

// 4. Cambiar el ESTADO invalida la firma: es el ataque que importa
//    — convertir un pago rechazado en aprobado.
const manipulado = base();
manipulado.data.transaction.status = "DECLINED";
probar(
  "rechaza si cambian el estado de la transacción",
  !via.verificarFirma(JSON.stringify(manipulado), cabeceras(firmaBuena))
);

// 5. Cambiar el MONTO también
const otroMonto = base();
otroMonto.data.transaction.amount_in_cents = 99999999;
probar(
  "rechaza si cambian el monto",
  !via.verificarFirma(JSON.stringify(otroMonto), cabeceras(firmaBuena))
);

// 6. Con otro secreto, no pasa
probar(
  "rechaza un evento firmado con otro secreto",
  !via.verificarFirma(JSON.stringify(bueno), cabeceras(firmar(bueno, "otro_secreto")))
);

// 7. Un campo que la firma nombra pero el evento no trae: rechazo.
//    Si pasara como cadena vacía, dos eventos distintos firmarían igual.
const faltante = base();
delete faltante.data.transaction.status;
probar(
  "rechaza si falta un campo que la firma nombra",
  !via.verificarFirma(JSON.stringify(faltante), cabeceras(firmaBuena))
);

// 8. Basura
probar("rechaza un cuerpo que no es JSON", !via.verificarFirma("{roto", cabeceras("x")));
probar(
  "rechaza un evento sin objeto signature",
  !via.verificarFirma(JSON.stringify({ data: {}, timestamp: 1 }), cabeceras("x"))
);

// 9. Sin secreto configurado no se acepta NADA: es el caso del
//    despliegue al que se le olvidó la variable.
const guardado = process.env.WOMPI_EVENTS_SECRET;
delete process.env.WOMPI_EVENTS_SECRET;
probar(
  "sin WOMPI_EVENTS_SECRET no acepta ningún evento",
  !via.verificarFirma(JSON.stringify(bueno), cabeceras(firmaBuena))
);
process.env.WOMPI_EVENTS_SECRET = guardado;

// 10. La referencia se lee del sitio correcto
const leido = via.interpretarEvento(bueno);
probar(
  "extrae la referencia y el estado del evento",
  leido?.referencia === "ALL-PRUEBA-01" && leido?.aprobado === true
);

// 11. El monto viaja en centavos: se lee en pesos para compararlo con la
//     orden, y si es de otra moneda no puede coincidir.
probar("lee el monto en PESOS (400.000 centavos = $4.000)", leido?.montoCop === 4000);

const conPagador = base();
conPagador.data.transaction.customer_email = "pagador@correo.co";
conPagador.data.transaction.payment_method = { type: "NEQUI", phone_number: "3001234567" };
const rastroWompi = JSON.stringify(via.interpretarEvento(conPagador)?.rastro);
probar(
  "el rastro que se guarda NO trae el correo ni el teléfono del pagador",
  !/pagador@|3001234567/.test(rastroWompi) && rastroWompi.includes("1234-1610641025-49201"),
  rastroWompi
);
const enDolares = base();
enDolares.data.transaction.currency = "USD";
probar(
  "un pago en otra moneda no pasa por el monto de la orden",
  Number.isNaN(via.interpretarEvento(enDolares)?.montoCop)
);

// 12. Sin el secreto de eventos no se abre un cobro: Wompi cobraría y
//     su aviso se rechazaría, y el alumno pagaría sin recibir nada.
delete process.env.WOMPI_EVENTS_SECRET;
let sinSecreto = null;
try {
  await via.crearPago({
    transaccionId: "5f0c1d8e-1111-4222-8333-944455556666",
    referencia: "ALL-PRUEBA-01",
    montoCop: 4000,
    concepto: "Recarga",
    correo: null,
    origen: "https://allison.ejemplo.co",
  });
} catch (e) {
  sinSecreto = e;
}
probar(
  "sin WOMPI_EVENTS_SECRET se niega a abrir el cobro",
  sinSecreto !== null && /WOMPI_EVENTS_SECRET/.test(sinSecreto.message)
);
process.env.WOMPI_EVENTS_SECRET = guardado;

const pago = await via.crearPago({
  transaccionId: "5f0c1d8e-1111-4222-8333-944455556666",
  referencia: "ALL-PRUEBA-01",
  montoCop: 4000,
  concepto: "Recarga",
  correo: null,
  origen: "https://allison.ejemplo.co",
});
probar(
  "al terminar, Wompi devuelve al alumno a la página de SU orden",
  new URL(pago.urlPago).searchParams.get("redirect-url") ===
    "https://allison.ejemplo.co/pagar/5f0c1d8e-1111-4222-8333-944455556666"
);

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nFirma de Wompi correcta.");
