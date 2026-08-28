import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import type { Nivel } from "@/lib/tipos";

/**
 * Autenticación con tres puertas de entrada:
 *
 *   1. Correo y contraseña       — público general
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
      email?: string | null;
    };
  }
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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      id: "correo",
      name: "Correo y contraseña",
      credentials: { email: {}, password: {} },
      async authorize(datos) {
        const email = String(datos.email ?? "").trim().toLowerCase();
        const password = String(datos.password ?? "");
        if (!email || !password) return null;

        const [u] = await sql`
          select id, nombre, nivel, rol, institucion_id, email, password_hash, activo
            from users
           where email = ${email} and tipo_acceso = 'email'
           limit 1
        `;
        if (!u || !u.activo || !u.password_hash) return null;
        if (!(await bcrypt.compare(password, u.password_hash))) return null;

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
      async authorize(datos) {
        const codigo = String(datos.codigo ?? "").trim();
        const username = String(datos.username ?? "").trim().toLowerCase();
        const pin = String(datos.pin ?? "");
        if (!codigo || !username || !pin) return null;

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
        if (!u || !u.activo || !u.pin_hash) return null;
        if (!(await bcrypt.compare(pin, u.pin_hash))) return null;

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
          insert into users (tipo_acceso, email, google_id, nombre, nivel, email_verificado_en)
          values ('email', ${email}, ${account.providerAccountId},
                  ${profile.name ?? "Estudiante"}, 'A1', now())
          returning id
        `;
        await sql`
          insert into saldos (user_id, mensajes_recarga)
          values (${nuevo.id}, ${Number(process.env.MENSAJES_PRUEBA_GRATIS ?? 20)})
          on conflict (user_id) do nothing
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
          token.uid = u.id;
          token.nombre = u.nombre;
          token.nivel = u.nivel;
          token.rol = u.rol;
          token.institucionId = u.institucion_id;
          token.email = u.email;
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.uid as string,
        nombre: token.nombre as string,
        nivel: token.nivel as Nivel,
        rol: token.rol as "estudiante" | "coordinador" | "admin",
        institucionId: (token.institucionId as string | null) ?? null,
        email: (token.email as string | null) ?? null,
      };
      return session;
    },
  },
});
