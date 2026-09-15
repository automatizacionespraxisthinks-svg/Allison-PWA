import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { entrarConGoogle } from "@/lib/entrada-google";
import { interpretar } from "@/lib/identificador";
import {
  anotarFallo,
  cuentaDeColegio,
  cuentaDeCorreo,
  entradaBloqueada,
  liberarCuenta,
} from "@/lib/intentos";
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
 *
 * La segunda no usa adaptador ni tabla de cuentas: la sesión es un JWT
 * y la cuenta vive en `users`, con `google_id` para reconocerla. Lo que
 * pasa al volver de Google (crear la cuenta con su consentimiento,
 * vincular una existente, verificar el correo) está en
 * src/lib/entrada-google.ts.
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

/**
 * El usuario de la base que corresponde a quien acaba de entrar.
 *
 * Con las credenciales, `user.id` es NUESTRO id: lo devolvió authorize.
 * Con Google es el `sub` de Google — un número largo que no es un uuid —
 * y buscarlo en la columna `id` revienta la consulta. Así estaba, y por
 * eso entrar con Google nunca llegó a funcionar aunque hubiera llaves.
 * A Google se le busca por su id o por el correo; el id primero, por si
 * la persona cambió el correo de su cuenta de Google.
 */
async function usuarioAlEntrar(
  user: { id?: string; email?: string | null } | undefined,
  account: { provider: string; providerAccountId: string } | null | undefined,
  emailDelToken: unknown
) {
  if (account?.provider === "google") {
    const sub = account.providerAccountId;
    const email = String(user?.email ?? emailDelToken ?? "").trim().toLowerCase();
    const [u] = await sql`
      select id, nombre, nivel, rol, institucion_id, email
        from users
       where (google_id = ${sub} or email = ${email}) and activo
       order by (google_id is not distinct from ${sub}) desc
       limit 1
    `;
    return u;
  }

  if (!user?.id) return undefined;
  const [u] = await sql`
    select id, nombre, nivel, rol, institucion_id, email
      from users where id = ${user.id}
  `;
  return u;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  // Los errores también vuelven a /entrar (con ?error=): la página sabe
  // explicarlos. Sin esto, un fallo al volver de Google caería en la
  // pantalla genérica de la librería, en inglés y sin salida.
  pages: { signIn: "/entrar", error: "/entrar" },
  trustHost: true,

  providers: [
    // Google solo se registra cuando hay llaves: registrado sin ellas,
    // el botón existiría y fallaría al tocarlo. Las pantallas lo ocultan
    // con el mismo criterio (googleConfigurado, en src/lib/google.ts).
    // Sin adaptador, "vincular por correo" lo decide entrarConGoogle:
    // solo si Google afirma haber verificado ese correo.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
    /**
     * Al volver de Google: entra, se crea la cuenta con su
     * consentimiento, o se le manda adonde corresponda (una ruta en vez
     * de true es una redirección, sin sesión).
     */
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      return entrarConGoogle(account.providerAccountId, profile);
    },

    async jwt({ token, user, account }) {
      // Al iniciar sesión, cargar el perfil completo en el token
      if (user || account) {
        const u = await usuarioAlEntrar(user, account, token.email);

        // Sin usuario no hay sesión: un token a medias dejaría a la
        // persona "entrada" pero sin identidad, rebotando entre pantallas.
        if (!u) return null;

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
