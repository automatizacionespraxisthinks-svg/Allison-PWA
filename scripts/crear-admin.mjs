/**
 * Crea o asciende a un administrador.
 *
 * Es deliberadamente un script de terminal y no una pantalla: hacer
 * administrador a alguien desde la web sería la primera puerta que
 * intentaría forzar un atacante. Para correr esto hay que tener acceso
 * al servidor y a la base de datos.
 *
 *   node --env-file=.env scripts/crear-admin.mjs correo@ejemplo.com "Su Nombre" LaClave123
 *
 * Si el correo ya existe, solo lo asciende a administrador y no toca su
 * contraseña.
 */
import bcrypt from "bcryptjs";
import postgres from "postgres";

/**
 * Copiada de src/lib/legal.ts en vez de importada: este script corre
 * DENTRO del contenedor, donde no existe el codigo fuente en
 * TypeScript. Si cambia la version legal, hay que cambiarla aqui
 * tambien -- lo recuerda la prueba de scripts/probar-legal.mjs.
 */
const VERSION_LEGAL = "2026-08-29";

const [email, nombre, password] = process.argv.slice(2);

if (!email) {
  console.error(
    'Uso: node --env-file=.env scripts/crear-admin.mjs correo@ejemplo.com "Su Nombre" LaClave123'
  );
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL.");
  process.exit(1);
}

// Mismo criterio de TLS que el resto del proyecto: se exige salvo que
// la URL diga lo contrario. Antes forzaba ssl:"require" y fallaba
// contra un Postgres sin TLS con un error de red incomprensible.
const sql = postgres(url, {
  ssl: url.includes("sslmode=disable") ? false : "require",
  max: 1,
  onnotice: () => {},
});

const [existente] = await sql`
  select id, nombre, rol from users where email = ${email.toLowerCase()}
`;

if (existente) {
  if (existente.rol === "admin") {
    console.log(`${existente.nombre} ya era administrador.`);
  } else {
    await sql`update users set rol = 'admin' where id = ${existente.id}`;
    console.log(`${existente.nombre} ahora es administrador.`);
  }
  await sql.end();
  process.exit(0);
}

if (!nombre || !password) {
  console.error("Para crear una cuenta nueva hacen falta el nombre y la contraseña.");
  await sql.end();
  process.exit(1);
}

if (password.length < 8) {
  console.error("La contraseña debe tener al menos 8 caracteres.");
  await sql.end();
  process.exit(1);
}

const id = await sql.begin(async (tx) => {
  const [u] = await tx`
    insert into users
      (tipo_acceso, email, password_hash, nombre, nivel, rol,
       email_verificado_en, acepto_terminos_en, version_legal,
       autoriza_transferencia, autoriza_voz, declara_edad_o_acudiente)
    values
      ('email', ${email.toLowerCase()}, ${await bcrypt.hash(password, 12)},
       ${nombre}, 'C1', 'admin', now(), now(), ${VERSION_LEGAL}, true, true, true)
    returning id
  `;
  // Saldo en cero: un administrador no necesita mensajes de regalo, y
  // dárselos descuadraría los números de la prueba gratuita.
  await tx`insert into saldos (user_id) values (${u.id})`;
  return u.id;
});

console.log(`Administrador creado: ${nombre} <${email}>`);
console.log(`  id: ${id}`);
await sql.end();
