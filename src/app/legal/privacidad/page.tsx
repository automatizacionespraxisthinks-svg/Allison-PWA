import Link from "next/link";
import { ACTUALIZADO, EMPRESA, ENCARGADOS } from "@/lib/legal";

export const metadata = {
  title: "Política de tratamiento de datos — Allison",
};

export default function PaginaPrivacidad() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href="/" className="text-sm text-texto-suave">
        ← Volver
      </Link>

      <h1 className="mt-4 text-2xl font-bold">
        Política de tratamiento de datos personales
      </h1>
      <p className="mt-1 text-sm text-texto-suave">
        Actualizada el {ACTUALIZADO} · Ley 1581 de 2012 y Decreto 1377 de 2013
      </p>

      <div className="mt-8 flex flex-col gap-7 text-[15px] leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">1. Quién responde por tus datos</h2>
          <p className="mt-2">
            {EMPRESA.razonSocial}, NIT {EMPRESA.nit}, con domicilio en{" "}
            {EMPRESA.domicilio}, es la responsable del tratamiento de los datos
            personales recogidos a través de {EMPRESA.marca}.
          </p>
          <p className="mt-2">
            Para cualquier asunto relacionado con tus datos, escríbenos a{" "}
            <strong>{EMPRESA.correo}</strong> o llámanos al {EMPRESA.telefono}.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Qué datos recogemos</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>
              <strong>De tu cuenta:</strong> nombre, correo y, si lo registras,
              celular o nombre de usuario. Los alumnos de colegio solo dan nombre,
              usuario y PIN.
            </li>
            <li>
              <strong>Tu voz:</strong> los audios que grabas al hablar con Allison.
            </li>
            <li>
              <strong>Tus conversaciones:</strong> lo que dijiste, lo que respondió
              Allison y las correcciones.
            </li>
            <li>
              <strong>Tu progreso:</strong> días practicados, racha, errores
              frecuentes y temas.
            </li>
            <li>
              <strong>Tus pagos:</strong> monto, fecha y estado.{" "}
              <strong>No vemos ni guardamos los datos de tu tarjeta</strong> — eso lo
              maneja la pasarela de pago.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border-2 border-acento/40 bg-acento/5 p-5">
          <h2 className="text-lg font-semibold">3. Tu voz es un dato sensible</h2>
          <p className="mt-2">
            La grabación de tu voz puede considerarse un <strong>dato biométrico</strong>,
            y la ley colombiana lo clasifica como sensible. Eso significa dos cosas:
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>
              <strong>No estás obligado a dárnoslo.</strong> Puedes negarte, aunque sin
              tu voz la aplicación no puede funcionar: todo el producto consiste en
              hablar.
            </li>
            <li>
              Solo lo usamos para <strong>escucharte y corregirte</strong>. Nunca para
              identificarte, perfilarte ni entrenar modelos propios.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Para qué los usamos</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>Escucharte, corregirte y conversar contigo.</li>
            <li>Mostrarte tu progreso y qué temas se te atraviesan.</li>
            <li>Llevar la cuenta de tus mensajes y tus pagos.</li>
            <li>Avisarte por correo cuando se te acaben los mensajes o venza tu plan.</li>
            <li>
              Si eres alumno de un colegio: mostrarle al coordinador{" "}
              <strong>cuánto practicas</strong>, nunca de qué hablas.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border-2 border-acento/40 bg-acento/5 p-5">
          <h2 className="text-lg font-semibold">
            5. Tus datos salen de Colombia
          </h2>
          <p className="mt-2">
            Para que Allison funcione, tu audio y tus datos se procesan en{" "}
            <strong>Estados Unidos</strong>. Estados Unidos no figura en la lista de
            países con nivel adecuado de protección de la Superintendencia de Industria
            y Comercio, por lo que{" "}
            <strong>esta transferencia requiere tu autorización expresa</strong>, que
            das al crear tu cuenta.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-texto-suave">
                <tr>
                  <th className="py-1 pr-3 font-medium">Quién</th>
                  <th className="py-1 pr-3 font-medium">Dónde</th>
                  <th className="py-1 font-medium">Para qué</th>
                </tr>
              </thead>
              <tbody>
                {ENCARGADOS.map((e) => (
                  <tr key={e.nombre} className="border-t border-borde">
                    <td className="py-1.5 pr-3">{e.nombre}</td>
                    <td className="py-1.5 pr-3">{e.pais}</td>
                    <td className="py-1.5">{e.para}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            <strong>No vendemos tus datos a nadie</strong>, ni los usamos para
            publicidad.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Cuánto tiempo los guardamos</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>
              <strong>Conversaciones y audios: 20 días.</strong> Después se borran
              solos. También puedes borrarlos tú cuando quieras, desde la aplicación.
            </li>
            <li>
              <strong>Tu progreso y tu cuenta:</strong> mientras tengas cuenta abierta.
            </li>
            <li>
              <strong>Los registros de pagos:</strong> el tiempo que exige la ley
              comercial y tributaria, aunque cierres tu cuenta.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Menores de edad</h2>
          <p className="mt-2">
            {EMPRESA.marca} está pensada también para estudiantes de colegio. Cuando el
            usuario es menor de edad:
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>
              Se requiere la <strong>autorización de su padre, madre o acudiente</strong>.
            </li>
            <li>
              Si el menor entra a través de un colegio,{" "}
              <strong>el colegio declara haber recogido esa autorización</strong> antes
              de cargar al alumno.
            </li>
            <li>
              El tratamiento respeta el interés superior del niño y sus derechos
              fundamentales, conforme al artículo 7 de la Ley 1581.
            </li>
            <li>
              El acudiente puede pedirnos en cualquier momento que borremos los datos de
              su hijo escribiendo a {EMPRESA.correo}.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Tus derechos</h2>
          <p className="mt-2">Como titular de tus datos puedes:</p>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li><strong>Conocer</strong> qué datos tenemos sobre ti.</li>
            <li><strong>Actualizar</strong> o <strong>rectificar</strong> los que estén mal.</li>
            <li>
              <strong>Suprimirlos</strong>, salvo los que la ley nos obligue a conservar.
            </li>
            <li>
              <strong>Revocar</strong> la autorización que nos diste.
            </li>
            <li>
              Presentar quejas ante la <strong>Superintendencia de Industria y Comercio</strong>.
            </li>
          </ul>
          <p className="mt-3">
            Para ejercerlos, escribe a <strong>{EMPRESA.correo}</strong> con tu nombre y
            tu solicitud. Respondemos en un plazo máximo de{" "}
            <strong>diez días hábiles</strong> para consultas y{" "}
            <strong>quince días hábiles</strong> para reclamos, según lo previsto en la
            Ley 1581.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Cómo protegemos tus datos</h2>
          <p className="mt-2">
            Las contraseñas y los PIN se guardan cifrados y nunca en texto plano. Toda la
            comunicación viaja cifrada. El acceso a la base de datos está restringido, y
            un coordinador de colegio solo puede ver la actividad de sus propios alumnos,
            nunca sus conversaciones.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">10. Cambios</h2>
          <p className="mt-2">
            Si cambiamos esta política te avisaremos por correo o dentro de la
            aplicación. La fecha de arriba indica la última actualización.
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
