import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { interpretar } from "@/lib/identificador";
import {
  anotarFallo,
  cuentaDeColegio,
  cuentaDeCorreo,
  entradaBloqueada,
  liberarCuenta,
} from "@/lib/intentos";
import { VERSION_LEGAL } from "@/lib/legal";
import { PRUEBA_TOTAL } from "@/lib/verificacion";
import type { Nivel } from "@/lib/tipos";

/**
 * Autenticación con tres puertas de entrada:
 *
 *   1. Correo, celular o usuario — público general
 *   2. Google                    — público general
 *   3. Colegio + usuario + PIN   — alumnos de institución
 *
 * La tercera existe porque un estudiante de colegio público en Colombia
 * muchas veces no tiene correo electrónico. Exigirlo cerraría la puerta
 * al mercado principal.
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nombre: string;
      nivel: Nivel;
      rol: "estudiante" | "coordinador" | "admin";
      institucionId: string | null;
      /** Nombre propio en vez de "email": la librería lo declara
       *  obligatorio, y un alumno de colegio legítimamente no tiene. */
      correo: string | null;
      /** Cuándo INICIÓ SESIÓN, en segundos. Sirve para invalidar las
       *  sesiones anteriores a un cambio de contraseña. */
      emitidaEn: number;
    };
  }
}

/**
 * El único motivo de fallo que se le dice a quien intenta entrar: que
 * espere. No dice si la cuenta existe, porque el bloqueo se aplica igual
 * a las cuentas inventadas (ver src/lib/intentos.ts).
 */
class DemasiadosIntentos extends CredentialsSignin {
  code = "demasiados_intentos";
}

interface UsuarioAutenticado {
  id: string;
  nombre: string;
  nivel: Nivel;
  rol: "estudiante" | "coordinador" | "admin";
  institucionId: string | null;
  email: string | null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/entrar" },
  trustHost: true,

  providers: [
    // Google solo se registra cuando hay llaves: registrado sin ellas,
    // el botón existiría y fallaría al tocarlo. La pantalla de entrar
    // lo oculta con el mismo criterio (hayGoogle).
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    Credentials({
      id: "acceso",
      name: "Correo, celular o usuario",
      credentials: { identificador: {}, password: {} },
      async authorize(datos, peticion) {
        const password = String(datos.password ?? "");
        const id = interpretar(String(datos.identificador ?? ""));
        if (!password || id.error || !id.valor) return null;

        const cuenta = cuentaDeCorreo(String(datos.identificador ?? ""))!;
        if (entradaBloqueada(cuenta, peticion)) throw new DemasiadosIntentos();

        // Se busca por la columna que corresponda al tipo detectado.
        const columna =
          id.tipo === "email" ? "email" : id.tipo === "telefono" ? "telefono" : "username";

        const [u] = await sql`
          select id, nombre, nivel, rol, institucion_id, email, password_hash, activo
            from users
           where ${sql(columna)} = ${id.valor}
             and tipo_acceso = 'email'
             and institucion_id is null
           limit 1
        `;
        if (
          !u ||
          !u.activo ||
          !u.password_hash ||
          !(await bcrypt.compare(password, u.password_hash))
        ) {
          anotarFallo(cuenta, peticion);
          return null;
        }
        liberarCuenta(cuenta);

        return {
          id: u.id,
          nombre: u.nombre,
          nivel: u.nivel,
          rol: u.rol,
          institucionId: u.institucion_id,
          email: u.email,
        } satisfies UsuarioAutenticado as never;
      },
    }),

    Credentials({
      id: "colegio",
      name: "Código de colegio",
      credentials: { codigo: {}, username: {}, pin: {} },
      async authorize(datos, peticion) {
        const codigo = String(datos.codigo ?? "").trim();
        const username = String(datos.username ?? "").trim().toLowerCase();
        const pin = String(datos.pin ?? "");
        if (!codigo || !username || !pin) return null;

        const cuenta = cuentaDeColegio(codigo, username);
        if (entradaBloqueada(cuenta, peticion)) throw new DemasiadosIntentos();

        const [u] = await sql`
          select u.id, u.nombre, u.nivel, u.rol, u.institucion_id, u.pin_hash, u.activo
            from users u
            join instituciones i on i.id = u.institucion_id
           where i.codigo_acceso = ${codigo}
             and i.estado = 'activa'
             and lower(u.username) = ${username}
             and u.tipo_acceso = 'institucional'
           limit 1
        `;
        if (!u || !u.activo || !u.pin_hash || !(await bcrypt.compare(pin, u.pin_hash))) {
          anotarFallo(cuenta, peticion);
          return null;
        }
        liberarCuenta(cuenta);

        return {
          id: u.id,
          nombre: u.nombre,
          nivel: u.nivel,
          rol: u.rol,
          institucionId: u.institucion_id,
          email: null,
        } satisfies UsuarioAutenticado as never;
      },
    }),
  ],

