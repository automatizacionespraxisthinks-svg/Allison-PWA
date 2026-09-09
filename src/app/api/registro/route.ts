import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sql } from "@/lib/db";
import { limitar, origenDe } from "@/lib/limite";
import { interpretar } from "@/lib/identificador";
import { VERSION_LEGAL } from "@/lib/legal";
import { enviarVerificacion, PRUEBA_INICIAL } from "@/lib/verificacion";
import { origenPublico } from "@/lib/origen";

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

  // La autorización tiene que ser expresa: se exige true, no se acepta
  // la ausencia del campo ni una casilla marcada de antemano.
  aceptaLegal: z.literal(true, {
    error: "Debes aceptar los términos y la política de datos",
  }),
  declaraEdad: z.literal(true, {
    error: "Debes confirmar que eres mayor de edad o que tu acudiente autoriza",
  }),
});

/** Cuentas nuevas permitidas desde una misma IP en una hora. */
const REGISTROS_POR_HORA = 5;

/**
 * Tope de registros de TODO el sistema por hora.
 *
 * El límite por IP se puede burlar falsificando la cabecera cuando no
 * hay un proxy de confianza delante. Este no: no depende de nada que el
 * cliente controle. Es el techo que impide que un script cree mil
 * cuentas y se lleve mil pruebas gratis en una noche.
 */
const REGISTROS_GLOBALES_POR_HORA = Number(
  process.env.REGISTROS_GLOBALES_POR_HORA ?? 60
);

export async function POST(peticion: Request) {
  const limite = limitar(`registro:${origenDe(peticion)}`, REGISTROS_POR_HORA, 3600);
  const global = limitar("registro:global", REGISTROS_GLOBALES_POR_HORA, 3600);

  if (!limite.permitido || !global.permitido) {
    const espera = Math.max(limite.esperaSeg, global.esperaSeg);
    return NextResponse.json(
      { error: "Demasiadas cuentas nuevas. Intenta más tarde." },
      { status: 429, headers: { "Retry-After": String(espera) } }
    );
  }

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
  // Solo la primera parte de la prueba. El resto llega al confirmar.
  const gratis = PRUEBA_INICIAL;

  // Cuenta y saldo se crean juntos: un usuario sin fila de saldo no
  // podría hablar, y el error aparecería mucho después.
  // La comprobación de arriba puede perder la carrera con otra petición
  // idéntica. La restricción única de la base es la que manda; aquí se
  // traduce a un mensaje entendible en vez de un error de servidor.
  let nuevoId: string;
  try {
    nuevoId = await sql.begin(async (tx) => {
      const [u] = await tx`
        insert into users ${sql({
          tipo_acceso: "email",
          ...campos,
          password_hash: hash,
          nombre,
          nivel,
          acepto_terminos_en: new Date(),
          version_legal: VERSION_LEGAL,
          autoriza_transferencia: true,
          autoriza_voz: true,
          declara_edad_o_acudiente: true,
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
  } catch (e) {
    const codigo = (e as { code?: string }).code;
    if (codigo === "23505") {
      return NextResponse.json(
        { error: "Ya hay una cuenta con esos datos. Inicia sesión." },
        { status: 409 }
      );
    }
    throw e;
  }

  // El correo se manda después de crear la cuenta: si el proveedor
  // falla, el alumno ya tiene cuenta y puede pedirlo de nuevo.
  const { enviado } = await enviarVerificacion({
    userId: nuevoId,
    nombre,
    email,
    origen: origenPublico(peticion),
  });

  return NextResponse.json(
    { ok: true, id: nuevoId, mensajes: gratis, correoEnviado: enviado },
    { status: 201 }
  );
}
