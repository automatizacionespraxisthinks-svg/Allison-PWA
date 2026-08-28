import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sql } from "@/lib/db";
import { interpretar } from "@/lib/identificador";

/** Convierte lo que llegue en texto, para dar mensajes en español y no
 *  el error técnico de la librería cuando falta un campo. */
const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

const Registro = z.object({
  nombre: z.preprocess(texto, z.string().min(2, "Escribe tu nombre").max(80)),
  email: z.preprocess(
    (v) => texto(v).toLowerCase(),
    z.string().min(1, "Escribe tu correo").email("Ese correo no parece válido")
  ),
  /** Opcional: celular o usuario, para entrar más fácil que con el correo. */
  acceso: z.preprocess(texto, z.string()).default(""),
  password: z.preprocess(
    (v) => (typeof v === "string" ? v : ""),
    z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200)
  ),
  nivel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

export async function POST(peticion: Request) {
  const cuerpo = await peticion.json().catch(() => null);
  const datos = Registro.safeParse(cuerpo);

  if (!datos.success) {
    return NextResponse.json(
      { error: datos.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { nombre, email, password, nivel, acceso } = datos.data;

  // El correo es obligatorio: es el único canal para devolverle el
  // acceso si olvida la contraseña.
  const campos: Record<string, string> = { email };

  if (acceso) {
    const id = interpretar(acceso);
    if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
    if (id.tipo === "email") {
      return NextResponse.json(
        { error: "Ahí va tu celular o un usuario, no otro correo." },
        { status: 400 }
      );
    }
    campos[id.tipo === "telefono" ? "telefono" : "username"] = id.valor;
  }

  // Ningún identificador puede estar repetido
  for (const [columna, valor] of Object.entries(campos)) {
    const [existe] = await sql`
      select id from users
       where ${sql(columna)} = ${valor} and institucion_id is null
       limit 1
    `;
    if (existe) {
      const nombreCampo =
        columna === "email" ? "correo" : columna === "telefono" ? "celular" : "usuario";
      return NextResponse.json(
        { error: `Ya hay una cuenta con ese ${nombreCampo}. Inicia sesión.` },
        { status: 409 }
      );
    }
  }

  const hash = await bcrypt.hash(password, 12);
  const gratis = Number(process.env.MENSAJES_PRUEBA_GRATIS ?? 20);

  // Cuenta y saldo se crean juntos: un usuario sin fila de saldo no
  // podría hablar, y el error aparecería mucho después.
  const nuevoId = await sql.begin(async (tx) => {
    const [u] = await tx`
      insert into users ${sql({
        tipo_acceso: "email",
        ...campos,
        password_hash: hash,
        nombre,
        nivel,
      })}
      returning id
    `;
    await tx`
      insert into saldos (user_id, mensajes_plan, mensajes_recarga)
      values (${u.id}, 0, ${gratis})
    `;
    await tx`
      insert into movimientos_credito
        (user_id, tipo, bolsa, cantidad, saldo_plan_despues, saldo_recarga_despues, nota)
      values
        (${u.id}, 'bono', 'recarga', ${gratis}, 0, ${gratis}, 'Mensajes de prueba al registrarse')
    `;
    return u.id;
  });

  return NextResponse.json({ ok: true, id: nuevoId, mensajes: gratis }, { status: 201 });
}