  callbacks: {
    /** Al entrar con Google creamos la cuenta si no existía. */
    async signIn({ account, profile }) {
      if (account?.provider !== "google" || !profile?.email) return true;

      const email = profile.email.toLowerCase();
      const [existe] = await sql`select id from users where email = ${email} limit 1`;

      if (!existe) {
        const [nuevo] = await sql`
          insert into users
            (tipo_acceso, email, google_id, nombre, nivel, email_verificado_en,
             acepto_terminos_en, version_legal, autoriza_transferencia,
             autoriza_voz, declara_edad_o_acudiente)
          values ('email', ${email}, ${account.providerAccountId},
                  ${profile.name ?? "Estudiante"}, 'A1', now(),
                  now(), ${VERSION_LEGAL}, true, true, true)
          returning id
        `;
        // Google ya verificó el correo: no hay nada que confirmar, así
        // que la prueba se entrega completa de una vez.
        await sql`
          insert into saldos (user_id, mensajes_recarga)
          values (${nuevo.id}, ${PRUEBA_TOTAL})
          on conflict (user_id) do nothing
        `;
        await sql`
          insert into movimientos_credito
            (user_id, tipo, bolsa, cantidad, saldo_plan_despues,
             saldo_recarga_despues, nota)
          values
            (${nuevo.id}, 'bono', 'recarga', ${PRUEBA_TOTAL}, 0, ${PRUEBA_TOTAL},
             'Prueba completa: Google ya verificó el correo')
        `;
      }
      return true;
    },

    async jwt({ token, user, account }) {
      // Al iniciar sesión, cargar el perfil completo en el token
      if (user || account) {
        const email = (user as { email?: string | null } | undefined)?.email ?? token.email;
        const id = (user as { id?: string } | undefined)?.id;

        const [u] = id
          ? await sql`select id, nombre, nivel, rol, institucion_id, email from users where id = ${id}`
          : await sql`select id, nombre, nivel, rol, institucion_id, email from users where email = ${String(email ?? "")}`;

        if (u) {
          // Se fija UNA vez, al iniciar sesión, y no se vuelve a tocar.
          // No sirve `iat`: Auth.js lo refresca en cada petición, así
          // que el token siempre parecería recién emitido y nunca
          // quedaría por detrás de un cambio de contraseña.
          token.emitida = Math.floor(Date.now() / 1000);
          token.uid = u.id;
          token.nombre = u.nombre;
          token.nivel = u.nivel;
          token.rol = u.rol;
          token.institucionId = u.institucion_id;
          token.correo = u.email;
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        // `email` y `emailVerified` los exige el tipo del adaptador de la
        // librería, que aquí no se usa: la sesión es JWT. La aplicación
        // lee `correo`, que sí admite null para los alumnos de colegio.
        email: (token.correo as string | undefined) ?? "",
        emailVerified: null,

        id: token.uid as string,
        nombre: token.nombre as string,
        nivel: token.nivel as Nivel,
        rol: token.rol as "estudiante" | "coordinador" | "admin",
        institucionId: (token.institucionId as string | null) ?? null,
        // Los alumnos de colegio no tienen correo: null es un valor válido.
        correo: (token.correo as string | undefined) ?? null,
        emitidaEn: (token.emitida as number | undefined) ?? 0,
      };
      return session;
    },
  },
});
