/**
 * Los candados del inicio de sesión (src/lib/intentos.ts), sin red ni base.
 *
 * Lo que se prueba es lo que protege una cuenta y lo que evita que el
 * candado se vuelva un arma:
 *   · adivinar la clave o el PIN de alguien se frena, en 15 minutos y
 *     en el día;
 *   · probar muchas cuentas desde una IP se frena;
 *   · un salón entero entrando bien desde una misma IP NO se bloquea;
 *   · sin proxy configurado no se bloquea a todo el mundo;
 *   · la cuenta se libera al entrar bien o al recuperar el acceso;
 *   · la misma cuenta escrita distinto cuenta como la misma.
 *
 * El tiempo se simula: las ventanas son de minutos y horas.
 *
 *   node scripts/probar-intentos.mjs
 */
const {
  LIMITES_ENTRADA,
  anotarFallo,
  cuentaDeColegio,
  cuentaDeCorreo,
  entradaBloqueada,
  liberarCuenta,
} = await import("../src/lib/intentos.ts");

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
};

// Reloj controlado
let ahora = Date.parse("2026-09-14T08:00:00Z");
Date.now = () => ahora;
const avanzar = (min) => (ahora += min * 60 * 1000);

process.env.PROXY_CONFIABLE = "reverso";
const desde = (ip) => new Request("https://allison.ejemplo.co/api/auth/callback/acceso", {
  method: "POST",
  headers: { "x-forwarded-for": ip },
});
const fallar = (cuenta, peticion, veces) => {
  for (let i = 0; i < veces; i++) anotarFallo(cuenta, peticion);
};

console.log("Candados del inicio de sesión:");

// --- La misma cuenta, escrita distinto --------------------------------
probar(
  "el correo cuenta igual con mayúsculas y espacios",
  cuentaDeCorreo("  Ana.Perez@Correo.CO ") === cuentaDeCorreo("ana.perez@correo.co")
);
probar(
  "el código del colegio no distingue mayúsculas, ni el usuario",
  cuentaDeColegio("colegio2026", " Juan.P ") === cuentaDeColegio("COLEGIO2026", "juan.p")
);
probar("un identificador inválido no es una cuenta", cuentaDeCorreo("") === null);

// --- Por cuenta, 15 minutos --------------------------------------------
{
  const cuenta = cuentaDeColegio("COLEGIO2026", "pin.adivinado");
  const casa = desde("190.1.1.1");
  fallar(cuenta, casa, LIMITES_ENTRADA.cuenta.maximo - 1);
  probar("9 PIN equivocados: todavía puede intentar", !entradaBloqueada(cuenta, casa));
  anotarFallo(cuenta, casa);
  probar("al 10.º, la cuenta se bloquea", entradaBloqueada(cuenta, casa));
  probar(
    "y se bloquea desde CUALQUIER IP (un ataque repartido no se lo salta)",
    entradaBloqueada(cuenta, desde("200.9.9.9"))
  );
  probar(
    "otra cuenta sigue entrando normal",
    !entradaBloqueada(cuentaDeColegio("COLEGIO2026", "otro.alumno"), desde("200.9.9.9"))
  );
  avanzar(16);
  probar("a los 15 minutos se libera sola", !entradaBloqueada(cuenta, desde("200.9.9.9")));
}

// --- Por cuenta, 24 horas ----------------------------------------------
{
  const cuenta = cuentaDeColegio("COLEGIO2026", "ataque.lento");
  let intentos = 0;
  // Un script paciente: 10 fallos cada 16 minutos, todo el día.
  for (let bloque = 0; bloque < 90; bloque++) {
    for (let i = 0; i < 10; i++) {
      if (entradaBloqueada(cuenta, desde(`10.0.${bloque}.${i}`))) break;
      anotarFallo(cuenta, desde(`10.0.${bloque}.${i}`));
      intentos++;
    }
    avanzar(16);
    if (ahora - Date.parse("2026-09-14T08:16:00Z") > 23 * 60 * 60 * 1000) break;
  }
  probar(
    `un script paciente y repartido en IPs solo logra ${intentos} intentos en un día (tope 50)`,
    intentos === LIMITES_ENTRADA.cuentaDia.maximo,
    String(intentos)
  );
  const dias = Math.ceil(10_000 / LIMITES_ENTRADA.cuentaDia.maximo);
  probar(`recorrer los 10.000 PIN le tomaría ${dias} días`, dias > 180);
}

// --- Por IP --------------------------------------------------------------
{
  const atacante = desde("181.50.50.50");
  for (let i = 0; i < LIMITES_ENTRADA.ip.maximo; i++) {
    anotarFallo(cuentaDeCorreo(`victima${i}@correo.co`), atacante);
  }
  probar(
    "60 fallos en cuentas distintas desde una IP: esa IP ya no puede probar otra",
    entradaBloqueada(cuentaDeCorreo("nueva.victima@correo.co"), atacante)
  );
  probar(
    "pero la misma cuenta desde otra IP sí entra",
    !entradaBloqueada(cuentaDeCorreo("nueva.victima@correo.co"), desde("181.60.60.60"))
  );
  avanzar(16);
}

// --- El salón de clase ----------------------------------------------------
{
  const colegio = desde("186.30.30.30");
  // 40 alumnos entran bien; algunos se equivocan una o dos veces antes.
  for (let i = 0; i < 40; i++) {
    const cuenta = cuentaDeColegio("COLEGIO2026", `alumno${i}`);
    if (i % 3 === 0) fallar(cuenta, colegio, 1);
    liberarCuenta(cuenta);
  }
  probar(
    "40 alumnos entrando desde la misma IP del colegio, con algunos errores: nadie queda bloqueado",
    !entradaBloqueada(cuentaDeColegio("COLEGIO2026", "alumno41"), colegio)
  );
}

// --- Sin proxy -------------------------------------------------------------
{
  delete process.env.PROXY_CONFIABLE;
  const cualquiera = desde("no-importa");
  for (let i = 0; i < 200; i++) anotarFallo(cuentaDeCorreo(`spam${i}@correo.co`), cualquiera);
  probar(
    "sin proxy configurado, 200 fallos de alguien no bloquean la entrada de los demás",
    !entradaBloqueada(cuentaDeCorreo("persona.normal@correo.co"), cualquiera)
  );
  process.env.PROXY_CONFIABLE = "reverso";
}

// --- Liberar -------------------------------------------------------------
{
  const cuenta = cuentaDeCorreo("olvido.clave@correo.co");
  const ip = desde("190.20.20.20");
  fallar(cuenta, ip, 10);
  probar("bloqueada tras 10 fallos", entradaBloqueada(cuenta, ip));
  liberarCuenta(cuenta);
  probar("recuperar la contraseña (o entrar bien) la libera al instante", !entradaBloqueada(cuenta, ip));
}

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nCandados correctos.");
