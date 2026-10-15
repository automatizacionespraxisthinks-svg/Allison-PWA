/**
 * Las reglas del perfil (src/lib/perfil-reglas.ts), sin red ni base.
 *
 * Son las del registro, aplicadas a quien ya tiene cuenta: el correo
 * sigue siendo obligatorio, el celular y el usuario se normalizan igual
 * que al entrar, y un alumno de colegio solo cambia nombre y nivel.
 *
 *   node scripts/probar-perfil.mjs
 */
const { validarContrasenaNueva, validarPerfil } = await import("../src/lib/perfil-reglas.ts");

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
};

const base = {
  nombre: "  Ana   Pérez ",
  email: " Ana.Perez@Correo.CO ",
  telefono: "+57 300 123 4567",
  username: " Ana.P ",
  nivel: "B1",
};

console.log("Usuario del público general:");
const ok = validarPerfil(base, "email");
probar(
  "normaliza todo como el registro: nombre sin espacios dobles, correo en minúsculas, celular a 10 dígitos, usuario en minúsculas",
  ok.ok &&
    ok.datos.nombre === "Ana Pérez" &&
    ok.datos.email === "ana.perez@correo.co" &&
    ok.datos.telefono === "3001234567" &&
    ok.datos.username === "ana.p" &&
    ok.datos.nivel === "B1",
  JSON.stringify(ok)
);
probar(
  "celular y usuario vacíos quedan en null (son opcionales)",
  (() => {
    const r = validarPerfil({ ...base, telefono: "", username: "  " }, "email");
    return r.ok && r.datos.telefono === null && r.datos.username === null;
  })()
);
probar("sin nombre, no", !validarPerfil({ ...base, nombre: "A" }, "email").ok);
probar("con un nivel inventado, no", !validarPerfil({ ...base, nivel: "Z9" }, "email").ok);
probar("sin correo, no", !validarPerfil({ ...base, email: "" }, "email").ok);
probar("con un correo mal escrito, no", !validarPerfil({ ...base, email: "ana@correo" }, "email").ok);
probar(
  "un celular que no empieza por 3 o no tiene 10 dígitos, no",
  !validarPerfil({ ...base, telefono: "6012345678" }, "email").ok &&
    !validarPerfil({ ...base, telefono: "300123" }, "email").ok
);
probar(
  "un correo en el campo de usuario, no",
  !validarPerfil({ ...base, username: "otro@correo.co" }, "email").ok
);
probar(
  "un usuario con símbolos raros, no",
  !validarPerfil({ ...base, username: "ana pérez!" }, "email").ok
);
probar("un cuerpo que no es objeto no revienta", !validarPerfil(null, "email").ok && !validarPerfil("x", "email").ok);

console.log("\nAlumno de colegio:");
const colegio = validarPerfil({ nombre: "Juan", nivel: "A2", email: "juan@x.co", username: "otro" }, "institucional");
probar(
  "solo cambia nombre y nivel; correo, celular y usuario se ignoran",
  colegio.ok &&
    colegio.datos.nombre === "Juan" &&
    colegio.datos.nivel === "A2" &&
    colegio.datos.email === null &&
    colegio.datos.username === null,
  JSON.stringify(colegio)
);

console.log("\nContraseña nueva:");
probar("corta, no", validarContrasenaNueva("1234567") !== null);
probar("de 8 en adelante, sí", validarContrasenaNueva("12345678") === null);
probar("lo que no es texto, no", validarContrasenaNueva(undefined) !== null);

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nPerfil correcto.");
