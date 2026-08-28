import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sql } from "@/lib/db";

const Registro = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(80),
  email: z.string().trim().toLowerCase().email("Ese correo no parece válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
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

  const { nombre, email, password, nivel } = datos.data;

  const [existe] = await sql`select id from users where email = ${email} limit 1`;
  if (existe) {
    return NextResponse.json(
      { error: "Ya hay una cuenta con ese correo. Inicia sesión." },
      { status: 409 }
    );
  }

  const hash = await bcrypt.hash(password, 12);
  const gratis = Number(process.env.MENSAJES_PRUEBA_GRATIS ?? 20);

  // Cuenta y saldo se crean juntos: un usuario sin fila de saldo no
  // podría hablar, y el error aparecería mucho después.
  const id = await sql.begin(async (tx) => {
    const [u] = await tx`
      insert into users (tipo_acceso, email, password_hash, nombre, nivel)
      values ('email', ${email}, ${hash}, ${nombre}, ${nivel})
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

  return NextResponse.json({ ok: true, id, mensajes: gratis }, { status: 201 });
}
