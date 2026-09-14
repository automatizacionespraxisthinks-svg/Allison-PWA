/**
 * Los medios de pago que tiene activos la cuenta de Bold.
 *
 * Sirve para dos cosas antes de lanzar:
 *   · confirmar que el QR Bre-B está habilitado (exige la Cuenta Bold
 *     activa, y es el medio más barato: 2,89% sin valor fijo);
 *   · conocer el nombre EXACTO de cada medio antes de usar BOLD_MEDIOS.
 *
 * Solo usa la llave de identidad, que Bold define como pública.
 *
 *   node --env-file=.env scripts/bold-medios.mjs
 */
const llave = process.env.BOLD_LLAVE_IDENTIDAD;
if (!llave) {
  console.error("Falta BOLD_LLAVE_IDENTIDAD en el entorno.");
  process.exit(1);
}

const respuesta = await fetch(
  "https://integrations.api.bold.co/online/link/v1/payment_methods",
  {
    headers: { Authorization: `x-api-key ${llave}` },
    signal: AbortSignal.timeout(10_000),
  }
).catch((e) => {
  console.error("No hubo respuesta de Bold:", e.message);
  process.exit(1);
});

const datos = await respuesta.json().catch(() => null);
if (!respuesta.ok) {
  console.error(
    `Bold respondió HTTP ${respuesta.status}:`,
    JSON.stringify(datos?.errors ?? datos)
  );
  process.exit(1);
}

const medios = Object.entries(datos?.payload?.payment_methods ?? {});
if (medios.length === 0) {
  console.log("La cuenta no tiene medios de pago en línea activos.");
  process.exit(0);
}

const pesos = (n) => "$" + Number(n).toLocaleString("es-CO");
console.log("Medios activos en la cuenta de Bold:\n");
for (const [nombre, limites] of medios) {
  console.log(`  ${nombre.padEnd(22)} de ${pesos(limites.min)} a ${pesos(limites.max)}`);
}

const hayQr = medios.some(([nombre]) => /QR|BRE/i.test(nombre));
console.log(
  hayQr
    ? "\nEl QR está activo."
    : "\nNo aparece el QR: activa la Cuenta Bold para cobrar con QR Bre-B, el medio más barato."
);
