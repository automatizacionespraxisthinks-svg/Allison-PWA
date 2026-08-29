import Link from "next/link";
import { ACTUALIZADO, EMPRESA } from "@/lib/legal";

export const metadata = {
  title: "Términos y condiciones — Allison",
};

export default function PaginaTerminos() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href="/" className="text-sm text-texto-suave">
        ← Volver
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Términos y condiciones</h1>
      <p className="mt-1 text-sm text-texto-suave">
        Actualizados el {ACTUALIZADO}
      </p>

      <div className="mt-8 flex flex-col gap-7 text-[15px] leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">1. Quiénes somos</h2>
          <p className="mt-2">
            {EMPRESA.marca} es un servicio de {EMPRESA.razonSocial}, NIT {EMPRESA.nit},
            con domicilio en {EMPRESA.domicilio}. Al crear una cuenta aceptas estos
            términos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Qué es Allison</h2>
          <p className="mt-2">
            Allison es una profesora de inglés basada en inteligencia artificial.
            Escucha lo que dices, te corrige y conversa contigo.{" "}
            <strong>No es una persona</strong>, y no reemplaza a un profesor ni a un
            programa académico certificado.
          </p>
        </section>

        <section className="rounded-2xl border border-borde bg-superficie p-5">
          <h2 className="text-lg font-semibold">
            3. Allison se puede equivocar
          </h2>
          <p className="mt-2">
            Las respuestas y correcciones las genera un modelo de inteligencia
            artificial. Hacemos lo posible por que sean correctas —incluida una batería
            de pruebas que se ejecuta sobre los errores típicos de un hispanohablante—
            pero <strong>pueden contener errores</strong>.
          </p>
          <p className="mt-2">
            No garantizamos que aprendas inglés ni que alcances un nivel determinado.
            No usamos {EMPRESA.marca} para certificar niveles ni para emitir títulos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Tu cuenta</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>Los datos que registres deben ser verdaderos.</li>
            <li>
              Tu contraseña o tu PIN son tuyos. No los compartas: lo que se haga desde
              tu cuenta es tu responsabilidad.
            </li>
            <li>
              Si eres menor de edad, necesitas la autorización de tu padre, madre o
              acudiente.
            </li>
            <li>Una persona, una cuenta.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Mensajes, planes y recargas</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>
              <strong>Una intervención</strong> (o mensaje) es un turno de
              conversación: lo que dices tú (máximo 60 segundos) más lo que
              responde Allison. Las equivalencias en horas que mostramos son
              estimaciones informativas, no una promesa de duración.
            </li>
            <li>
              <strong>Prueba gratis:</strong> mensajes de regalo al crear tu cuenta.
              Parte al registrarte y el resto al confirmar tu correo.
            </li>
            <li>
              <strong>Recargas:</strong> los mensajes que compras{" "}
              <strong>no caducan</strong>.
            </li>
            <li>
              <strong>Planes:</strong> los mensajes del plan{" "}
              <strong>se gastan dentro del mes</strong> y no se acumulan para el
              siguiente. Al agotarse te preguntamos si quieres continuar; no hay cobro
              automático.
            </li>
            <li>
              Si Allison no logra responderte por un fallo nuestro,{" "}
              <strong>el mensaje se devuelve</strong> automáticamente a tu saldo.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Pagos y devoluciones</h2>
          <p className="mt-2">
            Los precios están en pesos colombianos. El cobro lo procesa una pasarela de
            pago; nosotros no vemos los datos de tu tarjeta.
          </p>
          <p className="mt-2">
            Conforme al Estatuto del Consumidor, puedes{" "}
            <strong>retractarte dentro de los cinco días hábiles</strong> siguientes a
            la compra, siempre que no hayas usado los mensajes. Si ya los usaste, se
            devuelve la parte proporcional no consumida.
          </p>
          <p className="mt-2">
            Para pedir una devolución escribe a <strong>{EMPRESA.correo}</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Convenios con colegios</h2>
          <p className="mt-2">
            Cuando un colegio contrata {EMPRESA.marca} para sus estudiantes,{" "}
            <strong>el pago se acuerda y se realiza directamente con la institución</strong>,
            por fuera de la plataforma. Los alumnos de ese colegio no pagan ni ven
            precios dentro de la aplicación.
          </p>
          <p className="mt-2">
            El colegio se compromete a haber recogido la autorización de los acudientes
            de los menores antes de entregarnos sus datos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Lo que no puedes hacer</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>Usar la cuenta de otra persona o prestar la tuya.</li>
            <li>Automatizar el uso del servicio con programas o guiones.</li>
            <li>Intentar saltarte los límites, los cobros o la seguridad.</li>
            <li>Usar Allison para contenido ilegal, ofensivo o para acosar a alguien.</li>
            <li>Revender el acceso.</li>
          </ul>
          <p className="mt-2">
            Si detectamos un uso así podemos suspender la cuenta. Si la suspensión no
            está justificada, te devolvemos el saldo sin usar.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Disponibilidad</h2>
          <p className="mt-2">
            Trabajamos para que el servicio esté siempre disponible, pero puede haber
            interrupciones por mantenimiento o por fallos de terceros de los que
            dependemos. No garantizamos disponibilidad ininterrumpida.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">10. Cerrar tu cuenta</h2>
          <p className="mt-2">
            Puedes cerrarla cuando quieras escribiendo a {EMPRESA.correo}. Los mensajes
            comprados y no usados se te devuelven según el punto 6. Conservamos los
            registros de pago que la ley nos obliga a guardar.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">11. Cambios en estos términos</h2>
          <p className="mt-2">
            Si los cambiamos te avisaremos por correo o dentro de la aplicación con
            antelación razonable. Si no estás de acuerdo, puedes cerrar tu cuenta y
            pedir la devolución del saldo no usado.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">12. Ley aplicable</h2>
          <p className="mt-2">
            Estos términos se rigen por las leyes de la República de Colombia.
            Cualquier controversia se resolverá ante los jueces competentes de{" "}
            {EMPRESA.domicilio}.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">13. Contacto</h2>
          <p className="mt-2">
            {EMPRESA.correo} · {EMPRESA.telefono}
          </p>
          <p className="mt-2">
            Consulta también nuestra{" "}
            <Link href="/legal/privacidad" className="text-primario underline">
              política de tratamiento de datos
            </Link>
            .
          </p>
        </section>
      </div>

      <p className="mt-10 rounded-xl border border-borde bg-superficie p-4 text-sm text-texto-suave">
        <strong>Nota:</strong> este documento es un borrador de trabajo. Antes de
        publicarlo debe revisarlo un abogado, y hay que completar los datos de la
        empresa que aparecen entre corchetes.
      </p>
    </main>
  );
}
